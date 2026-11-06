# API Contract

Each endpoint marked with a phase is implemented as that phase completes.
Phases 1–7 are live.

## Conventions

| Rule | Value |
|---|---|
| Base URL | `/api/v1` |
| Format | JSON (`application/json`), except the payment webhook (raw body) |
| Auth | `Authorization: Bearer <accessToken>` for protected routes |
| Roles | `customer` (default), `admin` |
| Pagination | `?page=1&limit=20`; responses include `meta: { page, limit, total, totalPages }` |
| Sorting | `?sort=price_asc`, `price_desc`, `newest`, `rating` |
| Money | Integer **paise** in every request/response field |
| Public IDs | Products and categories use `slug`; other resources use ObjectId |
| Deletes | Soft delete; deleted resources return `404` |

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

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 204 | Deleted, no body |
| 400 | Validation / business rule error |
| 401 | Missing or invalid token |
| 403 | Authenticated but role not allowed |
| 404 | Resource not found |
| 409 | Duplicate (email, slug, coupon code) |
| 422 | Semantically invalid (e.g. out of stock) |
| 429 | Rate limited |
| 500 | Unexpected server error |

---

## Health — Phase 1

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | public | Liveness + MongoDB connection state |

## Auth — Phase 2

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Create customer account |
| POST | `/auth/login` | public | Returns access token; sets refresh cookie |
| POST | `/auth/refresh` | public (cookie) | Rotate refresh token, issue access token |
| POST | `/auth/logout` | public (cookie) | Revoke refresh token, clear cookie |
| GET | `/auth/me` | auth | Current session user |

The refresh token lives only in an httpOnly cookie scoped to `/api/v1/auth`.
Access tokens are returned in the JSON body and sent as `Authorization: Bearer`.

## Admin smoke route — Phase 2

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/admin/ping` | admin | Verifies JWT authentication and role checks |

## Users — Phase 5

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/users/me` | auth | Current profile |
| PATCH | `/users/me` | auth | Update `{ name }` (2–50 characters) |
| PATCH | `/users/me/password` | auth | Change password `{ currentPassword, newPassword }` |

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

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/addresses` | auth | List own addresses, default first |
| POST | `/addresses` | auth | Add address |
| PATCH | `/addresses/:id` | auth | Edit own address |
| DELETE | `/addresses/:id` | auth | Remove own address |
| PATCH | `/addresses/:id/default` | auth | Set default address |

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

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/categories` | public | Active categories as a nested tree |
| GET | `/categories/:slug` | public | Category detail |
| POST | `/categories` | admin | Create `{ name, description?, parentId? }` |
| PATCH | `/categories/:id` | admin | Update name, description or parent |
| DELETE | `/categories/:id` | admin | Soft delete; `409` if active children or products exist |

Slugs are generated from the name. A duplicate name gets `-2`, `-3`, and so on.
A category cannot be its own parent, and cycles in the hierarchy are rejected.

## Products — Phase 3

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/products` | public | List with search, filters, sorting, pagination |
| GET | `/products/:slug` | public | Detail |
| POST | `/products` | admin | Create |
| PATCH | `/products/:id` | admin | Update |
| DELETE | `/products/:id` | admin | Soft delete |
| PATCH | `/products/:id/stock` | admin | Set absolute stock `{ stock }` |

List query parameters:

| Parameter | Type | Notes |
|---|---|---|
| `q` | string | Full-text search on name and description |
| `category` | string | Category **slug** |
| `minPrice` | integer | Paise, inclusive |
| `maxPrice` | integer | Paise, inclusive |
| `rating` | number | Minimum average rating, 0–5 |
| `inStock` | `true` \| `false` | Only products with stock > 0 when `true` |
| `sort` | enum | `price_asc`, `price_desc`, `newest` (default), `rating` |
| `page` | integer | Default 1 |
| `limit` | integer | Default 20, max 100 |

Responses include `meta: { page, limit, total, totalPages }`. Product payloads
include `rating: { average, count }` and a `category` summary
`{ id, name, slug }`. Prices are integer paise. Images are URL strings in
Phase 3; Cloudinary uploads arrive in Phase 10.

Create body: `{ name, description, price, categoryId, images?, stock? }`.
`images` defaults to `[]` and `stock` to `0`.

## Reviews — Phase 11

Product cards and detail pages currently show stored `ratingAvg` / `ratingCount`
aggregates. Review documents and endpoints arrive with the testing and security
phase; no review API exists yet.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/products/:slug/reviews` | public | Paginated reviews + rating summary |
| POST | `/products/:id/reviews` | auth | Create review (verified purchase later) |
| PATCH | `/reviews/:id` | auth (owner) | Edit review |
| DELETE | `/reviews/:id` | auth (owner/admin) | Delete review |

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

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/cart` | auth | Cart with computed totals |
| POST | `/cart/items` | auth | Add `{ productId, quantity }`; quantity 1–10, defaults to 1 |
| PATCH | `/cart/items/:productId` | auth | Set quantity 1–10, re-checks stock |
| DELETE | `/cart/items/:productId` | auth | Remove item; 404 if absent |
| DELETE | `/cart` | auth | Clear cart |

Errors: `404` product/line not found, `409` product unavailable, out of stock or
quantity above stock, `400` quantity outside 1–10.

## Wishlist — Phase 6 (implemented)

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/wishlist` | auth | Active products in save order |
| POST | `/wishlist/:productId` | auth | Idempotent add; 404 if the product is missing |
| DELETE | `/wishlist/:productId` | auth | Idempotent remove |

