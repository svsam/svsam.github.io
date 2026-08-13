# SvS / SvSam GitHub Pages deployment and security boundary

Status: implementation-ready structure; no DNS, GitHub, partner, or production action has been performed.

This document defines how the static website can be published at `https://svsam.com` while keeping future travel-partner credentials and booking logic outside the public GitHub repository. GitHub Pages is a public static host, not a secure application server.

## Exact repository-to-domain mapping

The Pages artifact and the GitHub repository are different visibility boundaries. GitHub Pages serves only the uploaded `site/` artifact, but a **public repository exposes every committed file**, even when Pages does not serve it. The public repository must therefore contain only the reviewed package described below; the private operating workspace must remain outside it.

```text
repository root/
|-- site/                         # only this folder becomes the website root
|   |-- CNAME                     # contains exactly: svsam.com
|   |-- index.html                # https://svsam.com/
|   |-- hospitality.html          # https://svsam.com/hospitality.html
|   |-- stays.html                # https://svsam.com/stays.html
|   |-- sample-report.html        # https://svsam.com/sample-report.html
|   |-- privacy.html, affiliate-disclosure.html, booking-terms.html
|   |-- styles.css, *.js, assets  # public browser files
|   `-- robots.txt                # https://svsam.com/robots.txt
|-- deployment/                   # public-safe deployment documentation; source-visible
|-- api/README.md                 # public-safe future proxy contract; source-visible
|-- tools/                        # reviewed validation only; source-visible
|-- package.json                  # validation commands; source-visible
`-- .gitignore
```

The internal `ops/`, `research/`, `dashboard/`, `exports/`, and `artifacts/` folders are **not part of that public repository**. They can contain decisions, personal/contact details, prospecting records, screenshots or internal evidence. `.gitignore` protects new untracked copies, but it does not remove files already tracked in Git. Before a push, inspect `git ls-files`, the staged diff, branches, history and generated artifacts. Use [the public repository manifest](public-repository-manifest.md) and the prepared clean ZIP rather than copying this whole workspace.

GitHub Pages branch publishing supports only the repository root or `/docs`, not an arbitrary `/site` directory. Preserve the existing `site/` boundary by using a GitHub Pages Actions workflow that uploads `site/` as the Pages artifact. Do not copy the whole repository into the artifact. The workflow should conceptually:

1. check out the selected commit without persisting checkout credentials;
2. run the repository validation and browser smoke tests;
3. upload only `./site` with the official Pages artifact action;
4. deploy that artifact to the GitHub Pages environment.

The prepared manual workflow lives at `.github/workflows/deploy-pages.yml`. It runs the source/security checks and uploads only `site/`; it does not run automatically when code is pushed. Running it, selecting **GitHub Actions** as the Pages source, setting the custom domain, or changing DNS is an external publication decision requiring owner approval. `site/CNAME` must remain in the uploaded artifact.

Do not select branch `/ (root)` publishing for the current layout: that risks exposing operational files and will not map `site/index.html` to the domain root. If Actions cannot be used, the safe alternative is a dedicated publication branch containing only the contents of `site/`, never the entire working repository.

## Domain and DNS workflow (instructions only)

No DNS change should occur until control of the registrar, DNS zone, GitHub organisation/account, and repository is verified and a rollback record exists.

1. Renew `svsam.com` and enable registrar MFA and transfer lock.
2. In the intended GitHub account, complete GitHub Pages domain verification. GitHub supplies a unique TXT name and value; copy those exactly and never invent or reuse a verification token.
3. Record the existing DNS zone, TTLs, current host, and working mail records. Export or screenshot the zone before editing.
4. Lower only the relevant web-record TTL in advance if a controlled migration is planned. Do not alter MX, SPF, DKIM, DMARC, or unrelated TXT records.
5. In GitHub Pages settings, select GitHub Actions and set the custom domain to `svsam.com`.
6. For the apex domain, add the current GitHub-documented Pages `A` records and, if desired, its `AAAA` records. Verify the addresses against GitHub's official documentation at the moment of change; do not rely on copied addresses in an old plan.
7. Point `www.svsam.com` by CNAME to `<verified-github-account>.github.io`, replacing the placeholder with the actual Pages account. Never point it to a repository URL or include `https://` in the DNS value.
8. Choose `https://svsam.com` as canonical, test both apex and `www`, and enable **Enforce HTTPS** only after GitHub has issued the certificate.
9. Check the site, certificate, redirects, mail records, and DNS from an external connection before declaring the migration complete.

Only the owner or an explicitly authorised operator may make those DNS and publication changes.

## Public-repository threat model

Assume all committed content is permanently public, downloadable, searchable, forkable, mirrored, and recoverable from Git history even after deletion. This includes:

