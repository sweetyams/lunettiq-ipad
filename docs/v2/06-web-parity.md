# iPad ↔ lunettiq.com parity: product page, configurator, checkout

Reviewed 2026-11-25 against the live site (lunettiq.com) and the Foundry repo.

## What's wrong today

The iPad frame page lists the product's Shopify variants as "Version" (Black, Black fade, Polarized khaki…). Those are legacy variants that encode the **lens** choice and its price ($250 / $300 / $350), with empty `selected_options`. The live site never shows them: lens choices come from the configurator flow and the lens-colour sets. Foundry's `shopify-variant-cleanup.ts` treats the cheapest one as the single frame variant and deletes the rest.

## How the live site works

lunettiq.com is rendered headless by Foundry (`src/lib/tenants/lunettiq/storefront/`), not a Shopify theme. All of it runs on public Foundry storefront APIs the iPad can call:

| Web piece | API |
|---|---|
| Optical / Sunglasses toggle, colour swatches | `GET /api/storefront/product-families/by-product/:shopifyId` (`siblings[].type` = optical/sun) |
| "Select lenses and buy" | `GET /api/storefront/configurator/resolve?productId=` → flowId, `suppressPdpLens`, `suppressPdpColour` |
| Flow steps, choices, prices, conditions | `GET /api/storefront/configurator/snapshot?flowId=` |
| Tints (solid, fade, polarized, interior) | `GET /api/storefront/configurator/lens-colours` |
| Tiered promo ("30/40/50% off") | `GET /api/storefront/promotion` |
| Checkout | `POST /api/storefront/configured-checkout` → Shopify draft order, `invoiceUrl` (server prices every line) |
| Sizing | product `metafields.custom.sizing_dimensions` |

Live flows:
- **Optical:** lens type (Non-Rx clear → Super Progressive +$500), then thickness (1.50 / 1.61 +$60 / 1.67 +$100), then enhancements (blue light).
- **Sunglasses:** lens type (Non-Rx sun, SV sun, progressives), a book-appointment link, then finish (standard, custom solid, custom fade, polarized, interior tint).
- Prescription lens types currently show "Coming soon" on the web.

## What the iPad already has

`src/features/configurator/ConfiguratorSheet.tsx` already uses resolve, snapshot and lens-colours, applies price rules, and serializes selections. `OrderSummarySheet` then creates an Rx order. It's only reachable through "Order with lenses", inside a visit, for staff. It doesn't apply `conditionSets` / `validationRules`, content and link choices, or media.

## Recommendation

**Phase 1: correct product page (iPad only, no Foundry changes)**
1. Drop the "Version" chips. Pick the frame variant as the cheapest active variant (same rule as Foundry), and use it for price, stock and wishlist.
2. Make the Optical / Sun toggle and colour swatches from `product-families` (`siblings[].type`) the primary pickers, like the web.
3. Put "Choose lenses" on the product page for everyone, in a visit or not, opening the configurator. Without a visit it's a price walkthrough that ends in "Start a visit to order".
4. Bring the configurator up to the web: condition sets, validation, "coming soon" / disabled choices, tint swatches with hex and fade, lens images, and the book-appointment link.
5. Show sizing from the metafield, and the promo banner and tier from `storefront/promotion`.

**Phase 2: real checkout parity (needs Foundry)**
- Ask Foundry for a **staff mode on `configured-checkout`**: customer ID, staff ID, location, and Rx link, returning the draft order and invoice URL. The iPad can then show a QR / "Pay on this iPad" link, or send it to the client, and the paid-order webhook creates the Rx order exactly as for web.
- Ask for a **price quote endpoint** (expose `checkout-pricing.server.ts`), so the iPad shows the same total, with promo tiers and points, before checkout instead of re-computing on the device.
- Ask for an explicit `frameVariantId` on product responses, so nothing depends on the variant cleanup having run.

**Phase 3: deeper features**
- Try-on assets and sessions (`tryon/*`).
- Per-location stock (`inventory/scan/resolve`) on the frame page.
- Recommendations (`storefront/recommendations`).
- Loyalty points at checkout.
- Shared configurations (`configurator/share`), so a client can finish on the web from what staff set up in store.

## Data issues found
- The Optical flow has "Blue Light" twice (+$10 and +$75).
- The iPad calls `/api/inventory/summary`, which doesn't exist in Foundry.
