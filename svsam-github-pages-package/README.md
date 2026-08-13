# SvS / SvSam website package

This is a pre-launch GitHub Pages package for `svsam.com`. **SvS** (expanded as **SvSam**) is a temporary working name pending clearance.

## Included routes

- `/` — managed reporting automation for UK performance-marketing agencies
- `/hospitality.html` — separate discovery route for hotel and professional short-stay operators
- `/stays.html` — consumer accommodation-search interface demonstration
- `/sample-report.html` — synthetic reporting proof
- `/privacy.html`, `/affiliate-disclosure.html`, `/booking-terms.html` — pre-launch boundary pages

The consumer interface processes searches in the browser only. It has no live provider connection, inventory, availability, price, referral link, account, payment or booking capability. It does not claim a relationship with Airbnb, Booking.com or another provider.

## Local checks

No dependency installation is required. Use Node.js 24 and Google Chrome/Chromium.

```powershell
npm.cmd run check
npm.cmd run smoke
npm.cmd run serve
```

Then open `http://127.0.0.1:4173/`.

## GitHub Pages

The manual workflow at `.github/workflows/deploy-pages.yml` validates the source, runs browser interactions and uploads only `site/`. It does not publish automatically on push.

Before first publication:

1. Clear the temporary name and legal presentation.
2. Verify MFA/control for GitHub, the repository, registrar, DNS, domain and approved public mailbox.
3. Back up the existing `svsam.com` site and DNS records; approve the exact cutover and rollback.
4. Complete and approve the privacy/contact, consumer/affiliate, cookie, complaints, insurance, employment/IP and contract positions.
5. Obtain written provider approval before enabling any provider name, mark, content, link, data or API.
6. Review the complete repository and Pages artifact for sensitive data and secrets.
7. Approve the first workflow dispatch and every DNS change.

See `deployment/github-pages-security.md` for the source boundary and `api/README.md` for the future server-side proxy contract. Never put a credential in GitHub Pages, browser code, a static build, commit, issue, screenshot or chat.