## Coupons — Phase 10

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/coupons/validate` | auth | Validate code against cart subtotal |
| GET | `/admin/coupons` | admin | List |
| POST | `/admin/coupons` | admin | Create |
| PATCH | `/admin/coupons/:id` | admin | Update |
| DELETE | `/admin/coupons/:id` | admin | Deactivate |

## Orders — Phase 7 (implemented)

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/orders/quote` | auth | Server-computed checkout quote for the current cart |
| POST | `/orders` | auth | Place order `{ addressId, couponCode? }` |
| GET | `/orders` | auth | Own order history, `?page=1&limit=10` (max 50) |
| GET | `/orders/:id` | auth | Own order detail |

Pricing is always computed on the server in integer paise from the cart's locked
`priceAtAdd` values:

| Rule | Value |
|---|---|
| `subtotal` | Sum of `priceAtAdd × quantity` |
| `discount` | 0 until coupons land in Phase 10 |
| `discountedSubtotal` | `max(subtotal - discount, 0)` |
| `shipping` | 0 when empty or ≥ 99,900; otherwise 4,900 |
| `tax` | `round(discountedSubtotal × 18 / 118)` (GST already inside the price) |
| `total` | `discountedSubtotal + shipping` |

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
- A supplied coupon code → `400 Coupon codes are not available yet`.
- Insufficient stock → `409 <product> no longer has <n> units in stock`; any
  stock already decremented for earlier lines is restored.
- On success stock is decremented, the cart is cleared, and the order is saved
  with `status: placed` and `paymentStatus: pending`.
- `GET /orders` returns `meta: { page, limit, total, totalPages }`; list and
  detail are scoped to the signed-in user, so another user's id returns `404`.

## Orders — Phase 9 (planned)

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| PATCH | `/orders/:id/cancel` | auth | Cancel if status allows |
| GET | `/admin/orders` | admin | All orders, filter by status/user |
| GET | `/admin/orders/:id` | admin | Order detail |
| PATCH | `/admin/orders/:id/status` | admin | Advance status |

## Payments — Phase 8

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/payments/orders` | auth | Create Razorpay order for an app order |
| POST | `/payments/verify` | auth | Verify signature, mark paid |
| POST | `/payments/webhook` | public (signed) | Gateway webhook; raw body required |

## Admin — Phase 10

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/admin/stats` | admin | Revenue, orders, top products, low stock |
| GET | `/admin/customers` | admin | Customer list with order counts |
| GET | `/admin/customers/:id` | admin | Customer detail |
| PATCH | `/admin/customers/:id/status` | admin | Activate / deactivate customer |

---

## Endpoint ownership

| Phase | Endpoints added |
|---|---|
| 1 | `/health` |
| 2 | `/auth/*`, `/admin/ping` |
| 3 | `/categories/*`, `/products/*` |
| 6 | `/cart/*`, `/wishlist/*` |
| 7 | `/addresses/*`, `POST /orders/quote`, `POST /orders`, `GET /orders/*` |
| 8 | `/payments/*` |
| 9 | cancel + admin order routes |
| 10 | `/coupons/*`, `/admin/*` |

Any endpoint added outside this document must be recorded here in the same
commit that introduces it.