- JavaScript bundles, source maps, HTML comments, configuration, CNAME files, assets, and pre-rendered data;
- commit messages, branches, pull requests, issues, Actions logs, build artifacts, and release archives;
- personal addresses, email addresses, diagnostic submissions, synthetic datasets, and document metadata;
- any value inserted during a static build, even if it originated in a GitHub Actions secret.

Likely attacks include automated secret scanning and credential use, modification of outbound booking links, form or script injection through a compromised contributor account, typosquatted domains, dependency or Action compromise, scraping, iframe abuse, denial-of-service against a future API, affiliate fraud, and false claims of association with a booking platform.

Before every public release, review both the complete public repository source and the generated `site/` artifact—not merely the latest diff—for personal data, internal notes, private endpoints, source maps, credentials, hidden forms, unapproved claims, and unexpected external requests. Legal operator details intentionally required on the public site must be explicitly approved; internal evidence, identity documents, guest data, prospect/suppression records and client data must never enter the public repository.

## Secret-handling rules

There are no private browser-side values. Names such as `NEXT_PUBLIC_*`, `VITE_*`, `REACT_APP_*`, JavaScript constants, obfuscated strings, Base64 values, encrypted blobs shipped with their decryptor, and network request headers created in the browser are all public.

Never commit or build into the Pages artifact:

- Airbnb, Booking.com, affiliate-network, payment, email, analytics, or mapping secrets;
- API keys, OAuth client secrets, refresh/access tokens, webhook signing secrets, private keys, database URLs, session-signing keys, or passwords;
- `.env` files, production exports, request/response captures, raw logs, guest records, or booking records.

Store production secrets only in the secret manager belonging to the separately hosted API service. Use separate development and production credentials, least privilege, rotation, expiry where available, and an owner-controlled recovery process. If a secret is ever committed, revoke and rotate it immediately; deleting the line or rewriting the latest commit is not sufficient.

`deployment/public-config.example.js` demonstrates the only acceptable category of browser configuration: public origins, policy links, display metadata, and feature flags that confer no authority. Client-side flags are presentation controls, never security controls.

## Consumer booking architecture

Do not call a credentialed partner API directly from GitHub Pages. The safe boundary is:

```text
Visitor browser at svsam.com
        |
        | HTTPS; public search fields only
        v
API gateway/proxy at api.svsam.com
        |-- validates and normalises input
        |-- applies CORS allowlist, rate limits, bot controls and abuse rules
        |-- reads partner credentials from a server-side secret manager
        |-- sends only contract-approved requests to partner APIs
        |-- strips credentials and unnecessary partner fields from responses
        |-- redacts logs and records operational/audit events
        v
Contracted booking/affiliate provider
```

The proxy must be a separately deployed backend with its own security review and preferably a private source repository. Its public browser endpoints require strict schemas, bounded dates and party sizes, output encoding, request-size limits, timeouts, retries with limits, cache rules, and rate limits per IP/session. CORS should allow the exact production origins (`https://svsam.com` and, only if used, `https://www.svsam.com`); CORS is not authentication, so abuse controls remain necessary.

Start with the lowest-authority commercial model:

1. **Referral/affiliate redirect:** show clearly attributed offers and send the visitor to the provider to complete the transaction. The provider handles accounts, payment, booking, cancellation, and support. Disclose the commercial relationship.
2. **Server-proxied search:** add only after written API/affiliate approval. Normalise search results through the proxy and preserve provider attribution, price/currency conditions, deep-link rules, and freshness requirements.
3. **On-site reservation or payment:** out of scope until a separate legal, payments, fraud, consumer-rights, security, data-protection, support, cancellation, and incident-response programme is approved.

Do not describe SvS/SvSam as "associated with", "partnered with", "approved by", or "endorsed by" Airbnb, Booking.com, or another platform without a current written agreement allowing the wording. Do not use platform logos, trademarks, listing content, reviews, photographs, prices, or availability outside the applicable licence and brand rules.

## GitHub Actions and repository boundaries

The static Pages build should require no secrets. A secret used during a build can leak into the output, logs, cache, error traces, or downloadable artifacts.

For the prepared workflow:

- set top-level token permissions to read-only and grant only the Pages deployment job the documented Pages permissions;
- protect the production environment and require owner approval for first publication and material releases;
- use only GitHub-maintained Actions at the major versions shown in current GitHub Pages documentation, keep automated Actions update proposals enabled, review every version change, and use full reviewed commit SHAs if the repository's supply-chain policy requires immutable references;
- do not execute untrusted pull-request code with production secrets;
- avoid `pull_request_target` for build/test jobs that check out contributor code;
- keep fork pull-request secret access disabled and review workflow-file changes separately;
- do not print environment variables, HTTP headers, partner responses, or secret-bearing commands;
- treat Actions variables as public configuration and Actions secrets as merely masked inputs, not a guarantee against deliberate exfiltration;
- use dependency review and automated secret scanning, but do not treat scanners as a substitute for review;
- ensure the deployed artifact contains only `site/` and has a short retention period where configurable.

