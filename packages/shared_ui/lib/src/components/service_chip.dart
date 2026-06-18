import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// The four Kaw Kaw services, with brand colour + icon.
enum KawService { grocery, pharmacy, food, parcel }

extension KawServiceX on KawService {
  String get label => switch (this) {
        KawService.grocery => 'Grocery',
        KawService.pharmacy => 'Pharmacy',
        KawService.food => 'Food',
        KawService.parcel => 'Parcel',
      };

  IconData get icon => switch (this) {
        KawService.grocery => Icons.local_grocery_store_rounded,
        KawService.pharmacy => Icons.medical_services_rounded,
        KawService.food => Icons.restaurant_rounded,
        KawService.parcel => Icons.local_shipping_rounded,
      };

  Color get color => switch (this) {
        KawService.grocery => AppColors.grocery,
        KawService.pharmacy => AppColors.pharmacy,
        KawService.food => AppColors.food,
        KawService.parcel => AppColors.parcel,
      };

  /// Maps to the backend `ServiceType` enum value.
  String get apiValue => name.toUpperCase();
}

/// Compact pill showing a service with its accent colour.
class ServiceChip extends StatelessWidget {
  const ServiceChip({super.key, required this.service, this.selected = false, this.onTap});

  final KawService service;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? service.color.withValues(alpha: 0.18) : AppColors.surfaceVariant,
      borderRadius: AppRadius.brPill,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.brPill,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.sm,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(service.icon, size: 18, color: service.color),
              AppSpacing.wGapSm,
              Text(
                service.label,
                style: AppTypography.label.copyWith(
                  color: selected ? service.color : AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
