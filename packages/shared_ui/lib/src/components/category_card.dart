import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';
import 'network_image.dart';

/// Square category tile (image + label) for grids and rails.
class CategoryCard extends StatelessWidget {
  const CategoryCard({
    super.key,
    required this.name,
    required this.onTap,
    this.imageUrl,
    this.accent = AppColors.secondary,
  });

  final String name;
  final String? imageUrl;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.brLg,
      child: Column(
        children: [
          Container(
            decoration: BoxDecoration(
              color: accent.withValues(alpha: 0.12),
              borderRadius: AppRadius.brLg,
            ),
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: ClipRRect(
              borderRadius: AppRadius.brMd,
              child: AspectRatio(
                aspectRatio: 1,
                child: KawNetworkImage(url: imageUrl, fallbackIcon: Icons.category_rounded),
              ),
            ),
          ),
          AppSpacing.gapSm,
          Text(
            name,
            maxLines: 2,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
            style: AppTypography.caption.copyWith(color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }
}
