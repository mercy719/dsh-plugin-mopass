/**
 * dsh-plugin-mopass host entry.
 *
 * The provider route itself is composition: this bundle's cordis.patch.yml
 * pins the `mopass` base route on the `llm-pi-ai` adapter row, and the user's
 * API key and model list live in their settings document (written by the web
 * Models page). The bundle deliberately does not mount this module as a
 * runtime plugin: Mopass is optional and a missing package must not prevent
 * the rest of the web profile from booting.
 */
export const name = 'dsh-plugin-mopass'

/** Package entry point for tooling; the bundle patch carries the provider. */
export function apply() {
  // No runtime service is needed.
}
