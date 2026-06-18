import 'package:flutter/material.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

/// Maps a backend order status to a coloured badge.
class OrderStatusBadge extends StatelessWidget {
  const OrderStatusBadge({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final s = KawOrderStatusX.fromApi(status);
    final color = switch (s) {
      KawOrderStatus.delivered => AppColors.success,
      KawOrderStatus.cancelled => AppColors.error,
      KawOrderStatus.outForDelivery => AppColors.info,
      _ => AppColors.secondary,
    };
    return KawBadge(label: s.label, color: color, icon: s.icon);
  }
}
