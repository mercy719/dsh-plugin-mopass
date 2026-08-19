/**
 * dsh-plugin-mopass host entry.
 *
 * The provider route itself is composition: this bundle's cordis.patch.yml
 * pins the `mopass` base route on the `llm-pi-ai` adapter row, and the user's
 * API key and model list live in their settings document (written by the web
 * Models page). This entry exists so the bundle owns a loadable plugin row
 * (identity, diagnostics, and a place for future provider-side helpers); it
 * performs no work at load.
 */
export const name = 'dsh-plugin-mopass'

/** No-op apply: the bundle's patch carries the provider route. */
export function apply() {
  // The base route is what this plugin is; nothing to start or stop here.
}
