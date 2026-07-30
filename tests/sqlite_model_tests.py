from __future__ import annotations

import json
import sqlite3
import tempfile
from pathlib import Path


def create_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        PRAGMA journal_mode=WAL;
        PRAGMA foreign_keys=ON;
        CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
        CREATE TABLE refs (
          stable_key TEXT PRIMARY KEY,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          account_key TEXT NOT NULL DEFAULT '',
          due_at INTEGER NOT NULL DEFAULT 0,
          completed_at INTEGER NOT NULL DEFAULT 0,
          group_id TEXT NOT NULL DEFAULT '',
          case_id TEXT NOT NULL DEFAULT '',
          conversation_key TEXT NOT NULL DEFAULT '',
          workflow_status TEXT NOT NULL DEFAULT 'active',
          follow_up_at INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE groups_data (group_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL);
        CREATE TABLE rules (rule_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL);
        CREATE TABLE cases_data (case_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL, updated_at INTEGER NOT NULL);
        CREATE TABLE templates (template_id TEXT PRIMARY KEY, payload TEXT NOT NULL, sort_order INTEGER NOT NULL, updated_at INTEGER NOT NULL);
        CREATE TABLE state_data (key TEXT PRIMARY KEY, payload TEXT NOT NULL);
        """
    )


def upsert_ref(connection: sqlite3.Connection, key: str, payload: dict, updated_at: int) -> None:
    connection.execute(
        """
        INSERT INTO refs(
          stable_key,payload,updated_at,account_key,due_at,completed_at,
          group_id,case_id,conversation_key,workflow_status,follow_up_at
        ) VALUES(?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(stable_key) DO UPDATE SET
          payload=excluded.payload,
          updated_at=excluded.updated_at,
          account_key=excluded.account_key,
          due_at=excluded.due_at,
          completed_at=excluded.completed_at,
          group_id=excluded.group_id,
          case_id=excluded.case_id,
          conversation_key=excluded.conversation_key,
          workflow_status=excluded.workflow_status,
          follow_up_at=excluded.follow_up_at
        """,
        (
            key,
            json.dumps(payload, sort_keys=True),
            updated_at,
            payload.get("accountKey", ""),
            payload.get("dueAt", 0),
            payload.get("completedAt", 0),
            payload.get("groupId", ""),
            payload.get("caseId", ""),
            payload.get("conversationKey", ""),
            payload.get("workflowStatus", "active"),
            payload.get("followUpAt", 0),
        ),
    )


def main() -> None:
    with tempfile.TemporaryDirectory() as directory:
        database = Path(directory) / "pin-mails.sqlite"
        connection = sqlite3.connect(database)
        create_schema(connection)
        connection.execute("BEGIN IMMEDIATE")
        upsert_ref(connection, "a", {"subject": "A", "accountKey": "acc"}, 10)
        upsert_ref(connection, "b", {"subject": "B", "accountKey": "acc"}, 10)
        connection.execute(
            "INSERT INTO meta(key,value) VALUES('revision','1') ON CONFLICT(key) DO UPDATE SET value=excluded.value"
        )
        connection.commit()

        row_a_before = connection.execute(
            "SELECT rowid,payload,updated_at FROM refs WHERE stable_key='a'"
        ).fetchone()
        connection.execute("BEGIN IMMEDIATE")
        upsert_ref(connection, "b", {"subject": "B2", "accountKey": "acc"}, 20)
        connection.execute(
            "INSERT INTO state_data(key,payload) VALUES('dashboard','{}') ON CONFLICT(key) DO UPDATE SET payload=excluded.payload"
        )
        connection.execute(
            "INSERT INTO meta(key,value) VALUES('revision','2') ON CONFLICT(key) DO UPDATE SET value=excluded.value"
        )
        connection.commit()

        row_a_after = connection.execute(
            "SELECT rowid,payload,updated_at FROM refs WHERE stable_key='a'"
        ).fetchone()
        assert row_a_before == row_a_after, "An unrelated incremental write must not rewrite ref a"
        payload_b = json.loads(
            connection.execute("SELECT payload FROM refs WHERE stable_key='b'").fetchone()[0]
        )
        assert payload_b["subject"] == "B2"

        connection.execute("BEGIN IMMEDIATE")
        connection.execute("DELETE FROM refs WHERE stable_key='a'")
        connection.commit()
        assert connection.execute("SELECT count(*) FROM refs").fetchone()[0] == 1
        assert connection.execute("PRAGMA quick_check").fetchone()[0] == "ok"
        assert connection.execute("PRAGMA foreign_key_check").fetchall() == []
        connection.execute("PRAGMA optimize")
        connection.execute("PRAGMA wal_checkpoint(PASSIVE)")
        connection.close()

    print("SQLite model tests 3.1.0: OK")


if __name__ == "__main__":
    main()
