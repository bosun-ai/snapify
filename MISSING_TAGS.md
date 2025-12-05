# Missing Shopify Liquid constructs

Use this checklist to track which Shopify Liquid primitives still need first‑class support in Snapify. Each item links to the official docs and summarizes the expected behavior.

## Tags
- [x] `paginate` — paginates a collection/array and exposes the `paginate` object while rendering its block. https://shopify.dev/docs/api/liquid/tags/theme-tags#paginate
- [ ] `layout` — selects a specific layout or disables layouts with `layout none` from within a template. https://shopify.dev/docs/storefronts/themes/architecture/layouts

## Filters
- [x] `default_pagination` — renders pagination links for the current `paginate` object. https://shopify.dev/docs/api/liquid/filters/default_pagination
- [ ] `link_to_tag` — builds an anchor that links to the given tag within the current collection/blog. https://shopify.dev/docs/api/liquid/filters/link_to_tag
- [ ] `link_to_add_tag` — builds a link that adds the given tag to the current tag set. https://shopify.dev/docs/api/liquid/filters/link_to_add_tag
- [ ] `link_to_remove_tag` — builds a link that removes the given tag from the current tag set. https://shopify.dev/docs/api/liquid/filters/link_to_remove_tag
- [ ] `highlight_active_tag` — wraps the active tag in markup (e.g., `<strong>`) for navigation UIs. https://shopify.dev/docs/api/liquid/filters/highlight_active_tag
- [ ] `link_to_type` — returns a link to the given product type. https://shopify.dev/docs/api/liquid/filters/link_to_type
- [ ] `link_to_vendor` — returns a link to the given vendor page. https://shopify.dev/docs/api/liquid/filters/link_to_vendor
- [ ] `url_for_type` — returns the URL for a product type. https://shopify.dev/docs/api/liquid/filters/url_for_type
- [ ] `url_for_vendor` — returns the URL for a vendor page. https://shopify.dev/docs/api/liquid/filters/url_for_vendor
- [ ] `within` — scopes a URL to the current collection for SEO‑friendly product links. https://shopify.dev/docs/api/liquid/filters/within
- [ ] `global_asset_url` — returns a CDN URL for a global theme asset. https://shopify.dev/docs/api/liquid/filters/global_asset_url
- [ ] `shopify_asset_url` — returns a CDN URL for a core Shopify asset (e.g., checkout). https://shopify.dev/docs/api/liquid/filters/shopify_asset_url
- [ ] `asset_img_url` — builds an image variant URL for a theme asset. https://shopify.dev/docs/api/liquid/filters/asset_img_url
- [ ] `preload_tag` — outputs a `<link rel="preload">` hint for assets. https://shopify.dev/docs/api/liquid/filters/preload_tag
- [ ] `placeholder_svg_tag` — renders a themed placeholder SVG icon. https://shopify.dev/docs/api/liquid/filters/placeholder_svg_tag
- [ ] `payment_type_svg_tag` — renders a payment method SVG icon. https://shopify.dev/docs/api/liquid/filters/payment_type_svg_tag
- [ ] `payment_type_img_url` — returns an image URL for a payment method icon. https://shopify.dev/docs/api/liquid/filters/payment_type_img_url
- [ ] `payment_icon_png_url` — returns a PNG icon URL for a payment method. https://shopify.dev/docs/api/liquid/filters/payment_icon_png_url
- [ ] `product_img_url` — builds an image variant URL for a product image. https://shopify.dev/docs/api/liquid/filters/product_img_url
- [ ] `file_img_url` — builds an image variant URL for an uploaded file. https://shopify.dev/docs/api/liquid/filters/file_img_url
- [ ] `color_modify` — transforms a color by hue/lightness/saturation adjustments. https://shopify.dev/docs/api/liquid/filters/color_modify
- [ ] `color_mix` — mixes two colors with an optional weight. https://shopify.dev/docs/api/liquid/filters/color_mix
- [ ] `money` and variants — format amounts in the shop currency (`money_with_currency`, `money_without_currency`, `money_without_trailing_zeros`). https://shopify.dev/docs/api/liquid/filters/money
- [ ] `weight` and `weight_with_unit` — format weight values using shop settings. https://shopify.dev/docs/api/liquid/filters/weight
- [ ] `time_tag` — renders a localized `<time>` element for a date/time. https://shopify.dev/docs/api/liquid/filters/time_tag
