import 'package:flutter/material.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

/// Branded splash shown while the session is being restored.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: AppColors.secondary,
                borderRadius: AppRadius.brXl,
                boxShadow: AppElevation.accentGlow,
              ),
              child: const Icon(Icons.bolt_rounded, size: 56, color: AppColors.onSecondary),
            ),
            AppSpacing.gapXl,
            Text('Kaw Kaw', style: AppTypography.displayLarge),
            AppSpacing.gapXs,
            Text('Need it delivered right away.', style: AppTypography.bodyMedium),
            AppSpacing.gapXxl,
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.secondary),
            ),
          ],
        ),
      ),
    );
  }
}
