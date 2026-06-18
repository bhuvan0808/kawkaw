/// Centralised route paths & names.
abstract final class Routes {
  static const splash = '/';
  static const login = '/login';
  static const otp = '/otp';

  static const home = '/home';
  static const categories = '/categories';
  static const orders = '/orders';
  static const profile = '/profile';
  static const editProfile = '/profile/edit';

  static const products = '/products';
  static String productDetails(String id) => '/products/$id';
  static const search = '/search';

  static const cart = '/cart';
  static const checkout = '/checkout';

  static String orderDetails(String id) => '/orders/$id';
  static String orderTracking(String id) => '/orders/$id/track';

  static const addresses = '/addresses';
  static const addressForm = '/addresses/form';
  static const addressPicker = '/addresses/pick';

  static const notifications = '/notifications';
  static const support = '/support';
}
