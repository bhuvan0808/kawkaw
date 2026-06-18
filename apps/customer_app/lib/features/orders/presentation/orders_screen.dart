import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../core/router/routes.dart';
import '../application/orders_providers.dart';
import '../data/order.dart';
import 'widgets/order_status_badge.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(() {
      if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 300) {
        ref.read(pagedOrdersProvider.notifier).loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orders = ref.watch(pagedOrdersProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My orders')),
      body: orders.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(pagedOrdersProvider)),
        data: (items) {
          if (items.isEmpty) {
            return EmptyView(
              title: 'No orders yet',
              message: 'Your past and active orders will appear here.',
              icon: Icons.receipt_long_outlined,
              actionLabel: 'Start shopping',
              onAction: () => context.go(Routes.home),
            );
          }
          final hasMore = ref.read(pagedOrdersProvider.notifier).hasMore;
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(pagedOrdersProvider),
            child: ListView.separated(
              controller: _scroll,
              padding: const EdgeInsets.all(AppSpacing.lg),
              itemCount: items.length + (hasMore ? 1 : 0),
              separatorBuilder: (_, __) => AppSpacing.gapMd,
              itemBuilder: (_, i) {
                if (i >= items.length) {
                  return const Padding(
                    padding: EdgeInsets.all(AppSpacing.lg),
                    child: Center(child: CircularProgressIndicator(color: AppColors.secondary)),
                  );
                }
                return _OrderCard(order: items[i]);
              },
            ),
          );
        },
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({required this.order});
  final Order order;

  @override
  Widget build(BuildContext context) {
    final date = DateFormat('d MMM, h:mm a').format(order.placedAt.toLocal());
    return KawCard(
      onTap: () => context.push(
        order.isLive ? Routes.orderTracking(order.id) : Routes.orderDetails(order.id),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(order.orderNumber, style: AppTypography.label),
              OrderStatusBadge(status: order.status),
            ],
          ),
          AppSpacing.gapXs,
          Text(
            '${order.serviceType[0]}${order.serviceType.substring(1).toLowerCase()} · ${order.items.length} item(s) · $date',
            style: AppTypography.caption,
          ),
          AppSpacing.gapMd,
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('₹${order.total.toStringAsFixed(0)} · COD', style: AppTypography.bodyLarge),
              if (order.isLive)
                Row(
                  children: [
                    Text('Track', style: AppTypography.label.copyWith(color: AppColors.secondary)),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.secondary, size: 18),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }
}
