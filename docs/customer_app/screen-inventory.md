# Customer App — Screen & Wiring Inventory (Phase 2 audit)

Static inventory generated from the code (not runtime-verified — Flutter not yet run).
Use alongside the [testing checklist](./testing-checklist.md).

## Routes (`core/router`)

| Path | Screen | Guard / placement |
|------|--------|-------------------|
| `/` | SplashScreen | session-restore gate |
| `/login` | PhoneLoginScreen | unauthenticated only |
| `/otp` | OtpScreen (extra: `OtpArgs`) | unauthenticated only |
| `/home` | HomeScreen | shell tab 1 (authed) |
| `/categories` | CategoriesScreen | shell tab 2 |
| `/orders` | OrdersScreen | shell tab 3 |
| `/profile` | ProfileScreen | shell tab 4 |
| `/products?serviceType&categoryId&title` | ProductListScreen | pushed (root) |
| `/products/:id` | ProductDetailsScreen | pushed |
| `/search` | SearchScreen | pushed |
| `/cart` | CartScreen | pushed |
| `/checkout` | CheckoutScreen | pushed |
| `/orders/:id` | OrderDetailsScreen | pushed |
| `/orders/:id/track` | OrderTrackingScreen | pushed |
| `/addresses` | AddressesScreen | pushed |
| `/addresses/form` (extra: `Address?`) | AddressFormScreen | pushed |
| `/addresses/pick` | AddressPickerScreen | pushed (returns `GeoPlace`) |
| `/notifications` | NotificationsScreen | pushed |
| `/support` | SupportScreen | pushed |

**19 screens**, auth-guarded via a `refreshListenable` tied to `authControllerProvider`.

## Dialogs & sheets
- **AlertDialog** — "Start a new cart?" service-conflict (product tile + product details).
- **AlertDialog** — "Cancel order?" confirmation (order details).
- **showAboutDialog** — About Kaw Kaw (profile).
- **PopupMenu** — address actions (edit / set-default / delete).
- Persistent panels (not modal sheets): cart summary bar, rider tracking card, checkout bill bar.
- _No `showModalBottomSheet` used yet._

## Riverpod providers
| Provider | Type | Purpose |
|----------|------|---------|
| `secureStorageProvider` | Provider | FlutterSecureStorage |
| `tokenStorageProvider` | Provider | JWT storage |
| `dioProvider` | Provider | authed Dio (+refresh) |
| `appRouterProvider` | Provider | GoRouter |
| `firebaseAuthServiceProvider` | Provider | Firebase phone auth |
| `authRepositoryProvider` | Provider | auth API |
| `authControllerProvider` | Notifier | session state machine |
| `catalogRepositoryProvider` | Provider | catalogue API |
| `categoriesProvider(serviceType?)` | FutureProvider.family | categories |
| `featuredProductsProvider(serviceType?)` | FutureProvider.family | featured |
| `productsProvider(ProductQuery)` | FutureProvider.family | product list/search |
| `productDetailsProvider(id)` | FutureProvider.family | product detail |
| `cartControllerProvider` | Notifier | local cart |
| `addressRepositoryProvider` | Provider | address API |
| `addressControllerProvider` | AsyncNotifier | addresses |
| `defaultAddressProvider` | Provider | default address |
| `ordersRepositoryProvider` | Provider | orders API |
| `myOrdersProvider` | FutureProvider.autoDispose | order history |
| `orderDetailsProvider(id)` | FutureProvider.family.autoDispose | order detail/tracking |
| `notificationsRepositoryProvider` | Provider | notifications API |
| `notificationsProvider` | FutureProvider.autoDispose | notifications list |
| `unreadCountProvider` | FutureProvider.autoDispose | unread count (⚠ not surfaced in UI) |
| `prescriptionsRepositoryProvider` | Provider | Rx upload |
| `publicSettingsProvider` | FutureProvider | delivery fee/tax/store flags |
| `nominatimServiceProvider` / `osrmServiceProvider` / `locationServiceProvider` | Provider | maps |
| `_serviceFilterProvider` | StateProvider.autoDispose | categories filter (private) |

## Repositories & services
AuthRepository · FirebaseAuthService · TokenStorage · CatalogRepository · AddressRepository ·
OrdersRepository · NotificationsRepository · PrescriptionsRepository · NominatimService ·
OsrmService · LocationService · RealtimeService (Socket.IO).

## API endpoints — consumed vs declared

**Consumed:** `POST /auth/firebase`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`,
`GET /categories`, `GET /products`, `GET /products/featured`, `GET /products/:id`,
`GET/POST /addresses`, `PATCH/DELETE /addresses/:id`, `PATCH /addresses/:id/default`,
`GET /orders`, `GET /orders/:id`, `POST /orders`, `POST /orders/:id/cancel`,
`POST /prescriptions/upload`, `GET /notifications`, `GET /notifications/unread-count`,
`PATCH /notifications/:id/read`, `PATCH /notifications/read-all`, `GET /settings/public`,
WebSocket `/realtime` (`order:subscribe`, `order:status_changed`, `rider:location`).

**Declared but NOT consumed (gaps):** `PATCH /users/me` (profile edit), `POST /parcels`,
`POST /parcels/quote` (parcel booking), `GET /prescriptions/mine`, `POST /coupons/validate`.

## Gaps — resolution status (audit follow-up)

| # | Gap | Status |
|---|-----|--------|
| 1 | Parcel chip dead-end | ✅ **Fixed** — Parcel removed from the customer app's service chips (home + categories). Parcel booking is out of scope for V1; the shared `KawService.parcel` stays for the rider app. |
| 2 | Foreground FCM not surfaced | ✅ **Fixed** — `FirebaseMessaging.onMessage` listener in the nav shell refreshes notifications + shows a snackbar with a "View" action. |
| 3 | Unread badge | ✅ **Fixed** — `Badge` on the Home bell driven by `unreadCountProvider`. |
| 4 | List pagination | ✅ **Fixed** — infinite scroll via `pagedProductsProvider` (list + search) and `pagedOrdersProvider` (orders), with load-more footers. |
| 5 | Profile read-only | ✅ **Fixed** — Edit Profile screen (`/profile/edit`) → `PATCH /users/me`. |
| 6 | Coupon entry | ✅ **Fixed** — coupon field at checkout → `POST /coupons/validate`; discount reflected in the bill and sent on order create. |
| 7 | Notification → order deep-link | ⏳ **Deferred** (low) — surface order from `data.orderId` on tap. |
| 8 | "My prescriptions" history | ⏳ **Deferred** (low) — `/prescriptions/mine` unused; upload remains checkout-only. |

After the follow-up, the only remaining declared-but-unused endpoints are `/parcels`,
`/parcels/quote` (Parcel out of scope for V1) and `/prescriptions/mine` (#8 deferred).
**20 routes** now (added `/profile/edit`).
