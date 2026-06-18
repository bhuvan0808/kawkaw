import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// Bottom card shown over the live-tracking map: rider identity, ETA, call CTA.
class RiderTrackingCard extends StatelessWidget {
  const RiderTrackingCard({
    super.key,
    required this.riderName,
    required this.statusLabel,
    this.vehicle,
    this.etaMinutes,
    this.distanceKm,
    this.onCall,
  });

  final String riderName;
  final String statusLabel;
  final String? vehicle;
  final int? etaMinutes;
  final double? distanceKm;
  final VoidCallback? onCall;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xxl)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const CircleAvatar(
                radius: 26,
                backgroundColor: AppColors.secondarySoft,
                child: Icon(Icons.delivery_dining_rounded, color: AppColors.secondary),
              ),
              AppSpacing.wGapMd,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(riderName, style: AppTypography.titleMedium),
                    Text(
                      vehicle == null ? statusLabel : '$vehicle · $statusLabel',
                      style: AppTypography.caption,
                    ),
                  ],
                ),
              ),
              if (onCall != null)
                IconButton.filled(
                  onPressed: onCall,
                  icon: const Icon(Icons.call_rounded),
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: AppColors.onSecondary,
                  ),
                ),
            ],
          ),
          if (etaMinutes != null || distanceKm != null) ...[
            AppSpacing.gapLg,
            const Divider(),
            AppSpacing.gapMd,
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                if (etaMinutes != null)
                  _Metric(icon: Icons.schedule_rounded, label: 'ETA', value: '$etaMinutes min'),
                if (distanceKm != null)
                  _Metric(
                    icon: Icons.straighten_rounded,
                    label: 'Distance',
                    value: '${distanceKm!.toStringAsFixed(1)} km',
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppColors.secondary, size: 20),
        const SizedBox(height: 4),
        Text(value, style: AppTypography.label),
        Text(label, style: AppTypography.caption),
      ],
    );
  }
}
