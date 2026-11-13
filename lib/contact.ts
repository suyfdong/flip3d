// Single source of truth for how people reach the site owner. Referenced by
// About / Privacy / Terms so the address only has to change in one place.
//
// ⚠️ The mailbox must actually receive mail before anything points at it:
// Cloudflare Email Routing (free, DNS-only) can forward this address to a real
// inbox. A dead contact address is worse than none at all.

export const CONTACT_EMAIL = "contact@flip3d.app";

export const GITHUB_REPO_URL = "https://github.com/suyfdong/flip3d";
export const GITHUB_ISSUES_URL = "https://github.com/suyfdong/flip3d/issues";
