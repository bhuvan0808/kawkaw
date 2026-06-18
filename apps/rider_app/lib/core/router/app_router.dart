import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/otp_screen.dart';
import '../../features/auth/presentation/phone_login_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/earnings/presentation/earnings_screen.dart';
import '../../features/notifications/notifications.dart';
import '../../features/orders/presentation/active_delivery_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/rider/presentation/dashboard_screen.dart';
import '../../features/support/presentation/support_screen.dart';
import '../widgets/rider_shell.dart';
import 'routes.dart';

final _rootKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  final authNotifier = ValueNotifier<AuthState>(const AuthState.unknown());
  ref.listen(authControllerProvider, (_, next) => authNotifier.value = next);
  ref.onDispose(authNotifier.dispose);

  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: Routes.splash,
    refreshListenable: authNotifier,
    redirect: (context, state) {
      final auth = ref.read(authControllerProvider);
      final loc = state.matchedLocation;
      final atSplash = loc == Routes.splash;
      final atAuth = loc == Routes.login || loc == Routes.otp;
      if (!auth.isResolved) return atSplash ? null : Routes.splash;
      if (!auth.isAuthenticated) return atAuth ? null : Routes.login;
      if (atSplash || atAuth) return Routes.dashboard;
      return null;
    },
    routes: [
      GoRoute(path: Routes.splash, builder: (_, __) => const SplashScreen()),
      GoRoute(path: Routes.login, builder: (_, __) => const PhoneLoginScreen()),
      GoRoute(
        path: Routes.otp,
        builder: (_, state) => OtpScreen(args: state.extra! as OtpArgs),
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => RiderShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [GoRoute(path: Routes.dashboard, builder: (_, __) => const DashboardScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: Routes.earnings, builder: (_, __) => const EarningsScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: Routes.profile, builder: (_, __) => const ProfileScreen())],
          ),
        ],
      ),
      GoRoute(
        path: '/delivery/:id',
        parentNavigatorKey: _rootKey,
        builder: (_, state) => ActiveDeliveryScreen(orderId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: Routes.notifications,
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const NotificationsScreen(),
      ),
      GoRoute(
        path: Routes.support,
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const SupportScreen(),
      ),
    ],
  );
});
