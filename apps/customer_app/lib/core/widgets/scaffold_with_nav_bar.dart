import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../features/cart/application/cart_controller.dart';
import '../../features/notifications/application/notifications_providers.dart';
import '../router/routes.dart';

/// Hosts the four primary tabs with a persistent cart summary bar, and listens
/// for foreground FCM messages (refreshes the notifications + shows a snackbar).
class ScaffoldWithNavBar extends ConsumerStatefulWidget {
  const ScaffoldWithNavBar({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<ScaffoldWithNavBar> createState() => _ScaffoldWithNavBarState();
}

class _ScaffoldWithNavBarState extends ConsumerState<ScaffoldWithNavBar> {
  StreamSubscription<RemoteMessage>? _fcmSub;

  @override
  void initState() {
    super.initState();
    try {
      _fcmSub = FirebaseMessaging.onMessage.listen(_onForegroundMessage);
    } catch (_) {
      // Firebase not configured yet — safe to ignore in dev.
    }
  }

  void _onForegroundMessage(RemoteMessage message) {
    ref.invalidate(notificationsProvider);
    ref.invalidate(unreadCountProvider);
    final n = message.notification;
    if (n != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(n.title == null ? (n.body ?? 'New update') : '${n.title}: ${n.body ?? ''}'),
          action: SnackBarAction(
            label: 'View',
            onPressed: () => context.push(Routes.notifications),
          ),
        ),
      );
    }
  }

  @override
  void dispose() {
    _fcmSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartControllerProvider);
    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (!cart.isEmpty) const _CartSummaryBar(),
          BottomNavigationBar(
            currentIndex: widget.navigationShell.currentIndex,
            onTap: (index) => widget.navigationShell.goBranch(
              index,
              initialLocation: index == widget.navigationShell.currentIndex,
            ),
            items: const [
              BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Home'),
              BottomNavigationBarItem(icon: Icon(Icons.grid_view_rounded), label: 'Categories'),
              BottomNavigationBarItem(icon: Icon(Icons.receipt_long_rounded), label: 'Orders'),
              BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profile'),
            ],
          ),
        ],
      ),
    );
  }
}

class _CartSummaryBar extends ConsumerWidget {
  const _CartSummaryBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartControllerProvider);
    return Material(
      color: AppColors.secondary,
      child: InkWell(
        onTap: () => context.push(Routes.cart),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
          child: Row(
            children: [
              const Icon(Icons.shopping_cart_rounded, color: AppColors.onSecondary, size: 20),
              AppSpacing.wGapSm,
              Text(
                '${cart.totalItems} item${cart.totalItems == 1 ? '' : 's'}',
                style: AppTypography.label.copyWith(color: AppColors.onSecondary),
              ),
              const Spacer(),
              Text(
                'View cart  ₹${cart.subtotal.toStringAsFixed(0)}',
                style: AppTypography.button.copyWith(color: AppColors.onSecondary, fontSize: 14),
              ),
              const Icon(Icons.arrow_forward_rounded, color: AppColors.onSecondary, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}
