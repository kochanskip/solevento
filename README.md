# Solevento

## Editing the website

`en/` and `pt/` are the actual editable website pages. Edit these HTML files
in WebStorm and refresh your browser. Edit shared styles in `style.css`.
There is no separate copy of the pages and no HTML generation step.
The root `index.html` opens the English homepage.

### Preview and checks

Run `node scripts/preview.mjs` and open http://localhost:8080/en/ or
http://localhost:8080/pt/. Changes appear after refreshing the browser.
You can also open the HTML files directly using file://.

Run `node scripts/check-site.mjs` after edits. It checks local links, images,
video paths, srcsets, inline JavaScript, page languages and language-switch links.

`node scripts/build-site.mjs` now ONLY updates `sitemap.xml` and `robots.txt`
from the existing pages and `content/crawler-policy.json`. It never writes HTML.
Run it when adding, removing or renaming a page, then publish the changed files.
It does not restore deleted pages, add shop cards or change shop visibility.

### Products and shop visibility

Copy a similar page into both `en/products/` and `pt/products/`, then update
its title, copy, specifications, price, media and email enquiry. Set its canonical
and alternate language URLs, and link the English and Portuguese language menus
to each other. Keep matching filenames across languages.

Add a product card manually in each language's `shop.html` when ready to show it.
Cards appear in the manually arranged HTML order for Featured. Collection labels
are small text above item names; match `data-collection` to the filter option value.
Update both the visible price and numeric `data-price`. The product collection
link points to `shop.html?collection=...` with the filter value URL-encoded.

To hide an item, remove its card from both shops, leaving its product pages and
images in place. To restore it, copy another card and point it to the product.
Collection dropdowns are maintained manually, in alphabetical display order.
There are no separate hidden-product or collection configuration files.
Hidden-from-shop pages remain accessible by direct URL and may be indexed.

Mark a shop card sold out using `data-stock="out-of-stock"` and add a stock
notice to the product page in each language. Restore both when available again.

### Images and videos

Keep original photos in `images/Products/<collection>/<product>/`.
Product display copies live in that product's `1200/` and `160/` folders.
Shop copies live in the same product folder's `480/` and `960/` subfolders.
Original photos are never overwritten by the optimization scripts.

After adding or replacing image references in the HTML, run:

```sh
node scripts/build-shop-images.mjs
node scripts/build-product-images.mjs
node scripts/check-site.mjs
```

The image commands require the `sharp` Node package, installed locally or made
available through `NODE_PATH`. They read the actual English and Portuguese shop
pages, generate copies, and update image references directly. Product gallery
optimization only applies to products linked from those shops. No manifest or
`content/pages` folder is required. Existing optimized references can be processed
again; they are mapped back to the original photos. If an original is missing,
restore it or remove the corresponding gallery entry before running optimization.

When deleting a photo, remove its slide and thumbnail in both languages and
renumber `data-bs-slide-to` values from zero. Delete unused generated copies if
needed. Videos use `scripts/product-video.js` and labelled play buttons; keep each
button's slide index aligned with its video slide.

### Workshops

Edit workshop detail pages directly in `en/workshops/` and `pt/workshops/`.
If changing a title, price, image or date, also update that workshop's cards in
both `workshops.html` pages and both homepages. These copies are now manual.
The JSON files in `content/events/` are retained as reference data only; changing
them does not update the HTML. Images in `content/events/images/` remain in use.

### Crawler preferences and publishing

`content/crawler-policy.json` controls AI crawler opt-out rules in `robots.txt`.
These rules are voluntary crawler requests, not enforced server access controls.
Public pages remain indexable by ordinary search engines. The homepage redirect
has its own noindex instruction. No unsupported noai meta tags are generated.

Publish the edited HTML, CSS, scripts, media, sitemap and robots.txt to update the
public website. Local changes do not publish automatically. The site is static;
visitors do not need Node.js or an image-processing runtime.

## License
Copyright (c) 2026 Piotr Kochanski.

All rights reserved.

This software is provided 'as-is,' with no license or rights granted to users. Unauthorized copying, distribution, or modification is prohibited.
