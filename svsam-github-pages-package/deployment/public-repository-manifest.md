# SvS public GitHub repository manifest

Status: `Prepared — merge only after owner review`

The working directory is a private operating workspace, not the public website repository. A GitHub Pages artifact hides non-site files from the website URL, but it does **not** hide them from a public GitHub repository.

## Files that may enter the public website repository

Use the prepared `exports/svsam-github-pages-package.zip`, or copy only these reviewed paths:

```text
.github/
  dependabot.yml
  workflows/deploy-pages.yml
api/
  README.md
deployment/
  README.md
  github-pages-security.md
  public-config.example.js
  public-repository-manifest.md
site/
  (all current files)
tools/
  browser-smoke.mjs
  security-check.mjs
  serve.mjs
  validate.mjs
.gitignore
package.json
README.md                 # use the public-package README, not the private workspace README
```

## Private paths — never copy or commit to a public repository

```text
artifacts/
dashboard/
exports/
ops/
research/
screenshots, filled decision returns, prospect/suppression data, live logs or exports
```

Do not rely on `.gitignore` for a file that is already tracked. Before any push:

1. Run `git ls-files` and confirm every tracked path is in the public list above or is an already reviewed existing-site file.
2. Review `git diff --cached` for identity/contact details, tokens, endpoints, provider claims, internal notes and generated files.
3. Run `npm run check` and `npm run smoke`.
4. Search all branches and history for prior credentials or sensitive files. If a credential ever appeared, revoke and rotate it; deletion alone is not remediation.
5. Protect the production environment and require owner approval for the first workflow dispatch.

The current public pages intentionally omit the residential correspondence address and mailbox while publication and MFA remain unresolved. Add an approved public business contact only as a reviewed launch change.
