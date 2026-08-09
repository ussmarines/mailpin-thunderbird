(function(scope) {
  "use strict";

  function create(dependencies = {}) {
    const {MailServices, MailUtils, MessageArchiver, ChromeUtils, Ci} = dependencies;

    function accountList() {
      const source = MailServices?.accounts?.accounts;
      if (!source) return [];
      try { return [...source]; } catch {}
      const accounts = [];
      const length = Math.max(0, Number(source.length) || 0);
      for (let index = 0; index < length; index += 1) {
        try {
          const account = source.queryElementAt?.(index, Ci?.nsIMsgAccount) ?? source.GetElementAt?.(index);
          if (account) accounts.push(account);
        } catch {}
      }
      return accounts;
    }

    function accountKeyForAccount(account) {
      return String(account?.key || "unknown");
    }

    function identityEmails() {
      const emails = new Set();
      try {
        for (const identity of MailServices?.accounts?.allIdentities || []) {
          const email = String(identity?.email || "").trim().toLowerCase();
          if (email) emails.add(email);
        }
      } catch {}
      return emails;
    }

    function folderChildren(folder) {
      const result = [];
      if (!folder) return result;
      try {
        for (const child of folder.subFolders) result.push(child.QueryInterface(Ci.nsIMsgFolder));
        return result;
      } catch {}
      try {
        const children = folder.subFolders;
        while (children?.hasMoreElements?.()) result.push(children.getNext().QueryInterface(Ci.nsIMsgFolder));
      } catch {}
      return result;
    }

    function walkFolders(root) {
      const result = [];
      const stack = root ? [root] : [];
      const seen = new Set();
      while (stack.length) {
        const folder = stack.pop();
        const uri = String(folder?.URI || "");
        if (!folder || (uri && seen.has(uri))) continue;
        if (uri) seen.add(uri);
        result.push(folder);
        for (const child of folderChildren(folder)) stack.push(child);
      }
      return result;
    }

    function accountForFolder(folder) {
      if (!folder?.server) return null;
      try {
        const account = MailServices?.accounts?.findAccountForServer?.(folder.server);
        if (account) return account;
      } catch {}
      const serverKey = String(folder.server.key || "");
      return accountList().find(account =>
        account?.incomingServer === folder.server ||
        (serverKey && String(account?.incomingServer?.key || "") === serverKey)
      ) || null;
    }

    function accountKeyForFolder(folder) {
      return accountKeyForAccount(accountForFolder(folder));
    }

    function accountNameForFolder(folder) {
      return String(
        accountForFolder(folder)?.incomingServer?.prettyName ||
        folder?.server?.prettyName ||
        "Compte inconnu"
      );
    }

    function folderForURL(uri) {
      if (!uri) return null;
      try { return MailServices?.folderLookup?.getFolderForURL?.(uri) || null; } catch { return null; }
    }

    function accountByKey(accountKey) {
      const key = String(accountKey || "");
      return accountList().find(account => accountKeyForAccount(account) === key) || null;
    }

    function findHeaderInFolder(folder, ref, fingerprint) {
      if (!folder) return null;
      const matches = hdr => !ref?.identityFingerprint || fingerprint?.(hdr) === ref.identityFingerprint;
      try {
        const database = folder.msgDatabase;
        if (ref?.headerMessageId) {
          const found = database?.getMsgHdrForMessageID?.(ref.headerMessageId);
          if (found && matches(found)) return found;
        }
        if (ref?.lastMessageKey && database?.containsKey?.(ref.lastMessageKey)) {
          const found = database.getMsgHdrForKey(ref.lastMessageKey);
          if (found && matches(found)) return found;
        }
        let inspected = 0;
        const messages = folder.messages;
        while (messages?.hasMoreElements?.() && inspected++ < 20_000) {
          const header = messages.getNext().QueryInterface(Ci.nsIMsgDBHdr);
          if (ref?.identityFingerprint && fingerprint?.(header) === ref.identityFingerprint) return header;
          if (!ref?.identityFingerprint && ref?.headerMessageId && String(header?.messageId || "") === ref.headerMessageId) return header;
        }
      } catch {}
      return null;
    }

    function registerFolderListener(callbacks = {}) {
      const mfn = MailServices?.mfn;
      if (!mfn?.addListener || !ChromeUtils?.generateQI) return {registered: false, dispose() {}};
      const listener = {
        QueryInterface: ChromeUtils.generateQI(["nsIMsgFolderListener"]),
        msgAdded(msg) { callbacks.msgAdded?.(msg); },
        msgsDeleted(msgs) { callbacks.msgsDeleted?.([...(msgs || [])]); },
        msgsMoveCopyCompleted(move, srcMsgs, destFolder, destMsgs) {
          callbacks.msgsMoveCopyCompleted?.(move, [...(srcMsgs || [])], destFolder, destMsgs ? [...destMsgs] : []);
        },
        msgsClassified(msgs) { callbacks.msgsClassified?.([...(msgs || [])]); },
        msgPropertyChanged(msg, property, oldValue, newValue) { callbacks.msgPropertyChanged?.(msg, property, oldValue, newValue); },
        msgKeyChanged(oldKey, newHdr) { callbacks.msgKeyChanged?.(oldKey, newHdr); },
        folderRenamed(oldFolder, newFolder) { callbacks.folderRenamed?.(oldFolder, newFolder); }
      };
      const flags = mfn.msgAdded | mfn.msgsDeleted | mfn.msgsMoveCopyCompleted |
        mfn.msgsClassified | mfn.msgPropertyChanged | mfn.msgKeyChanged | mfn.folderRenamed;
      mfn.addListener(listener, flags);
      let disposed = false;
      return {
        registered: true,
        listener,
        dispose() {
          if (disposed) return;
          disposed = true;
          try { mfn.removeListener(listener); } catch {}
        }
      };
    }

    function displayMessageInFolderTab(header) {
      if (!header || !MailUtils?.displayMessageInFolderTab) return false;
      MailUtils.displayMessageInFolderTab(header, true);
      return true;
    }

    function displayMessage(header) {
      if (!header || !MailUtils?.displayMessage) return false;
      MailUtils.displayMessage(header);
      return true;
    }

    function openReply(header, msgWindow = null) {
      if (!header?.folder || !MailServices?.compose?.OpenComposeWindow || !MailUtils?.getIdentityForHeader) return false;
      const uri = header.folder.getUriForMsg(header);
      const [identity] = MailUtils.getIdentityForHeader(header);
      MailServices.compose.OpenComposeWindow(
        null,
        header,
        uri,
        Ci.nsIMsgCompType.ReplyToSender,
        Ci.nsIMsgCompFormat.Default,
        identity || null,
        "",
        msgWindow || null,
        null,
        false
      );
      return true;
    }

    function archive(headers, msgWindow = null, onComplete = null) {
      const usable = (headers || []).filter(Boolean);
      if (!usable.length || typeof MessageArchiver !== "function") return false;
      const archiver = new MessageArchiver();
      archiver.msgWindow = msgWindow || null;
      if (typeof onComplete === "function") archiver.oncomplete = onComplete;
      archiver.archiveMessages(usable);
      return true;
    }

    function capabilities() {
      return Object.freeze({
        accounts: Boolean(MailServices?.accounts?.accounts),
        folderLookup: Boolean(MailServices?.folderLookup?.getFolderForURL),
        folderNotifications: Boolean(MailServices?.mfn?.addListener && MailServices?.mfn?.removeListener),
        displayMessage: Boolean(MailUtils?.displayMessageInFolderTab),
        composeReply: Boolean(MailServices?.compose?.OpenComposeWindow && MailUtils?.getIdentityForHeader),
        archive: typeof MessageArchiver === "function"
      });
    }

    return Object.freeze({
      accountList,
      accountKeyForAccount,
      identityEmails,
      folderChildren,
      walkFolders,
      accountForFolder,
      accountKeyForFolder,
      accountNameForFolder,
      accountByKey,
      folderForURL,
      findHeaderInFolder,
      registerFolderListener,
      displayMessageInFolderTab,
      displayMessage,
      openReply,
      archive,
      capabilities
    });
  }

  scope.PinThunderbirdMessages = Object.freeze({create});
})(this);
