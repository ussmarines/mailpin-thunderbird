# Project patterns

## Privilege narrowing

**When to use:** A page needs a Thunderbird or storage operation.

**How:** Expose a small schema method, validate again in the Experiment, then call the narrow compatibility adapter or pure module.

**Trade-off:** More explicit contracts, with a much smaller privileged surface.

## Optional capability degradation

**When to use:** Tags, Agenda or provider-specific behavior may be absent.

**How:** Detect the capability, disable only the dependent feature, and retain sanitized diagnostics.

**Trade-off:** More UI states, but core pinning remains available.

## Derived view, single source

**When to use:** Today, Review, smart views or statistics.

**How:** Calculate from pinned references and timestamps rather than persisting a second task collection.

**Trade-off:** Some recomputation at load time, with no synchronization drift.

## Safe import

**When to use:** Restoring settings/data.

**How:** Bound and normalize input, neutralize automation and local links, preview conflicts, create a backup, then transact.

**Trade-off:** More confirmation steps, with lower risk from hostile or stale imports.

## Exact resource ownership

**When to use:** Managing Thunderbird tags or external files.

**How:** Require exact identity plus expected label/checksum before modification or deletion.

**Trade-off:** Collisions block automation rather than risking user-owned data.
