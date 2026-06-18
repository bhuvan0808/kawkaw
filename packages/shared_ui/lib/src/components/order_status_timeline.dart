import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

/// Order lifecycle, mirroring the backend `OrderStatus` enum.
enum KawOrderStatus { pending, assigned, accepted, pickedUp, outForDelivery, delivered, cancelled }

extension KawOrderStatusX on KawOrderStatus {
  String get label => switch (this) {
        KawOrderStatus.pending => 'Order placed',
        KawOrderStatus.assigned => 'Rider assigned',
        KawOrderStatus.accepted => 'Accepted',
        KawOrderStatus.pickedUp => 'Picked up',
        KawOrderStatus.outForDelivery => 'Out for delivery',
        KawOrderStatus.delivered => 'Delivered',
        KawOrderStatus.cancelled => 'Cancelled',
      };

  IconData get icon => switch (this) {
        KawOrderStatus.pending => Icons.receipt_long_rounded,
        KawOrderStatus.assigned => Icons.person_pin_circle_rounded,
        KawOrderStatus.accepted => Icons.check_circle_rounded,
        KawOrderStatus.pickedUp => Icons.shopping_bag_rounded,
        KawOrderStatus.outForDelivery => Icons.delivery_dining_rounded,
        KawOrderStatus.delivered => Icons.home_rounded,
        KawOrderStatus.cancelled => Icons.cancel_rounded,
      };

  /// Parses the backend's SCREAMING_SNAKE_CASE value.
  static KawOrderStatus fromApi(String value) => switch (value.toUpperCase()) {
        'PENDING' => KawOrderStatus.pending,
        'ASSIGNED' => KawOrderStatus.assigned,
        'ACCEPTED' => KawOrderStatus.accepted,
        'PICKED_UP' => KawOrderStatus.pickedUp,
        'OUT_FOR_DELIVERY' => KawOrderStatus.outForDelivery,
        'DELIVERED' => KawOrderStatus.delivered,
        'CANCELLED' => KawOrderStatus.cancelled,
        _ => KawOrderStatus.pending,
      };
}

/// Vertical stepper showing progress through the delivery lifecycle.
class OrderStatusTimeline extends StatelessWidget {
  const OrderStatusTimeline({super.key, required this.current, this.timestamps = const {}});

  final KawOrderStatus current;

  /// Optional human-readable time per status (e.g. "4:21 PM").
  final Map<KawOrderStatus, String> timestamps;

  static const List<KawOrderStatus> _flow = [
    KawOrderStatus.pending,
    KawOrderStatus.assigned,
    KawOrderStatus.accepted,
    KawOrderStatus.pickedUp,
    KawOrderStatus.outForDelivery,
    KawOrderStatus.delivered,
  ];

  @override
  Widget build(BuildContext context) {
    if (current == KawOrderStatus.cancelled) {
      return Row(
        children: [
          const Icon(Icons.cancel_rounded, color: AppColors.error),
          AppSpacing.wGapMd,
          Text('Order cancelled', style: AppTypography.titleMedium.copyWith(color: AppColors.error)),
        ],
      );
    }

    final currentIndex = _flow.indexOf(current);
    return Column(
      children: List.generate(_flow.length, (i) {
        final step = _flow[i];
        final isDone = i < currentIndex;
        final isActive = i == currentIndex;
        final isLast = i == _flow.length - 1;
        final color = (isDone || isActive) ? AppColors.success : AppColors.outline;

        return IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isActive ? AppColors.success : Colors.transparent,
                      border: Border.all(color: color, width: 2),
                    ),
                    child: Icon(
                      step.icon,
                      size: 16,
                      color: isActive ? AppColors.onSecondary : color,
                    ),
                  ),
                  if (!isLast)
                    Expanded(child: Container(width: 2, color: isDone ? AppColors.success : AppColors.outline)),
                ],
              ),
              AppSpacing.wGapMd,
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.lg, top: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      step.label,
                      style: AppTypography.label.copyWith(
                        color: (isDone || isActive) ? AppColors.textPrimary : AppColors.textTertiary,
                      ),
                    ),
                    if (timestamps[step] != null)
                      Text(timestamps[step]!, style: AppTypography.caption),
                  ],
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
