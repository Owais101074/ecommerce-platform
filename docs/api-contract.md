# API Contract

Each endpoint marked with a phase is implemented as that phase completes.
Phases 1–9 are live.

## Conventions

| Rule       | Value                                                                            |
| ---------- | -------------------------------------------------------------------------------- |
| Base URL   | `/api/v1`                                                                        |
| Format     | JSON (`application/json`), except the payment webhook (raw body)                 |
| Auth       | `Authorization: Bearer <accessToken>` for protected routes                       |
| Roles      | `customer` (default), `admin`                                                    |
| Pagination | `?page=1&limit=20`; responses include `meta: { page, limit, total, totalPages }` |
| Sorting    | `?sort=price_asc`, `price_desc`, `newest`, `rating`                              |
| Money      | Integer **paise** in every request/response field                                |
| Public IDs | Products and categories use `slug`; other resources use ObjectId                 |
| Deletes    | Soft delete; deleted resources return `404`                                      |

### Success envelope

```json
{
  "success": true,
  "message": "Products fetched",
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```

### Error envelope

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

### Status codes

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 200  | OK                                       |
| 201  | Created                                  |
| 204  | Deleted, no body                         |
| 400  | Validation / business rule error         |
| 401  | Missing or invalid token                 |
| 403  | Authenticated but role not allowed       |
| 404  | Resource not found                       |
| 409  | Duplicate (email, slug, coupon code)     |
| 422  | Semantically invalid (e.g. out of stock) |
| 429  | Rate limited                             |
| 500  | Unexpected server error                  |

---

## Health — Phase 1

| Method | Endpoint  | Access | Purpose                             |
| ------ | --------- | ------ | ----------------------------------- |
| GET    | `/health` | public | Liveness + MongoDB connection state |

## Auth — Phase 2

| Method | Endpoint         | Access          | Purpose                                   |
| ------ | ---------------- | --------------- | ----------------------------------------- |
| POST   | `/auth/register` | public          | Create customer account                   |
| POST   | `/auth/login`    | public          | Returns access token; sets refresh cookie |
| POST   | `/auth/refresh`  | public (cookie) | Rotate refresh token, issue access token  |
| POST   | `/auth/logout`   | public (cookie) | Revoke refresh token, clear cookie        |
| GET    | `/auth/me`       | auth            | Current session user                      |

The refresh token lives only in an httpOnly cookie scoped to `/api/v1/auth`.
Access tokens are returned in the JSON body and sent as `Authorization: Bearer`.

## Admin smoke route — Phase 2

| Method | Endpoint      | Access | Purpose                                     |
| ------ | ------------- | ------ | ------------------------------------------- |
| GET    | `/admin/ping` | admin  | Verifies JWT authentication and role checks |

## Users — Phase 5

| Method | Endpoint             | Access | Purpose                                            |
| ------ | -------------------- | ------ | -------------------------------------------------- |
| GET    | `/users/me`          | auth   | Current profile                                    |
| PATCH  | `/users/me`          | auth   | Update `{ name }` (2–50 characters)                |
| PATCH  | `/users/me/password` | auth   | Change password `{ currentPassword, newPassword }` |

The profile response is the same `user` shape used by `/auth/me`
(`id`, `name`, `email`, `role`, `createdAt`). Email is read-only in Phase 5.

Password change rules:

- `currentPassword` must match the stored hash, otherwise `400`.
- `newPassword` must be 8–72 characters and different from the current
  password, otherwise `400`.
- On success the new hash is stored, the refresh token hash and expiry are
  cleared, the refresh cookie is cleared, and the response message asks the
  client to sign in again.

## Addresses — Phase 7 (implemented)

| Method | Endpoint                 | Access | Purpose                           |
| ------ | ------------------------ | ------ | --------------------------------- |
| GET    | `/addresses`             | auth   | List own addresses, default first |
| POST   | `/addresses`             | auth   | Add address                       |
| PATCH  | `/addresses/:id`         | auth   | Edit own address                  |
| DELETE | `/addresses/:id`         | auth   | Remove own address                |
| PATCH  | `/addresses/:id/default` | auth   | Set default address               |

