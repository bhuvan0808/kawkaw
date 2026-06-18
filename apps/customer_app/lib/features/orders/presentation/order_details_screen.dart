import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../core/router/routes.dart';
import '../application/orders_providers.dart';
import '../data/order.dart';
import 'widgets/order_status_badge.dart';

class OrderDetailsScreen extends ConsumerWidget {
  const OrderDetailsScreen({super.key, required this.orderId});
  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderDetailsProvider(orderId));
    return Scaffold(
      appBar: AppBar(title: const Text('Order details')),
      body: order.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(orderDetailsProvider(orderId))),
        data: (o) => _Body(order: o),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.order});
  final Order order;

  Map<KawOrderStatus, String> _timestamps() {
    final map = <KawOrderStatus, String>{};
    for (final e in order.statusHistory) {
      map[KawOrderStatusX.fromApi(e.status)] = DateFormat('h:mm a').format(e.createdAt.toLocal());
    }
    return map;
  }

  Future<void> _cancel(BuildContext context, WidgetRef ref) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel order?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Cancel order')),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      await ref.read(ordersRepositoryProvider).cancel(order.id, 'Cancelled by customer');
      ref.invalidate(orderDetailsProvider(order.id));
      ref.invalidate(pagedOrdersProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(order.orderNumber, style: AppTypography.titleMedium),
            OrderStatusBadge(status: order.status),
          ],
        ),
        AppSpacing.gapLg,
        if (order.isLive)
          KawButton(
            label: 'Track live',
            icon: Icons.location_searching_rounded,
            onPressed: () => context.push(Routes.orderTracking(order.id)),
          ),
        AppSpacing.gapLg,
        KawCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Status', style: AppTypography.titleMedium),
              AppSpacing.gapMd,
              OrderStatusTimeline(
                current: KawOrderStatusX.fromApi(order.status),
                timestamps: _timestamps(),
              ),
            ],
          ),
        ),
        AppSpacing.gapLg,
        KawCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Items', style: AppTypography.titleMedium),
              AppSpacing.gapMd,
              for (final item in order.items)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text('${item.quantity} × ${item.productName}', style: AppTypography.bodyLarge)),
                      Text('₹${item.total.toStringAsFixed(0)}', style: AppTypography.bodyLarge),
                    ],
                  ),
                ),
              const Divider(),
              _row('Item total', order.subtotal),
              if (order.discount > 0) _row('Discount', -order.discount),
              _row('Delivery fee', order.deliveryFee),
              if (order.tax > 0) _row('Taxes', order.tax),
              const Divider(),
              _row('Total (COD)', order.total, bold: true),
            ],
          ),
        ),
        if (order.isCancellable) ...[
          AppSpacing.gapLg,
          KawButton(
            label: 'Cancel order',
            variant: KawButtonVariant.outlined,
            onPressed: () => _cancel(context, ref),
          ),
        ],
      ],
    );
  }

  Widget _row(String label, num value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodyMedium),
          Text(
            '₹${value.toStringAsFixed(0)}',
            style: bold ? AppTypography.titleMedium : AppTypography.bodyLarge,
          ),
        ],
      ),
    );
  }
}
