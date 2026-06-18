import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../cart/application/cart_controller.dart';
import '../application/catalog_providers.dart';
import '../data/product.dart';

class ProductDetailsScreen extends ConsumerWidget {
  const ProductDetailsScreen({super.key, required this.productId});

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final product = ref.watch(productDetailsProvider(productId));
    return Scaffold(
      appBar: AppBar(),
      body: product.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(productDetailsProvider(productId))),
        data: (p) => _Details(product: p),
      ),
    );
  }
}

class _Details extends ConsumerWidget {
  const _Details({required this.product});
  final Product product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final quantity = ref.watch(cartControllerProvider.select((c) => c.quantityOf(product.id)));
    final images = product.images.isNotEmpty
        ? product.images
        : (product.imageUrl != null ? [product.imageUrl!] : <String>[]);

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
            children: [
              AspectRatio(
                aspectRatio: 1,
                child: images.isEmpty
                    ? const KawNetworkImage(url: null)
                    : PageView(
                        children: [for (final url in images) KawNetworkImage(url: url)],
                      ),
              ),
              Padding(
                padding: AppSpacing.page,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppSpacing.gapLg,
                    if (product.requiresPrescription) ...[
                      const KawBadge(label: 'Prescription required', color: AppColors.pharmacy, icon: Icons.medical_information_rounded),
                      AppSpacing.gapSm,
                    ],
                    Text(product.name, style: AppTypography.headlineLarge),
                    if (product.unit != null) ...[
                      AppSpacing.gapXs,
                      Text(product.unit!, style: AppTypography.bodyMedium),
                    ],
                    AppSpacing.gapMd,
                    PriceText(price: product.price, mrp: product.mrp, style: AppTypography.titleLarge),
                    if (!product.inStock) ...[
                      AppSpacing.gapMd,
                      const KawBadge(label: 'Out of stock', color: AppColors.error),
                    ],
                    if (product.description != null && product.description!.isNotEmpty) ...[
                      AppSpacing.gapXl,
                      Text('Description', style: AppTypography.titleMedium),
                      AppSpacing.gapSm,
                      Text(product.description!, style: AppTypography.bodyLarge),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        _BuyBar(product: product, quantity: quantity),
      ],
    );
  }
}

class _BuyBar extends ConsumerWidget {
  const _BuyBar({required this.product, required this.quantity});
  final Product product;
  final int quantity;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          boxShadow: AppElevation.medium,
        ),
        child: Row(
          children: [
            Expanded(child: PriceText(price: product.price, mrp: product.mrp, style: AppTypography.titleLarge)),
            if (!product.inStock)
              const Expanded(child: Center(child: KawBadge(label: 'Out of stock', color: AppColors.error)))
            else if (quantity == 0)
              Expanded(
                child: KawButton(
                  label: 'Add to cart',
                  icon: Icons.add_shopping_cart_rounded,
                  onPressed: () => _add(context, ref),
                ),
              )
            else
              QuantitySelector(
                quantity: quantity,
                onIncrement: () => _add(context, ref),
                onDecrement: () => ref.read(cartControllerProvider.notifier).decrementById(product.id),
              ),
          ],
        ),
      ),
    );
  }

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
            'Your cart has ${conflict.currentService.toLowerCase()} items. Replace it with a '
            '${conflict.newService.toLowerCase()} cart?',
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
}