Every response wraps `data: { addresses: AddressDTO[] }` so the client can
replace its cache in one write. `AddressDTO`:

```json
{
  "id": "6612f0c9b8a4e1a2c3d4e5f6",
  "label": "Home",
  "fullName": "Aarav Sharma",
  "phone": "9876543210",
  "line1": "12 Test Lane",
  "line2": null,
  "city": "Nagpur",
  "state": "Maharashtra",
  "pincode": "440001",
  "isDefault": true,
  "createdAt": "2026-11-07T09:00:00.000Z",
  "updatedAt": "2026-11-07T09:00:00.000Z"
}
```

Create body: `{ label, fullName, phone, line1, line2?, city, state, pincode,
isDefault? }`. `PATCH /addresses/:id` accepts the same fields, all optional, with
at least one required. Validation: phone `^[6-9]\d{9}$`, pincode `^\d{6}$`.

Rules:

- The first address for a user is always default.
- Exactly one address is default; promoting one unsets the previous one.
- The only address cannot be un-defaulted (`400`).
- Deleting the default promotes the oldest remaining address.
- Addresses are queried with `userId`, so another user's id returns `404`.

## Categories — Phase 3

| Method | Endpoint            | Access | Purpose                                                 |
| ------ | ------------------- | ------ | ------------------------------------------------------- |
| GET    | `/categories`       | public | Active categories as a nested tree                      |
| GET    | `/categories/:slug` | public | Category detail                                         |
| POST   | `/categories`       | admin  | Create `{ name, description?, parentId? }`              |
| PATCH  | `/categories/:id`   | admin  | Update name, description or parent                      |
| DELETE | `/categories/:id`   | admin  | Soft delete; `409` if active children or products exist |

Slugs are generated from the name. A duplicate name gets `-2`, `-3`, and so on.
A category cannot be its own parent, and cycles in the hierarchy are rejected.

## Products — Phase 3

| Method | Endpoint              | Access | Purpose                                        |
| ------ | --------------------- | ------ | ---------------------------------------------- |
| GET    | `/products`           | public | List with search, filters, sorting, pagination |
| GET    | `/products/:slug`     | public | Detail                                         |
| POST   | `/products`           | admin  | Create                                         |
| PATCH  | `/products/:id`       | admin  | Update                                         |
| DELETE | `/products/:id`       | admin  | Soft delete                                    |
| PATCH  | `/products/:id/stock` | admin  | Set absolute stock `{ stock }`                 |

List query parameters:

| Parameter  | Type              | Notes                                                   |
| ---------- | ----------------- | ------------------------------------------------------- |
| `q`        | string            | Full-text search on name and description                |
| `category` | string            | Category **slug**                                       |
| `minPrice` | integer           | Paise, inclusive                                        |
| `maxPrice` | integer           | Paise, inclusive                                        |
| `rating`   | number            | Minimum average rating, 0–5                             |
| `inStock`  | `true` \| `false` | Only products with stock > 0 when `true`                |
| `sort`     | enum              | `price_asc`, `price_desc`, `newest` (default), `rating` |
| `page`     | integer           | Default 1                                               |
| `limit`    | integer           | Default 20, max 100                                     |

Responses include `meta: { page, limit, total, totalPages }`. Product payloads
include `rating: { average, count }` and a `category` summary
`{ id, name, slug }`. Prices are integer paise. Images remain URL strings;
Phase 10 adds an upload endpoint that returns a Cloudinary URL for the client to
store in `images`.

Create body: `{ name, description, price, categoryId, images?, stock? }`.
`images` defaults to `[]` and `stock` to `0`.

## Reviews — Phase 11

Product cards and detail pages currently show stored `ratingAvg` / `ratingCount`
aggregates. Review documents and endpoints arrive with the testing and security
phase; no review API exists yet.

