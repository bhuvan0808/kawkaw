import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../core/router/routes.dart';
import '../application/cart_controller.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartControllerProvider);
    final controller = ref.read(cartControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your cart'),
        actions: [
          if (!cart.isEmpty)
            TextButton(
              onPressed: controller.clear,
              child: const Text('Clear'),
            ),
        ],
      ),
      body: cart.isEmpty
          ? EmptyView(
              title: 'Your cart is empty',
              message: 'Add items to get started.',
              icon: Icons.shopping_cart_outlined,
              actionLabel: 'Browse products',
              onAction: () => context.go(Routes.home),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const Divider(),
                    itemBuilder: (_, i) {
                      final item = cart.items[i];
                      return CartItemCard(
                        name: item.name,
                        unitPrice: item.price,
                        quantity: item.quantity,
                        unit: item.unit,
                        imageUrl: item.imageUrl,
                        onIncrement: () => controller.incrementById(item.productId),
                        onDecrement: () => controller.decrementById(item.productId),
                      );
                    },
                  ),
                ),
                _CheckoutBar(subtotal: cart.subtotal, items: cart.totalItems),
              ],
            ),
    );
  }
}

class _CheckoutBar extends StatelessWidget {
  const _CheckoutBar({required this.subtotal, required this.items});
  final double subtotal;
  final int items;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: const BoxDecoration(color: AppColors.surface, boxShadow: AppElevation.medium),
        child: Row(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$items item${items == 1 ? '' : 's'}', style: AppTypography.caption),
                Text('₹${subtotal.toStringAsFixed(0)}', style: AppTypography.titleLarge),
              ],
            ),
            AppSpacing.wGapLg,
            Expanded(
              child: KawButton(
                label: 'Proceed to checkout',
                icon: Icons.arrow_forward_rounded,
                onPressed: () => context.push(Routes.checkout),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
