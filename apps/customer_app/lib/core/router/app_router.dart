import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/addresses/data/address.dart';
import '../../features/addresses/presentation/address_form_screen.dart';
import '../../features/addresses/presentation/address_picker_screen.dart';
import '../../features/addresses/presentation/addresses_screen.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/otp_screen.dart';
import '../../features/auth/presentation/phone_login_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/cart/presentation/cart_screen.dart';
import '../../features/categories/presentation/categories_screen.dart';
import '../../features/checkout/presentation/checkout_screen.dart';
import '../../features/home/presentation/home_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/orders/presentation/order_details_screen.dart';
import '../../features/orders/presentation/order_tracking_screen.dart';
import '../../features/orders/presentation/orders_screen.dart';
import '../../features/products/presentation/product_details_screen.dart';
import '../../features/products/presentation/product_list_screen.dart';
import '../../features/products/presentation/search_screen.dart';
import '../../features/profile/presentation/edit_profile_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/support/presentation/support_screen.dart';
import '../widgets/scaffold_with_nav_bar.dart';
import 'routes.dart';

final _rootKey = GlobalKey<NavigatorState>();
final _shellKey = GlobalKey<NavigatorState>();

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
      // Authenticated: bounce away from splash/auth screens.
      if (atSplash || atAuth) return Routes.home;
      return null;
    },
    routes: [
      GoRoute(path: Routes.splash, builder: (_, __) => const SplashScreen()),
      GoRoute(path: Routes.login, builder: (_, __) => const PhoneLoginScreen()),
      GoRoute(
        path: Routes.otp,
        builder: (_, state) {
          final args = state.extra! as OtpArgs;
          return OtpScreen(args: args);
        },
      ),

      // Main shell with bottom navigation.
      StatefulShellRoute.indexedStack(
        builder: (_, __, navigationShell) => ScaffoldWithNavBar(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            navigatorKey: _shellKey,
            routes: [GoRoute(path: Routes.home, builder: (_, __) => const HomeScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: Routes.categories, builder: (_, __) => const CategoriesScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: Routes.orders, builder: (_, __) => const OrdersScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: Routes.profile, builder: (_, __) => const ProfileScreen())],
          ),
        ],
      ),

      // Top-level pushes.
      GoRoute(
        path: Routes.products,
        parentNavigatorKey: _rootKey,
        builder: (_, state) {
          final q = state.uri.queryParameters;
          return ProductListScreen(
            serviceType: q['serviceType'],
            categoryId: q['categoryId'],
            title: q['title'],
          );
        },
      ),
      GoRoute(
        path: '/products/:id',
        parentNavigatorKey: _rootKey,
        builder: (_, state) => ProductDetailsScreen(productId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: Routes.search,
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const SearchScreen(),
      ),
      GoRoute(
        path: Routes.cart,
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const CartScreen(),
      ),
      GoRoute(
        path: Routes.checkout,
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/orders/:id/track',
        parentNavigatorKey: _rootKey,
        builder: (_, state) => OrderTrackingScreen(orderId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/orders/:id',
        parentNavigatorKey: _rootKey,
        builder: (_, state) => OrderDetailsScreen(orderId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: Routes.addresses,
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const AddressesScreen(),
      ),
      GoRoute(
        path: Routes.addressForm,
        parentNavigatorKey: _rootKey,
        builder: (_, state) => AddressFormScreen(existing: state.extra as Address?),
      ),
      GoRoute(
        path: Routes.addressPicker,
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const AddressPickerScreen(),
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
      GoRoute(
        path: Routes.editProfile,
        parentNavigatorKey: _rootKey,
        builder: (_, __) => const EditProfileScreen(),
      ),
    ],
  );
});
