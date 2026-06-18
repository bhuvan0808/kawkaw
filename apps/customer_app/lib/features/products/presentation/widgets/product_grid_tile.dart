import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../../core/router/routes.dart';
import '../../../cart/application/cart_controller.dart';
import '../../data/product.dart';

/// A [ProductCard] wired to the cart, including service-switch confirmation.
class ProductGridTile extends ConsumerWidget {
  const ProductGridTile({super.key, required this.product});

  final Product product;

  Future<void> _add(BuildContext context, WidgetRef ref) async {
    final cart = ref.read(cartControllerProvider.notifier);
    try {
      cart.addProduct(product);
    } on CartServiceConflict catch (conflict) {
      if (!context.mounted) return;
      final replace = await showDialog<bool>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Start a new cart?'),
          content: Text(
            'Your cart has ${conflict.currentService.toLowerCase()} items. '
            'Adding this will clear it and start a ${conflict.newService.toLowerCase()} cart.',
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep')),
            TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Replace')),
          ],
        ),
      );
      if (replace == true) cart.addProduct(product, replaceService: true);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quantity = ref.watch(
      cartControllerProvider.select((c) => c.quantityOf(product.id)),
    );
    return ProductCard(
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      imageUrl: product.imageUrl,
      unit: product.unit,
      requiresPrescription: product.requiresPrescription,
      inStock: product.inStock,
      quantity: quantity,
      onTap: () => context.push(Routes.productDetails(product.id)),
      onIncrement: () => _add(context, ref),
      onDecrement: () => ref.read(cartControllerProvider.notifier).decrementById(product.id),
    );
  }
}
