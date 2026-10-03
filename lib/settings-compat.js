/**
 * Compatibility shim: restores the @deepseek-ai/dsh-settings 0.1.x helpers that
 * were removed in DSH Desktop 2.0.17 (dsh-settings 0.2.0-rc.2), on top of the
 * new settings architecture:
 *
 * - Settings namespaces are now auto-derived from mounted profile entries; the
 *   namespace id IS the profile entry id (`llm-grok`), so `settingsNamespace()`
 *   is the identity function.
 * - The settings form schema is read from the plugin module's exported
 *   `Config`, so the old `installSettingsSection` schema registration step is
 *   no longer needed. Non-volatile config writes remount the entry, which
 *   re-runs `apply()` with a fresh closure; the shim only has to seed the
 *   initial value and fire the install-time `onChange()` that drives
 *   `oauth.hydrate()`.
 * - The login UI drives state through the plugin's own `/api/llm-grok/*`
 *   routes plus `/status` polling, so no config-change subscription is
 *   required. Status writes go through `settings.update()`; the status fields
 *   are declared `.volatile()` in `Config`, which dsh-settings 0.2.0 requires
 *   for any plugin-initiated write.
 */

export function deepEqualJson(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || typeof a !== 'object') {
    return typeof a === 'number' && Number.isNaN(a) && Number.isNaN(b);
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.hasOwn(b, key) || !deepEqualJson(a[key], b[key])) return false;
  }
  return true;
}

export function settingsNamespace(name) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('settingsNamespace() needs a non-empty namespace name');
  }
  return name;
}

export function installSettingsSection(ctx, ns, Config, config, handlers = {}) {
  const { setSource, onChange } = handlers;
  // `setSource` must receive a *getter* (the 0.1.x contract: the plugin calls
  // `current()` to read the latest config). Passing the raw config object
  // overwrites the plugin's callable `current` with a plain object and the
  // next `current()` call throws `TypeError: current is not a function`.
  if (typeof setSource === 'function') setSource(() => config);
  if (typeof onChange === 'function') onChange();
  return () => {};
}
