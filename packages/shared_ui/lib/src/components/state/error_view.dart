import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';
import '../buttons/kaw_button.dart';

/// Standard error state with an optional retry action.
class ErrorView extends StatelessWidget {
  const ErrorView({
    super.key,
    this.title = 'Something went wrong',
    this.message,
    this.onRetry,
  });

  final String title;
  final String? message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline_rounded, size: 64, color: AppColors.error),
            AppSpacing.gapLg,
            Text(title, style: AppTypography.titleMedium, textAlign: TextAlign.center),
            if (message != null) ...[
              AppSpacing.gapSm,
              Text(message!, style: AppTypography.bodyMedium, textAlign: TextAlign.center),
            ],
            if (onRetry != null) ...[
              AppSpacing.gapXl,
              KawButton(
                label: 'Try again',
                onPressed: onRetry,
                variant: KawButtonVariant.outlined,
                expand: false,
                icon: Icons.refresh_rounded,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