| Method | Endpoint                  | Access             | Purpose                                 |
| ------ | ------------------------- | ------------------ | --------------------------------------- |
| GET    | `/products/:slug/reviews` | public             | Paginated reviews + rating summary      |
| POST   | `/products/:id/reviews`   | auth               | Create review (verified purchase later) |
| PATCH  | `/reviews/:id`            | auth (owner)       | Edit review                             |
| DELETE | `/reviews/:id`            | auth (owner/admin) | Delete review                           |

## Cart — Phase 6 (implemented)

Every response wraps `data: { cart }`. The cart shape is:

```json
{
  "items": [
    {
      "product": { "...": "ProductDTO" },
      "quantity": 2,
      "priceAtAdd": 49900,
      "lineTotal": 99800
    }
  ],
  "itemCount": 2,
  "subtotal": 99800,
  "currentSubtotal": 109800,
  "priceChanged": true
}
```

`subtotal` uses `priceAtAdd`; `currentSubtotal` uses current catalogue prices;
`priceChanged` is true when they differ. Inactive or deleted products are
filtered out of the response.

| Method | Endpoint                 | Access | Purpose                                                     |
| ------ | ------------------------ | ------ | ----------------------------------------------------------- |
| GET    | `/cart`                  | auth   | Cart with computed totals                                   |
| POST   | `/cart/items`            | auth   | Add `{ productId, quantity }`; quantity 1–10, defaults to 1 |
| PATCH  | `/cart/items/:productId` | auth   | Set quantity 1–10, re-checks stock                          |
| DELETE | `/cart/items/:productId` | auth   | Remove item; 404 if absent                                  |
| DELETE | `/cart`                  | auth   | Clear cart                                                  |

Errors: `404` product/line not found, `409` product unavailable, out of stock or
quantity above stock, `400` quantity outside 1–10.

## Wishlist — Phase 6 (implemented)

| Method | Endpoint               | Access | Purpose                                       |
| ------ | ---------------------- | ------ | --------------------------------------------- |
| GET    | `/wishlist`            | auth   | Active products in save order                 |
| POST   | `/wishlist/:productId` | auth   | Idempotent add; 404 if the product is missing |
| DELETE | `/wishlist/:productId` | auth   | Idempotent remove                             |

## Coupons — Phase 10 (implemented)

| Method | Endpoint            | Access | Purpose                                                   |
| ------ | ------------------- | ------ | --------------------------------------------------------- |
| POST   | `/coupons/validate` | auth   | Validate code against cart subtotal                       |
| GET    | `/coupons`          | admin  | List; `?search`, `?active=true\|false`, `?page`, `?limit` |
| POST   | `/coupons`          | admin  | Create                                                    |
| PATCH  | `/coupons/:id`      | admin  | Update                                                    |
| DELETE | `/coupons/:id`      | admin  | Soft-deactivate                                           |

`POST /coupons/validate` body `{ code }` and response
`data: { coupon: { code, description, type, value, discount } }`.

Create body:
`{ code, description?, type: "percentage"|"fixed", value, minOrder?, maxDiscount?, startsAt?, expiresAt?, maxUses?, isActive? }`.
`code` is trimmed and uppercased; `value` is a percentage (1–100) for
`percentage` and integer paise for `fixed`; `minOrder`, `maxDiscount` are integer
paise. `expiresAt` must be later than `startsAt`. Duplicate codes return `409`.

Validation errors (`400`): inactive coupon, starts in the future, expired,
usage limit reached, cart subtotal below `minOrder`, or unknown code. Checkout
`POST /orders/quote` and `POST /orders` accept `couponCode`; the discount is
recomputed server-side and `usedCount` is incremented atomically when the order
is placed, then released if placement fails or the order is cancelled.

## Orders — Phase 7 (implemented)

