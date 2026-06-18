/// REST endpoint paths used by the rider app (relative to AppConfig.apiV1).
abstract final class ApiEndpoints {
  // Auth
  static const String firebaseLogin = '/auth/firebase';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';

  // Rider profile / status / location / earnings
  static const String riderRegister = '/riders/register';
  static const String riderMe = '/riders/me';
  static const String riderStatus = '/riders/me/status';
  static const String riderLocation = '/riders/me/location';
  static const String riderEarnings = '/riders/me/earnings';
  static const String riderEarningsSummary = '/riders/me/earnings/summary';

  // Order queue + lifecycle (rider actions)
  static const String orderQueue = '/orders/rider/queue';
  static String order(String id) => '/orders/$id';
  static String acceptOrder(String id) => '/orders/$id/accept';
  static String rejectOrder(String id) => '/orders/$id/reject';
  static String pickupOrder(String id) => '/orders/$id/pickup';
  static String outForDeliveryOrder(String id) => '/orders/$id/out-for-delivery';
  static String deliverOrder(String id) => '/orders/$id/deliver';

  // Parcels (rider actions)
  static const String parcelQueue = '/parcels/rider/queue';
  static String parcel(String id) => '/parcels/$id';
  static String acceptParcel(String id) => '/parcels/$id/accept';
  static String pickupParcel(String id) => '/parcels/$id/pickup';
  static String outForDeliveryParcel(String id) => '/parcels/$id/out-for-delivery';
  static String deliverParcel(String id) => '/parcels/$id/deliver';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationsUnread = '/notifications/unread-count';
  static const String notificationsReadAll = '/notifications/read-all';
  static String notificationRead(String id) => '/notifications/$id/read';
}
