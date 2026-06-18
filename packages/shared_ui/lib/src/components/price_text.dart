import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// Renders a price in ₹ with an optional struck-through MRP.
class PriceText extends StatelessWidget {
  const PriceText({
    super.key,
    required this.price,
    this.mrp,
    this.style,
  });

  final num price;
  final num? mrp;
  final TextStyle? style;

  String _fmt(num v) => '₹${v.toStringAsFixed(v % 1 == 0 ? 0 : 2)}';

  @override
  Widget build(BuildContext context) {
    final showMrp = mrp != null && mrp! > price;
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(_fmt(price), style: style ?? AppTypography.price),
        if (showMrp) ...[
          AppSpacing.wGapSm,
          Text(
            _fmt(mrp!),
            style: AppTypography.caption.copyWith(
              decoration: TextDecoration.lineThrough,
              color: AppColors.textTertiary,
            ),
          ),
        ],
      ],
    );
  }
}