| Method | Endpoint        | Access | Purpose                                             |
| ------ | --------------- | ------ | --------------------------------------------------- |
| POST   | `/orders/quote` | auth   | Server-computed checkout quote for the current cart |
| POST   | `/orders`       | auth   | Place order `{ addressId, couponCode? }`            |
| GET    | `/orders`       | auth   | Own order history, `?page=1&limit=10` (max 50)      |
| GET    | `/orders/:id`   | auth   | Own order detail                                    |

Pricing is always computed on the server in integer paise from the cart's locked
`priceAtAdd` values:

| Rule                 | Value                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| `subtotal`           | Sum of `priceAtAdd × quantity`                                        |
| `discount`           | Coupon discount in paise (`0` when no code is supplied)               |
| `discountedSubtotal` | `max(subtotal - discount, 0)`                                         |
| `shipping`           | 0 when empty or ≥ 99,900; otherwise 4,900                             |
| `tax`                | `round(discountedSubtotal × 18 / 118)` (GST already inside the price) |
| `total`              | `discountedSubtotal + shipping`                                       |

Quote response `data: { quote }`:

```json
{
  "pricing": {
    "subtotal": 49900,
    "tax": 7612,
    "shipping": 4900,
    "discount": 0,
    "total": 54800
  },
  "itemCount": 1,
  "priceChanged": false,
  "couponCode": null
}
```

Place-order response `data: { order }` with `201`. `OrderDTO` contains
`id`, `orderNumber` (`ORD-YYYYMMDD-XXXXXX`), `items[]`, `address`, `pricing`,
`couponCode`, `status`, `paymentStatus`, `createdAt` and `updatedAt`. Each item
snapshots `productId`, `name`, `slug`, `image`, `price`, `quantity`, `lineTotal`.
The address snapshots `fullName`, `phone`, `line1`, `line2`, `city`, `state`,
`pincode`.

Rules and errors:

- Empty cart → `400 Your cart is empty`.
- Unknown or another user's address → `404 Address not found`.
- An invalid coupon code → `400` with the reason (inactive, expired, usage
  limit, minimum order, unknown). A code that is fully redeemed between quote
  and order returns `409`.
- Insufficient stock → `409 <product> no longer has <n> units in stock`; any
  stock already decremented for earlier lines is restored.
- On success stock is decremented, the cart is cleared, and the order is saved
  with `status: placed` and `paymentStatus: pending`.
- `GET /orders` returns `meta: { page, limit, total, totalPages }`; list and
  detail are scoped to the signed-in user, so another user's id returns `404`.

## Order lifecycle — Phase 9 (implemented)

### Customer cancellation

| Method | Endpoint             | Access       | Purpose                                        |
| ------ | -------------------- | ------------ | ---------------------------------------------- |
| PATCH  | `/orders/:id/cancel` | auth (owner) | Cancel while status is `placed` or `confirmed` |

Response `data: { order, refundPending }`. `refundPending` is `true` when the
order was paid but the gateway refund call failed; the order is already
`cancelled` and a later retry re-attempts the refund.

Rules:

- Only `placed` and `confirmed` orders can be cancelled. `shipped` and
  `delivered` orders return `409`, and `cancelled` returns the same order
  (idempotent).
- The transition is a conditional `findOneAndUpdate` guarded by the current
  status, so two simultaneous cancels cannot both restore stock or refund.
- Stock is restored per line only after the transition succeeds.
- A paid order is refunded through the provider and its `paymentStatus`
  becomes `refunded`; if the gateway call fails, the payment is reset to `paid`,
  `refundPending` is returned, and no refund id is stored.
- A payment captured after cancellation is detected during verification and
  refunded automatically.

### Admin order management

| Method | Endpoint                   | Access | Purpose                                                             |
| ------ | -------------------------- | ------ | ------------------------------------------------------------------- |
| GET    | `/admin/orders`            | admin  | All orders with `?page`, `?limit` (max 50), `?status`, `?userId`    |
| GET    | `/admin/orders/:id`        | admin  | Any order detail with customer summary                              |
| PATCH  | `/admin/orders/:id/status` | admin  | Move an order to `confirmed`, `shipped`, `delivered` or `cancelled` |

