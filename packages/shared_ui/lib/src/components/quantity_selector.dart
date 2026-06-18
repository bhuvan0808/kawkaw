import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_typography.dart';

/// Compact −/qty/+ stepper. When [quantity] is 0 it shows an "ADD" button.
class QuantitySelector extends StatelessWidget {
  const QuantitySelector({
    super.key,
    required this.quantity,
    required this.onIncrement,
    required this.onDecrement,
    this.max = 100,
    this.addLabel = 'ADD',
  });

  final int quantity;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final int max;
  final String addLabel;

  @override
  Widget build(BuildContext context) {
    if (quantity <= 0) {
      return Material(
        color: AppColors.secondarySoft,
        borderRadius: AppRadius.brSm,
        child: InkWell(
          onTap: onIncrement,
          borderRadius: AppRadius.brSm,
          child: Container(
            constraints: const BoxConstraints(minWidth: 72, minHeight: 36),
            alignment: Alignment.center,
            child: Text(
              addLabel,
              style: AppTypography.label.copyWith(color: AppColors.secondary),
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: const BoxDecoration(color: AppColors.secondary, borderRadius: AppRadius.brSm),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _IconBtn(icon: Icons.remove_rounded, onTap: onDecrement),
          Container(
            constraints: const BoxConstraints(minWidth: 28),
            alignment: Alignment.center,
            child: Text(
              '$quantity',
              style: AppTypography.label.copyWith(color: AppColors.onSecondary),
            ),
          ),
          _IconBtn(
            icon: Icons.add_rounded,
            onTap: quantity >= max ? null : onIncrement,
          ),
        ],
      ),
    );
  }
}

class _IconBtn extends StatelessWidget {
  const _IconBtn({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, size: 18, color: AppColors.onSecondary),
      ),
    );
  }
}
