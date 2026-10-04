// Selective 2.1.1 pattern: native tags, with strict local ownership proofs.
export const TAG_SPECS = Object.freeze({
  followup: {key: "mailpin-native-followup", tag: "MailPin", color: "#4e7569"},
  waiting: {key: "mailpin-native-waiting", tag: "MailPin · Waiting", color: "#47758e"},
  overdue: {key: "mailpin-native-overdue", tag: "MailPin · Overdue", color: "#a95d4e"},
  today: {key: "mailpin-native-today", tag: "MailPin · Today", color: "#9b7040"}
});
const same = (tag, spec) => tag?.key === spec.key && tag.tag === spec.tag &&
  String(tag.color).toLowerCase() === spec.color;

export class NativeTags {
  constructor(api) { this.api = api; }
  async owned(registry) {
    const tags = await this.api.messages.tags.list();
    return Object.values(TAG_SPECS).filter(spec => registry?.[spec.key] === true &&
      same(tags.find(tag => tag.key === spec.key), spec)).map(spec => spec.key);
  }
  async ensure(registry, persist) {
    const tags = await this.api.messages.tags.list();
    // Preflight every collision before creating anything. Never adopt a tag.
    for (const spec of Object.values(TAG_SPECS)) {
      const existing = tags.find(tag => tag.key === spec.key);
      if (existing && !(registry?.[spec.key] === true && same(existing, spec))) {
        throw new Error("MailPin tag collision; personal tags left intact");
      }
    }
    for (const spec of Object.values(TAG_SPECS)) {
      if (tags.some(tag => same(tag, spec))) continue;
      await this.api.messages.tags.create(spec.key, spec.tag, spec.color);
      registry[spec.key] = true;
      // Persist proof immediately, including when a later creation fails.
      await persist(registry);
    }
  }
  desired(ref, enabled) {
    if (!enabled || !ref || ref.completedAt || ref.workflowStatus === "completed") return [];
    const keys = [TAG_SPECS.followup.key];
    const due = ref.dueAt || ref.followUpAt || ref.noReplyAt;
    const today = due && new Date(due).toDateString() === new Date().toDateString();
    if (due && due < Date.now() && !today) keys.push(TAG_SPECS.overdue.key);
    else if (today) keys.push(TAG_SPECS.today.key);
    else if (ref.workflowStatus === "waiting") keys.push(TAG_SPECS.waiting.key);
    return keys;
  }
  async update(message, ref, enabled, registry) {
    return this.updateDesired(message, this.desired(ref, enabled), registry);
  }
  async updateDesired(message, desired, registry) {
    const owned = new Set(await this.owned(registry));
    // Re-read after resolution: do not overwrite a personal tag changed meanwhile.
    const fresh = await this.api.messages.get(message.id);
    const tags = [...new Set([...(fresh.tags || []).filter(key => !owned.has(key)),
      ...desired.filter(key => owned.has(key))])];
    if ([...(fresh.tags || [])].sort().join("\0") !== [...tags].sort().join("\0")) {
      await this.api.messages.update(message.id, {tags});
    }
  }
  async removeDefinitions(registry) {
    for (const key of await this.owned(registry)) {
      await this.api.messages.tags.delete(key);
      delete registry[key];
    }
  }
}