List response `data: { orders, meta }`. Admin orders are `OrderDTO` plus
`customer: { id, name, email }`. The service resolves customers with one
`User.find({ _id: { $in } })`, not one query per order.

Status update body:

```json
{
  "status": "shipped",
  "carrier": "Delhivery",
  "trackingNumber": "AWB-123456",
  "note": "Handed to carrier"
}
```

Allowed transitions:

| From        | To                       |
| ----------- | ------------------------ |
| `placed`    | `confirmed`, `cancelled` |
| `confirmed` | `shipped`, `cancelled`   |
| `shipped`   | `delivered`              |
| `delivered` | none                     |
| `cancelled` | none                     |

Rules:

- `confirmed` requires `paymentStatus: paid`, otherwise `409`.
- `shipped` requires both `carrier` and `trackingNumber`; sending only one is a
  validation `400`. The tracking object stores `{ carrier, trackingNumber,
updatedAt }`, and cancelling clears it.
- `note` is optional and limited to 300 characters; it is stored on the
  status-history entry.
- Transitions are conditional updates guarded by the previous status, so a
  stale admin screen cannot skip or repeat a step (`409`).
- Cancelling from the admin surface reuses the customer cancellation service,
  including stock restoration and refunds.

`OrderDTO` (Phase 9) adds:

```json
{
  "statusHistory": [
    { "status": "placed", "at": "2026-11-09T01:35:00.000Z", "note": null },
    {
      "status": "confirmed",
      "at": "2026-11-09T01:35:00.000Z",
      "note": "Payment received"
    },
    {
      "status": "shipped",
      "at": "2026-11-09T01:41:00.000Z",
      "note": "Handed to carrier"
    }
  ],
  "tracking": {
    "carrier": "Delhivery",
    "trackingNumber": "AWB-PHASE9-001",
    "updatedAt": "2026-11-09T01:41:00.000Z"
  }
}
```

The mapper guarantees a `placed` entry and the current status even for orders
created before `statusHistory` existed.

## Payments — Phase 8 (implemented)

| Method | Endpoint                  | Access                          | Purpose                                                 |
| ------ | ------------------------- | ------------------------------- | ------------------------------------------------------- |
| POST   | `/payments/start`         | auth                            | Create or reuse a payment attempt for `{ orderId }`     |
| POST   | `/payments/verify`        | auth                            | Verify the gateway response and mark the order paid     |
| POST   | `/payments/abandon`       | auth                            | Mark the open attempt failed when checkout is dismissed |
| POST   | `/payments/mock/complete` | auth, mock mode only            | `{ orderId, outcome: "success" \| "failure" }`          |
| POST   | `/payments/webhook`       | public + `x-razorpay-signature` | Raw-body gateway events                                 |

`start` returns `data: { payment }`. The payment DTO contains `id`, `orderId`,
`provider` (`mock` \| `razorpay`), `providerOrderId`, `providerPaymentId`,
`amount`, `currency`, `status` (`created` \| `paid` \| `failed` \|
`refund_pending` \| `refunded`), `failureReason`, `attempts`, `paidAt`,
`refundId`, `refundedAt`, `createdAt`, `updatedAt`, plus `keyId`
(the public Razorpay key id, or `mock`). Secrets are never returned.

`verify` expects the exact fields the Razorpay checkout handler receives:

```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "<64-character hex>"
}
```

The server recomputes
`HMAC_SHA256("<razorpay_order_id>|<razorpay_payment_id>", RAZORPAY_KEY_SECRET)`
and compares in constant time.

Rules and errors:

- One payment document per order (`orderId` unique). Repeating `start` while
  `status: created` returns the same `providerOrderId` and keeps `attempts`.
- A paid order or a cancelled order cannot start a payment → `409`.
- Another user's order or payment → `404` (queries are `userId`-scoped).
- Invalid or malformed signature → `400 Payment signature verification failed`
  (or validation `400`); the order stays pending.
