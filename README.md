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
- `guestbook-worker/` contains the separate Cloudflare Worker used by the journal
  guestbook; the static JSON file remains a read-only fallback.

## Current status

The site is active and deliberately iterative. It is not intended as a reusable
theme or an example of how every frontend should be structured; it is a personal
website that happens to keep becoming a more technical project.
