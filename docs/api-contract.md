# API Contract

Planned REST surface for the e-commerce platform. Treat this as the frozen
contract the frontend is built against; changes require a note in
`PROJECT_CONTEXT.md` and a `CHANGELOG.md` entry.

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
| POST | `/auth/logout` | auth | Revoke refresh token, clear cookie |
| GET | `/auth/me` | auth | Current session user |

## Users — Phase 2

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/users/me` | auth | Profile |
| PATCH | `/users/me` | auth | Update name / phone |
| PATCH | `/users/me/password` | auth | Change password (requires current password) |

## Addresses — Phase 7

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/addresses` | auth | List own addresses |
| POST | `/addresses` | auth | Add address |
| PATCH | `/addresses/:id` | auth | Edit own address |
| DELETE | `/addresses/:id` | auth | Remove own address |
| PATCH | `/addresses/:id/default` | auth | Set default address |

## Categories — Phase 3

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/categories` | public | List categories (nested tree) |
| GET | `/categories/:slug` | public | Category detail |
| POST | `/categories` | admin | Create |
| PATCH | `/categories/:id` | admin | Update |
| DELETE | `/categories/:id` | admin | Soft delete |

## Products — Phase 3

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/products` | public | List with `q`, `category`, `minPrice`, `maxPrice`, `rating`, `inStock`, `sort`, pagination |
| GET | `/products/:slug` | public | Detail |
| POST | `/products` | admin | Create |
| PATCH | `/products/:id` | admin | Update |
| DELETE | `/products/:id` | admin | Soft delete |
| PATCH | `/products/:id/stock` | admin | Set stock / adjust inventory |

## Reviews — Phase 5 / 11

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/products/:slug/reviews` | public | Paginated reviews + rating summary |
| POST | `/products/:id/reviews` | auth | Create review (verified purchase later) |
| PATCH | `/reviews/:id` | auth (owner) | Edit review |
| DELETE | `/reviews/:id` | auth (owner/admin) | Delete review |

## Cart — Phase 6

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/cart` | auth | Cart with computed totals |
| POST | `/cart/items` | auth | Add `{ productId, quantity }` |
| PATCH | `/cart/items/:productId` | auth | Set quantity |
| DELETE | `/cart/items/:productId` | auth | Remove item |
| DELETE | `/cart` | auth | Clear cart |

## Wishlist — Phase 6

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/wishlist` | auth | List wishlist products |
| POST | `/wishlist/:productId` | auth | Add |
| DELETE | `/wishlist/:productId` | auth | Remove |

## Coupons — Phase 10

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/coupons/validate` | auth | Validate code against cart subtotal |
| GET | `/admin/coupons` | admin | List |
| POST | `/admin/coupons` | admin | Create |
| PATCH | `/admin/coupons/:id` | admin | Update |
| DELETE | `/admin/coupons/:id` | admin | Deactivate |

## Orders — Phase 7 / 9

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/orders` | auth | Place order from cart + address + coupon |
| GET | `/orders` | auth | Own order history |
| GET | `/orders/:id` | auth | Own order detail |
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
| 2 | `/auth/*`, `/users/*` |
| 3 | `/categories/*`, `/products/*` |
| 6 | `/cart/*`, `/wishlist/*` |
| 7 | `/addresses/*`, `POST /orders`, `GET /orders*` |
| 8 | `/payments/*` |
| 9 | cancel + admin order routes |
| 10 | `/coupons/*`, `/admin/*` |

Any endpoint added outside this document must be recorded here in the same
commit that introduces it.