- Valid signature: payment `paid`, `paidAt` set, order `paymentStatus: paid`,
  and a `placed` order moves to `confirmed`. Replaying the same signed pair is
  idempotent; a different payment id for the same gateway order → `409`.
- `abandon` and simulated failure set payment `failed` with
  `failureReason: abandoned` / `simulated_failure` and order
  `paymentStatus: failed`; a paid payment is never downgraded.
- Retrying after failure creates a new provider order, increments `attempts` and
  puts the order back to `paymentStatus: pending`.
- `mock/complete` returns `400`/`404` outside mock mode. On success it returns
  `credentials` signed with the same key-secret HMAC, so the client still calls
  `verify`. On failure it returns the failed payment and no credentials.
- Success responses are `200`; `start` is idempotent rather than `201`.

Webhook:

- Mounted with `express.raw({ type: "application/json" })` before
  `express.json()`, so the signature is checked over the exact bytes.
- Signature header: `x-razorpay-signature`, HMAC-SHA256 of the raw body using
  `RAZORPAY_WEBHOOK_SECRET`.
- `payment.captured` and `order.paid` confirm the payment; `payment.failed` marks
  it failed.
- Unknown orders, unsupported events and amount/currency mismatches return
  `200 { handled: false }` without state changes.
- Missing/invalid signature or malformed JSON → `400`.
- Response: `data: { handled: boolean }`.
- Replays are safe: updates are guarded with `status: { $ne: "paid" }`.

## Admin — Phase 10 (implemented)

| Method | Endpoint                       | Access | Purpose                                                                   |
| ------ | ------------------------------ | ------ | ------------------------------------------------------------------------- |
| GET    | `/admin/stats`                 | admin  | Revenue, orders, top products, low stock                                  |
| GET    | `/admin/customers`             | admin  | Customer list with order counts (`?search`, `?status`, `?page`, `?limit`) |
| GET    | `/admin/customers/:id`         | admin  | Customer detail with recent orders                                        |
| PATCH  | `/admin/customers/:id/status`  | admin  | Activate / deactivate customer                                            |
| POST   | `/admin/uploads/product-image` | admin  | Upload a product image to Cloudinary                                      |

`GET /admin/stats` response `data: { stats }` includes:
`revenue { total, last30Days, today }`, `orders { total, pendingPayments, byStatus }`,
`customers { total, active, newLast30Days }`, `products { total, lowStock, outOfStock }`,
`coupons { total, active }`, `dailySales[]` (seven `{ date, revenue, orders }`
UTC buckets), `topProducts[]` (`{ id, name, slug, unitsSold, revenue }`),
`lowStockProducts[]`, and `recentOrders[]` with customer summaries. Revenue and
top products count paid orders only and exclude cancelled orders.

`PATCH /admin/customers/:id/status` body `{ isActive: boolean }`. Deactivation
clears the stored refresh session; the next authenticated request with the old
access token returns `401`.

`POST /admin/uploads/product-image` is `multipart/form-data` with field `image`
(JPEG, PNG or WebP, max 5 MB). Response `data: { image: { url, publicId } }`.
Missing file or wrong type → `400`; Cloudinary not configured → `503`.

---

## Endpoint ownership

| Phase | Endpoints added                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------- |
| 1     | `/health`                                                                                                  |
| 2     | `/auth/*`, `/admin/ping`                                                                                   |
| 3     | `/categories/*`, `/products/*`                                                                             |
| 6     | `/cart/*`, `/wishlist/*`                                                                                   |
| 7     | `/addresses/*`, `POST /orders/quote`, `POST /orders`, `GET /orders/*`                                      |
| 8     | `/payments/start`, `/payments/verify`, `/payments/abandon`, `/payments/mock/complete`, `/payments/webhook` |
| 9     | `PATCH /orders/:id/cancel`, `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status` |
| 10    | `/coupons/*`, `/admin/*`                                                                                   |

Any endpoint added outside this document must be recorded here in the same
commit that introduces it.
