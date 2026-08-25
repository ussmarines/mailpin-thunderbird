Thanks, that helps clarify the direction.

I looked into `ThreadPaneColumns` and existing add-on Experiments using it. It does appear to be the right existing primitive for table view: `addCustomColumn()` already owns native column registration and works with `nsIMsgDBHdr` callbacks. XNote's `customColumn` Experiment is one concrete example, and other add-ons are doing similar thin wrappers around `ThreadPaneColumns`.

The important limitation is exactly the one mentioned above: custom columns are currently table-view only. The cards layout uses a fixed set of fields, so a wrapper around `ThreadPaneColumns` alone would not give an extension a no-effort cross-layout API.

I also have a small prototype of the higher-level abstraction from this issue running on Thunderbird 154.0. I tested it against two separate real profiles forced to the native table and cards layouts. In both modes it injects exactly one action, delivers `onClicked` using standard WebExtension `MessageHeader`/tab objects, leaves native read flags and folder counters unchanged, and cleans up on uninstall. The prototype currently performs its own DOM integration for cards/table, so I would not propose that implementation as final if Thunderbird prefers the table side to be backed by `ThreadPaneColumns`.

Given the new-message-database work, would a useful next step be to treat this as a transitional Experiment design rather than a core API proposal for now: use `ThreadPaneColumns` as the table-view backend where possible, keep a small cards-view adapter behind the same high-level WebExtension-facing contract, and revisit the backend once the new message database/API design settles?

If that direction is useful, I can reshape the prototype that way before opening any PR. If you would rather avoid introducing even a transitional Experiment until the new database design is settled, I am also happy to hold off and use this issue only to capture the desired cross-layout contract.
