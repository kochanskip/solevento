# Solevento

## English and Portuguese website

The published pages live in `en/` and `pt/` (European Portuguese). Shared images,
fonts, videos, CSS and Bootstrap stay at the root. Each page has an EN / PT
dropdown linking to the equivalent page, plus canonical and language metadata.
Generated HTML uses indented lines and Windows CRLF line endings for readability.
The root homepage defaults to English. Old URL compatibility pages have been removed.

### Editing content

- Edit ordinary page templates in `content/pages/en/` and `content/pages/pt/`.
  Both languages use the same filenames. `{{lang}}` in links is filled by the build.
- Edit workshop prices, images, categories, duration, number of sessions and
  availability in `content/events/workshops.json`. Prices are numeric EUR amounts,
  durations are minutes, and availability dates use `YYYY-MM-DD`.
- Edit workshop copy in `content/events/workshops.en.json` and
  `content/events/workshops.pt.json`, keyed by the same stable workshop IDs.
  Each language has its own title, summary, description, requirements, optional
  description list and URL slug. Keep slugs stable once published.
  To use a different image for a language, add an optional `image` field to that
  workshop's record in the corresponding translation file, for example
  `"image": "/content/events/images/KidsCeramicClass.pt.webp"`. Use a path from
  the site root starting with `/`, and put the actual image at that location.
  If omitted, the shared image is used. The override applies to the workshop
  detail page, workshop listing and homepage carousel after rebuilding.
- Workshop detail layouts live in `content/pages/en/workshop.html` and its
  Portuguese counterpart. Their content is rendered by `scripts/build-site.mjs`.
- Shared styling is in `style.css`. The homepage carousel script regroups existing
  HTML cards at mobile, tablet and desktop breakpoints without fetching content.

After editing, run from the project root (Node.js 22 or later, no dependencies):

```sh
node scripts/build-site.mjs
node scripts/check-site.mjs
```

The build updates both language folders, workshop listing/detail pages, homepage
workshop cards, the root homepage redirect, and `sitemap.xml`. It validates workshop content
and fails if translations are missing. **Edit source templates rather than the
generated files in `en/` or `pt/`**, then rebuild before publishing. Generated HTML
is included in the repository, so hosting still serves this as an ordinary static
website with no server-side runtime or build service required.

To add an ordinary page, add its template in both language folders and its relative
path to `content/pages/routes.json`, then rebuild. To add a workshop, add its shared
record and matching translation records with unique IDs and slugs, then rebuild.

### Local preview

```sh
node scripts/preview.mjs
```

Open `http://localhost:8080/en/` or `http://localhost:8080/pt/`. Stop the preview
with Ctrl+C. You can also open the root `index.html` directly in your browser:
generated links and assets use relative paths, including explicit `index.html`
filenames for workshop folders, so they work under `file://` as well as HTTP.

Only the root homepage uses an HTML/JavaScript redirect to the English homepage.
Old workshop query URLs and other legacy pages are no longer generated.
`robots.txt` and the generated sitemap use `https://soleventoceramics.com`.

### Shop photo sizes

Original product photos stay unchanged. Shop cards use generated 480px and 960px
WebP copies in `images/shop/`, with responsive sizing and lazy loading. Product
galleries continue using the originals. Keep the generated copies when publishing.

After adding or replacing shop photos, run `node scripts/build-shop-images.mjs`
with the `sharp` Node package available (installed locally or through `NODE_PATH`),
then run `node scripts/build-site.mjs`. The normal build uses the original photo
as a fallback when optimized copies have not been generated yet.

## License
Copyright (c) 2026 Piotr Kochanski.

All rights reserved.

This software is provided 'as-is,' with no license or rights granted to users. Unauthorized copying, distribution, or modification is prohibited.
