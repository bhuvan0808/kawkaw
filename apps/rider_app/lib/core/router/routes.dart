abstract final class Routes {
  static const splash = '/';
  static const login = '/login';
  static const otp = '/otp';

  static const dashboard = '/dashboard';
  static const earnings = '/earnings';
  static const profile = '/profile';

  static String delivery(String id) => '/delivery/$id';
  static const notifications = '/notifications';
  static const support = '/support';
}
