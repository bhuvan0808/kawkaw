import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/orders/application/orders_providers.dart';
import '../../features/orders/presentation/assignment_modal.dart';
import '../../features/rider/application/rider_providers.dart';
import '../providers/providers.dart';
import '../realtime/realtime_providers.dart';
import '../realtime/realtime_service.dart';

/// Hosts the rider tabs and listens — app-wide — for new assignments via both
/// WebSocket and foreground FCM, surfacing the alert modal so jobs aren't missed.
class RiderShell extends ConsumerStatefulWidget {
  const RiderShell({super.key, required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<RiderShell> createState() => _RiderShellState();
}

class _RiderShellState extends ConsumerState<RiderShell> with WidgetsBindingObserver {
  StreamSubscription<AssignmentEvent>? _assignSub;
  StreamSubscription<RemoteMessage>? _fcmSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  Future<void> _init() async {
    final token = await ref.read(tokenStorageProvider).accessToken;
    if (token == null) return;
    final realtime = ref.read(riderRealtimeProvider);
    realtime.connect(token);

    _assignSub = realtime.assignments.listen((event) {
      ref.invalidate(orderQueueProvider);
      if (mounted) showAssignmentModal(context, ref, event);
    });

    try {
      _fcmSub = FirebaseMessaging.onMessage.listen((message) {
        final data = message.data;
        final orderId = data['orderId']?.toString();
        ref.invalidate(orderQueueProvider);
        if (orderId != null && (data['status'] == 'ASSIGNED' || data['type'] == 'RIDER_ASSIGNMENT')) {
          if (mounted) {
            showAssignmentModal(
              context,
              ref,
              AssignmentEvent(orderId: orderId, orderNumber: message.notification?.title),
            );
          }
        }
      });
    } catch (_) {}
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Keep the foreground-service token fresh and reconnect realtime if needed.
      ref.read(riderControllerProvider).refreshServiceToken();
      _reconnectIfNeeded();
    }
  }

  Future<void> _reconnectIfNeeded() async {
    final realtime = ref.read(riderRealtimeProvider);
    if (realtime.isConnected) return;
    final token = await ref.read(tokenStorageProvider).accessToken;
    if (token != null) realtime.connect(token);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _assignSub?.cancel();
    _fcmSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: widget.navigationShell.currentIndex,
        onTap: (i) => widget.navigationShell.goBranch(i, initialLocation: i == widget.navigationShell.currentIndex),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_rounded), label: 'Earnings'),
          BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profile'),
        ],
      ),
    );
  }
}
