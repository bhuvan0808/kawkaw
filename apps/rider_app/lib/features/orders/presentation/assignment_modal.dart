import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';
import 'package:vibration/vibration.dart';

import '../../../core/realtime/realtime_service.dart';
import '../../../core/router/routes.dart';
import '../application/orders_providers.dart';

bool _modalOpen = false;

/// Shows a hard-to-miss new-assignment modal with sound + vibration, and
/// Accept / Reject actions. De-duplicates so two events don't stack.
Future<void> showAssignmentModal(BuildContext context, WidgetRef ref, AssignmentEvent event) async {
  if (_modalOpen) return;
  _modalOpen = true;

  // Alert: strong vibration pattern + repeated system alert sound.
  Timer? alertTimer;
  try {
    if (await Vibration.hasVibrator()) {
      Vibration.vibrate(pattern: const [0, 600, 300, 600, 300, 600], intensities: const [0, 255, 0, 255, 0, 255]);
    }
  } catch (_) {}
  if (!context.mounted) {
    _modalOpen = false;
    return;
  }
  alertTimer = Timer.periodic(const Duration(seconds: 2), (_) {
    SystemSound.play(SystemSoundType.alert);
    HapticFeedback.heavyImpact();
  });
  SystemSound.play(SystemSoundType.alert);

  await showModalBottomSheet<void>(
    context: context,
    isDismissible: false,
    enableDrag: false,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _AssignmentSheet(event: event),
  );

  alertTimer.cancel();
  try {
    Vibration.cancel();
  } catch (_) {}
  _modalOpen = false;
}

class _AssignmentSheet extends ConsumerStatefulWidget {
  const _AssignmentSheet({required this.event});
  final AssignmentEvent event;

  @override
  ConsumerState<_AssignmentSheet> createState() => _AssignmentSheetState();
}

class _AssignmentSheetState extends ConsumerState<_AssignmentSheet> {
  bool _busy = false;

  Future<void> _accept() async {
    setState(() => _busy = true);
    try {
      await ref.read(riderOrdersRepositoryProvider).accept(widget.event.orderId);
      ref.invalidate(orderQueueProvider);
      // Drop the cached ASSIGNED snapshot this modal pre-fetched so the delivery
      // screen opens on the fresh ACCEPTED state (action = "Confirm pickup") rather
      // than re-showing "Accept order" and re-accepting an already-accepted order.
      ref.invalidate(orderDetailProvider(widget.event.orderId));
      if (mounted) {
        Navigator.of(context).pop();
        context.push(Routes.delivery(widget.event.orderId));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _reject() async {
    setState(() => _busy = true);
    try {
      await ref.read(riderOrdersRepositoryProvider).reject(widget.event.orderId, 'Rider unavailable');
      ref.invalidate(orderQueueProvider);
    } catch (_) {
      // even if reject fails, dismiss; it stays in queue
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final detail = ref.watch(orderDetailProvider(widget.event.orderId));
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(AppSpacing.lg),
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppRadius.brXxl,
          boxShadow: AppElevation.high,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: const BoxDecoration(color: AppColors.secondarySoft, shape: BoxShape.circle),
              child: const Icon(Icons.notifications_active_rounded, color: AppColors.secondary, size: 36),
            ),
            AppSpacing.gapLg,
            Text('New delivery!', style: AppTypography.headlineLarge),
            AppSpacing.gapXs,
            Text(
              widget.event.orderNumber ?? widget.event.orderId,
              style: AppTypography.bodyMedium,
            ),
            AppSpacing.gapLg,
            detail.maybeWhen(
              data: (o) => Column(
                children: [
                  _row(Icons.location_on_rounded, o.address?.summary ?? 'Delivery address'),
                  AppSpacing.gapSm,
                  _row(Icons.payments_rounded, 'Payout ₹${o.deliveryFee.toStringAsFixed(0)} · ${o.items.length} item(s) · COD ₹${o.total.toStringAsFixed(0)}'),
                ],
              ),
              orElse: () => const SizedBox.shrink(),
            ),
            AppSpacing.gapXl,
            Row(
              children: [
                Expanded(
                  child: KawButton(
                    label: 'Reject',
                    variant: KawButtonVariant.outlined,
                    onPressed: _busy ? null : _reject,
                  ),
                ),
                AppSpacing.wGapMd,
                Expanded(
                  child: KawButton(label: 'Accept', isLoading: _busy, onPressed: _accept),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(IconData icon, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.secondary),
        AppSpacing.wGapSm,
        Expanded(child: Text(text, style: AppTypography.bodyLarge)),
      ],
    );
  }
}
