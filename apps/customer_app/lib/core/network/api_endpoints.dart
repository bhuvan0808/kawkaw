/// Centralized REST endpoint paths (relative to AppConfig.apiV1).
abstract final class ApiEndpoints {
  // Auth
  static const String firebaseLogin = '/auth/firebase';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';

  // Profile
  static const String usersMe = '/users/me';

  // Catalogue
  static const String categories = '/categories';
  static const String products = '/products';
  static const String featuredProducts = '/products/featured';
  static String product(String id) => '/products/$id';

  // Addresses
  static const String addresses = '/addresses';
  static String address(String id) => '/addresses/$id';
  static String addressDefault(String id) => '/addresses/$id/default';

  // Orders
  static const String orders = '/orders';
  static String order(String id) => '/orders/$id';
  static String cancelOrder(String id) => '/orders/$id/cancel';

  // Parcels
  static const String parcels = '/parcels';
  static const String parcelQuote = '/parcels/quote';

  // Prescriptions
  static const String prescriptionUpload = '/prescriptions/upload';
  static const String prescriptionsMine = '/prescriptions/mine';

  // Coupons
  static const String validateCoupon = '/coupons/validate';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationsUnread = '/notifications/unread-count';
  static const String notificationsReadAll = '/notifications/read-all';
  static String notificationRead(String id) => '/notifications/$id/read';

  // Settings
  static const String publicSettings = '/settings/public';
}
