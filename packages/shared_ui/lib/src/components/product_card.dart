import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'kaw_badge.dart';
import 'network_image.dart';
import 'price_text.dart';
import 'quantity_selector.dart';

/// Catalogue product tile with image, price and an in-place quantity stepper.
class ProductCard extends StatelessWidget {
  const ProductCard({
    super.key,
    required this.name,
    required this.price,
    required this.onTap,
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
    this.imageUrl,
    this.mrp,
    this.unit,
    this.requiresPrescription = false,
    this.inStock = true,
  });

  final String name;
  final num price;
  final num? mrp;
  final String? imageUrl;
  final String? unit;
  final bool requiresPrescription;
  final bool inStock;
  final int quantity;
  final VoidCallback onTap;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.brLg,
      child: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppRadius.brLg,
        ),
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: AppRadius.brMd,
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: KawNetworkImage(url: imageUrl),
                  ),
                ),
                if (requiresPrescription)
                  const Positioned(
                    top: 6,
                    left: 6,
                    child: KawBadge(label: 'Rx', color: AppColors.pharmacy),
                  ),
                if (!inStock)
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: AppColors.background.withValues(alpha: 0.6),
                        borderRadius: AppRadius.brMd,
                      ),
                      child: const Center(
                        child: KawBadge(label: 'Out of stock', color: AppColors.error),
                      ),
                    ),
                  ),
              ],
            ),
            AppSpacing.gapSm,
            Text(
              name,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.label,
            ),
            if (unit != null) ...[
              const SizedBox(height: 2),
              Text(unit!, style: AppTypography.caption),
            ],
            AppSpacing.gapSm,
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Flexible(child: PriceText(price: price, mrp: mrp)),
                if (inStock)
                  QuantitySelector(
                    quantity: quantity,
                    onIncrement: onIncrement,
                    onDecrement: onDecrement,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
