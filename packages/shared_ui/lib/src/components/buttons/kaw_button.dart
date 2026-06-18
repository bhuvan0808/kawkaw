import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';

enum KawButtonVariant { filled, outlined, text }

/// Primary action button with large touch target, loading & icon support.
class KawButton extends StatelessWidget {
  const KawButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = KawButtonVariant.filled,
    this.icon,
    this.isLoading = false,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final KawButtonVariant variant;
  final IconData? icon;
  final bool isLoading;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? const SizedBox(
            height: 22,
            width: 22,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.onSecondary),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[Icon(icon, size: 20), AppSpacing.wGapSm],
              Flexible(child: Text(label, overflow: TextOverflow.ellipsis)),
            ],
          );

    final effectiveOnPressed = isLoading ? null : onPressed;
    final Widget button = switch (variant) {
      KawButtonVariant.filled =>
        ElevatedButton(onPressed: effectiveOnPressed, child: child),
      KawButtonVariant.outlined =>
        OutlinedButton(onPressed: effectiveOnPressed, child: child),
      KawButtonVariant.text => TextButton(onPressed: effectiveOnPressed, child: child),
    };

    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}
