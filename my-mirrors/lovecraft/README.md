# My Mirrors catalogue

This is an independent index based on the works list at https://www.hplovecraft.de/index.php?id=werke (consulted 10 November 2026). It links to the original site and to translation sources; it does not store their texts or PDFs.

To add a German translation, find its work in `catalogue.json` and add an object to its `additions` array:

```json
{
  "title": "German title",
  "translator": "Translator's name",
  "format": "PDF",
  "level": "B2",
  "url": "https://example.org/translation.pdf"
}
```

Use `Online` or `PDF` for `format`, and link to the translator's or publisher's source whenever possible. The page reads this file directly, so no build step is needed.

The German reading levels are broad estimates, not official CEFR ratings. Current links are marked B2 or C1. A1, A2, and B1 stay available as filters for future graded adaptations.

English reading links for the early and main works point to the H. P. Lovecraft Archive. Four early texts are marked as lost because no surviving text is available.
