# SvS GitHub Pages Deployment Package

Status: `Prepared — do not publish yet`

The repository package is prepared to deploy **only** the contents of `site/` as the public web root through `.github/workflows/deploy-pages.yml`. The workflow is manual (`workflow_dispatch`) so adding it to a repository does not itself publish the site. No server-side runtime is used by the current prototype.

## GitHub Pages settings

- Publish directory: `site`
- Entry document: `index.html`
- Deployment source: GitHub Actions; never branch-root publishing for this repository layout
- Custom domain supplied by owner: `svsam.com` — currently hosts unrelated content, expires 30 October 2026, and registrar/DNS/repository control is unverified
- HTTPS: required
- Automatic form handling: disabled
- Analytics/tracking: disabled until privacy review and an explicit need exist
- Agency diagnostic delivery: visitor-initiated `mailto:` handoff; the site itself receives nothing
- Hospitality and consumer forms: processed locally in the browser; no request is transmitted by the site
- Partner connections: disabled; no live inventory, price, availability, referral, reservation, payment, or post-booking support
- Indexing: blocked by page metadata and `site/robots.txt` until launch readiness passes

## Pre-publication gate

Do not deploy publicly or remove the indexing block until all of the following are evidenced:

- `SvS` / `SvSam` has been supplied as the temporary working name, but its name/trade-mark and final legal presentation must be cleared before launch; `SvSignal` is a rejected historical label and must not be deployed.
- The owner has authorised whether the existing `svsam.com` site will be replaced, separated, or retained, and the domain has been renewed safely before expiry.
- Control and MFA are verified for the target GitHub account/repository, registrar, DNS, business mailbox, and recovery routes.
- Full legal operator name, sole-trader structure, correspondence address, and exact public email are recorded and checked in the final privacy/invoice/contract presentation.
- Employment/IP restrictions are resolved.
- Privacy notice, complaints route, LIA, ICO fee assessment, suppression process, and retention procedure are approved.
- Contract, DPA, liability, insurance, and invoice positions are ready for the actual operator.
- Every public claim, price, link, sample label, email route, mobile layout, and accessibility check passes.
- Every enabled travel-provider relationship is evidenced in writing; provider names, data, marks, links, and commercial disclosures comply with the applicable terms.
- Sam explicitly approves the first public deployment and any DNS change.

## Deployment verification

Before the first run, review [the GitHub Pages security guide](github-pages-security.md), back up the existing site and DNS state, and configure the repository Pages source as **GitHub Actions**. Then run `npm run check`, deploy a non-production preview if available, run `npm run smoke` locally, and verify HTTPS, routes, legal links, mail links, robots controls, mobile behaviour, the absence of secrets, and the absence of unexpected network calls.

The future booking-search API described in `api/README.md` is not implemented or deployed. Its runtime and secrets must remain outside GitHub Pages. Do not add an API key to GitHub Actions merely to inject it into the static build; any credential delivered to browser files is public.

This private workspace must not be copied wholesale into a public repository. Use [the public repository manifest](public-repository-manifest.md) and the generated `exports/svsam-github-pages-package.zip`; the operating pack, research, dashboard, screenshots, filled returns and internal evidence remain private.