The future API should have a separate deployment pipeline and environment. GitHub Pages must not be granted its production credentials. If API source remains in this repository, its production secret store must still be external, and no API runtime directory may be included in the Pages artifact.

## Security headers and GitHub Pages limitations

Repository files cannot configure arbitrary HTTP response headers on GitHub Pages. Files such as `_headers`, `.htaccess`, `web.config`, or a headers section in JavaScript do not make Pages send custom headers. Consequently, the site cannot reliably set its own HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, cross-origin isolation headers, or a full response-header Content Security Policy.

A `<meta http-equiv="Content-Security-Policy">` can provide a limited CSP fallback, but it must appear early in `<head>`, does not support all directives, and cannot enforce `frame-ancestors`; it is weaker and easier to misconfigure than a response header. Test it against every required script, style, image, form, and partner origin. Do not add broad sources such as `*`, `unsafe-eval`, or unnecessary `unsafe-inline` simply to silence errors.

If strong/custom headers become a requirement, place a reviewed CDN/reverse proxy in front of the site or move static hosting to a provider that supports version-controlled response headers. That change introduces another privileged account and DNS boundary and therefore requires owner approval and a rollback plan.

Use Subresource Integrity for stable third-party static resources where feasible, minimise third-party JavaScript, avoid tag managers during validation, use `rel="noopener noreferrer sponsored"` for applicable outbound affiliate links, and never render partner/API text as untrusted HTML.

## Privacy, cookies, and consumer transparency

Default to no non-essential cookies, tracking pixels, browser fingerprinting, advertising tags, or third-party embeds. A basic outbound link generally creates less data exposure than embedding a provider widget or loading its scripts. If non-essential analytics or affiliate tracking cookies are later introduced, hold them until valid consent, provide equally easy refusal and withdrawal, record the approved configuration, and keep the cookie notice accurate.

Before enabling consumer search or referrals:

- publish an approved privacy notice, cookie notice, affiliate/commercial disclosure, terms, complaints route, and clear legal-operator/contact information;
- say whether SvS is only a referral/search service or is the contracting booking party;
- identify when a visitor leaves SvS and becomes subject to the provider's terms, privacy policy, pricing, cancellation rules, and support process;
- show provider identity, currency, taxes/fees caveats, freshness/time of retrieval, and material ranking or sponsored-placement information;
- collect only fields needed for the immediate search; avoid accounts, saved trips, free-text requests, precise location, accessibility/health details, identity documents, and payment data in the first version;
- never put email addresses, names, booking references, tokens, or sensitive trip details in URLs, analytics events, browser storage, error messages, or public logs;
- define proxy retention and deletion rules before accepting any request data.

Search history can reveal movements and personal circumstances. Treat dates, destinations, party composition, device/network data, and click history as personal data when linkable to a person. The static site must not claim that data stays in the browser once a proxy, partner link, widget, analytics product, or email handoff receives it.

## Publication and rollback

Before first publication:

1. Capture the current domain, DNS, existing-site, GitHub Pages, and certificate state.
2. Back up the current live site through its legitimate hosting controls.
3. Tag the approved static release and retain the exact successful Pages artifact/commit identifier.
4. Test a non-production Pages preview without production partner credentials.
5. Obtain explicit owner approval for the content, privacy posture, commercial claims, custom domain, and cutover window.
6. Deploy the approved commit, then verify every route, outbound link, HTTPS behaviour, mobile flow, accessibility baseline, absence of secrets, and absence of unexpected network calls.

For a content/code rollback, disable any newly enabled public feature flags and redeploy the last known-good tagged commit through the same Pages workflow. Do not use destructive Git history rewrites as the normal rollback mechanism.

For a domain rollback, restore only the previously recorded web DNS records and custom-domain setting; do not modify mail records. Keep the former host available until the cutover is verified and DNS caches have aged beyond the prior TTL. If a credential or personal-data exposure triggered the rollback, also disable the affected API route, rotate credentials, preserve appropriate incident evidence, assess notification duties, and do not assume a Pages rollback removes cached or cloned material.

## Go-live evidence required

- Verified control and MFA for registrar, DNS, GitHub, repository, business email, and future API host.
- Approved SvS/SvSam naming and legal presentation for `svsam.com`.
- Written partner/affiliate permission and brand/API terms for every enabled provider.
- Public artifact review showing no secret, guest/client data, internal document, or unintended personal data.
- Approved privacy/cookie/affiliate/terms/support position.
- Tested server-side proxy with credentials held outside Pages and outside browser output.
- Owner-approved deployment and DNS rollback records.
