# EvoXRB blog post

This directory holds the [combined EvoXRB post](index.html), the v0.2.0
replay and the scientific assets.

## Publish

Keep this directory at its current depth in the website repository:

```text
blog/
└── evoxrb-genetic-algorithms-x-ray-astronomy/
    ├── index.html
    ├── asset-manifest.json
    ├── assets/
    └── article/
```

The article uses the shared stylesheets and navigation from the site root.

## Replay architecture

The combined post links to the standalone player at `assets/replay/index.html`. The player:

- starts paused;
- is keyboard operable;
- uses external CSS and JavaScript;
- loads 25 ordinary PNG frames;
- has a strict local-only content-security policy;
- provides labels and a live generation announcement;
- links back to the article.

Serve the directory over HTTP(S); some browsers restrict scripts when a site is
opened with the `file://` protocol.

## Rebuild scientific assets

From the separate EvoXRB repository root (the scientific generator is not part
of this website repository):

```powershell
python -m evoxrb animate --profile smoke --epoch E08 --reference-csv data/reference/maxi_j1820p070_mjd58302.csv --output results/animations/E08_ga_spectra.html --comparison-output results/animations/E08_ga_comparison.png
python scripts/build_blog_bundle.py
```

The compiler extracts PNG frames from Matplotlib's self-contained replay,
copies the comparison figure, strips local paths from the public summary, and
regenerates `asset-manifest.json` with file sizes and SHA-256 hashes.
When importing rebuilt assets, retain this site's player and combined article,
then refresh the manifest for the final published files.

## LaTeX edition

The print source is `article/evoxrb-v0.2.0.tex`. With TeX Live, MiKTeX, or
another pdfLaTeX distribution installed:

```powershell
Set-Location blog/evoxrb-genetic-algorithms-x-ray-astronomy/article
latexmk -pdf evoxrb-v0.2.0.tex
```

Alternatively, run `pdflatex evoxrb-v0.2.0.tex` twice. The source uses a
portable pdfLaTeX package set and shares the website comparison image through
`../assets/`.

## Scientific boundary

The fitted target remains synthetic / NICER-inspired. The purple reference
points are a real, background-subtracted MAXI/GSC spectrum of MAXI J1820+070
from MJD 58301.5-58302.5. They are a cross-instrument visual overlay and are
never included in the C-statistic. The derived CSV, official result URL, request
configuration, input hashes, acknowledgement and citation travel in `assets/`.
