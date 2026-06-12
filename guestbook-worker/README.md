# Journal Room Guestbook Worker

GitHub Pages cannot accept writes by itself. This Cloudflare Worker keeps the
GitHub token private and commits approved visitor messages to
`data/guestbook.json`.

## Deploy

1. Create a fine-grained GitHub token limited to `svsam/svsam.github.io` with
   **Contents: Read and write** permission.
2. Copy `wrangler.toml.example` to `wrangler.toml`.
3. From the repository root, run:

   ```sh
   npx wrangler secret put GITHUB_TOKEN --config guestbook-worker/wrangler.toml
   npx wrangler deploy --config guestbook-worker/wrangler.toml
   ```

4. Place the resulting `workers.dev` URL in the `guestbook-api` meta tag in
   `journal/index.html`. The current Worker URL is:

   ```text
   https://svsam-journal-guestbook.svsam.workers.dev
   ```

Always pass `--config guestbook-worker/wrangler.toml`. The repository also has
a root Wrangler configuration for the static website, and omitting `--config`
deploys that project instead of the guestbook API.

The Worker accepts `GET`, `POST`, and `OPTIONS`, validates message lengths,
uses a honeypot field, and limits each IP address to one submission per minute.
Never place the GitHub token in `journal.js`, HTML, or `wrangler.toml`.
