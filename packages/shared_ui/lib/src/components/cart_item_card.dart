import 'package:flutter/material.dart';
import '../theme/app_radius.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'network_image.dart';
import 'price_text.dart';
import 'quantity_selector.dart';

/// A line item in the cart: thumbnail, name/unit, line price, quantity stepper.
class CartItemCard extends StatelessWidget {
  const CartItemCard({
    super.key,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
    this.imageUrl,
    this.unit,
  });

  final String name;
  final num unitPrice;
  final int quantity;
  final String? unit;
  final String? imageUrl;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: AppRadius.brSm,
            child: KawNetworkImage(url: imageUrl, width: 56, height: 56),
          ),
          AppSpacing.wGapMd,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: AppTypography.label),
                if (unit != null) ...[
                  const SizedBox(height: 2),
                  Text(unit!, style: AppTypography.caption),
                ],
                AppSpacing.gapXs,
                PriceText(price: unitPrice * quantity),
              ],
            ),
          ),
          AppSpacing.wGapMd,
          QuantitySelector(
            quantity: quantity,
            onIncrement: onIncrement,
            onDecrement: onDecrement,
          ),
        ],
      ),
    );
  }
}
