import 'package:flutter/material.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../core/location/background_location_service.dart';
import '../../../core/router/routes.dart';
import '../../orders/application/orders_providers.dart';
import '../../orders/data/delivery_order.dart';
import '../application/rider_providers.dart';
import '../data/rider_profile.dart';
import 'widgets/register_rider_card.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  bool _toggling = false;
  bool _batteryOptimized = false; // true = optimization ON (bad for us)
  String? _lastLocationAt;

  void _onTaskData(Object data) {
    if (data is Map && data['at'] != null && mounted) {
      setState(() => _lastLocationAt = data['at'].toString());
    }
  }

  @override
  void initState() {
    super.initState();
    FlutterForegroundTask.addTaskDataCallback(_onTaskData);
    WidgetsBinding.instance.addPostFrameCallback((_) => _refreshBattery());
  }

  Future<void> _refreshBattery() async {
    final ignoring = await BackgroundLocationService.isIgnoringBatteryOptimizations();
    if (mounted) setState(() => _batteryOptimized = !ignoring);
  }

  @override
  void dispose() {
    FlutterForegroundTask.removeTaskDataCallback(_onTaskData);
    super.dispose();
  }

  Future<void> _toggle(bool value) async {
    setState(() => _toggling = true);
    try {
      if (value) {
        await ref.read(riderControllerProvider).goOnline();
        await _refreshBattery();
      } else {
        await ref.read(riderControllerProvider).goOffline();
      }
    } on LocationPermissionRequired {
      if (mounted) _showPermissionDialog();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _toggling = false);
    }
  }

  void _showPermissionDialog() {
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Location permission needed'),
        content: const Text(
          'To go online and receive deliveries, allow location access — set it to '
          '"Allow all the time" so updates continue when your screen is locked.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Not now')),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              BackgroundLocationService.ensurePermissions();
            },
            child: const Text('Grant'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(riderProfileProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            onPressed: () => context.push(Routes.notifications),
            icon: const Icon(Icons.notifications_none_rounded),
          ),
        ],
      ),
      body: profile.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(riderProfileProvider)),
        data: (rider) {
          if (rider == null) return const RegisterRiderCard();
          if (!rider.isVerified) return const _PendingVerification();
          return _OnlineDashboard(
            rider: rider,
            toggling: _toggling,
            batteryOptimized: _batteryOptimized,
            lastLocationAt: _lastLocationAt,
            onToggle: _toggle,
          );
        },
      ),
    );
  }
}

class _PendingVerification extends StatelessWidget {
  const _PendingVerification();
  @override
  Widget build(BuildContext context) {
    return const EmptyView(
      title: 'Verification pending',
      message: 'Your rider profile is under review. You can go online once an admin verifies you.',
      icon: Icons.hourglass_top_rounded,
    );
  }
}

class _OnlineDashboard extends ConsumerWidget {
  const _OnlineDashboard({
    required this.rider,
    required this.toggling,
    required this.batteryOptimized,
    required this.lastLocationAt,
    required this.onToggle,
  });

  final RiderProfile rider;
  final bool toggling;
  final bool batteryOptimized;
  final String? lastLocationAt;
  final ValueChanged<bool> onToggle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final online = rider.isOnline;
    final queue = ref.watch(orderQueueProvider);
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(riderProfileProvider);
        ref.invalidate(orderQueueProvider);
      },
      child: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          KawCard(
            color: online ? AppColors.success.withValues(alpha: 0.12) : AppColors.surface,
            child: Row(
              children: [
                Icon(online ? Icons.bolt_rounded : Icons.power_settings_new_rounded,
                    color: online ? AppColors.success : AppColors.textTertiary),
                AppSpacing.wGapMd,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(online ? 'You are online' : 'You are offline', style: AppTypography.titleMedium),
                      Text(
                        online ? 'Receiving delivery requests' : 'Go online to receive deliveries',
                        style: AppTypography.caption,
                      ),
                    ],
                  ),
                ),
                if (toggling)
                  const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.5))
                else
                  Switch(value: online, onChanged: onToggle, activeThumbColor: AppColors.success),
              ],
            ),
          ),
          if (online && lastLocationAt != null) ...[
            AppSpacing.gapSm,
            Row(
              children: [
                const Icon(Icons.my_location_rounded, size: 14, color: AppColors.success),
                AppSpacing.wGapXs,
                Text(
                  'Location shared at ${_fmtTime(lastLocationAt!)}',
                  style: AppTypography.caption,
                ),
              ],
            ),
          ],
          if (online && batteryOptimized) ...[
            AppSpacing.gapMd,
            _BatteryWarning(),
          ],
          AppSpacing.gapXl,
          Text('Active deliveries', style: AppTypography.titleMedium),
          AppSpacing.gapSm,
          queue.when(
            loading: () => const Padding(padding: EdgeInsets.all(AppSpacing.xl), child: LoadingView()),
            error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(orderQueueProvider)),
            data: (orders) => orders.isEmpty
                ? const EmptyView(
                    title: 'No active deliveries',
                    message: 'New assignments will alert you here.',
                    icon: Icons.inbox_rounded,
                  )
                : Column(children: orders.map((o) => _QueueTile(order: o)).toList()),
          ),
        ],
      ),
    );
  }

  String _fmtTime(String iso) {
    try {
      return DateFormat('h:mm:ss a').format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return 'just now';
    }
  }
}

class _BatteryWarning extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return KawCard(
      color: AppColors.warning.withValues(alpha: 0.12),
      child: Row(
        children: [
          const Icon(Icons.battery_alert_rounded, color: AppColors.warning),
          AppSpacing.wGapMd,
          const Expanded(
            child: Text(
              'Battery optimization may stop location updates when locked. Allow unrestricted background activity.',
              style: AppTypography.caption,
            ),
          ),
          TextButton(
            onPressed: BackgroundLocationService.requestIgnoreBatteryOptimization,
            child: const Text('Fix'),
          ),
        ],
      ),
    );
  }
}

class _QueueTile extends StatelessWidget {
  const _QueueTile({required this.order});
  final DeliveryOrder order;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: KawCard(
        onTap: () => context.push(Routes.delivery(order.id)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(order.orderNumber, style: AppTypography.label),
                KawBadge(label: order.status.replaceAll('_', ' '), color: AppColors.secondary),
              ],
            ),
            AppSpacing.gapXs,
            Text(order.address?.summary ?? 'Delivery address', style: AppTypography.bodyMedium, maxLines: 2),
            AppSpacing.gapSm,
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Payout ₹${order.deliveryFee.toStringAsFixed(0)}', style: AppTypography.label),
                const Icon(Icons.chevron_right_rounded, color: AppColors.secondary),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
