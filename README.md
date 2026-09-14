# svsam.com

[svsam.com](https://svsam.com/) is my hand-built personal website: part project
archive, part journal, and part place to experiment with ideas that would be a
little odd anywhere else.

## The approach

The public pages use plain HTML, CSS, and JavaScript, with no frontend framework
or build step. Each section has its own visual identity while sharing a small set
of navigation and layout rules.

- `projects/` records finished and in-progress technical work.
- `blog/` contains longer project write-ups and generated figures.
- `journal/` is an interactive Three.js room with a readable non-3D interface
  layered over it.
- `ASCII/` hosts the WebAssembly build of the Rust ASCII Art Generator.
- `budget-studio/` hosts the university budget report, using `css/dev.css` and
- `guestbook-worker/` contains the separate Cloudflare Worker used by the journal
  guestbook; the static JSON file remains a read-only fallback.

