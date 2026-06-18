import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../rider/application/rider_providers.dart';
import '../../rider/data/rider_profile.dart';

class EarningsScreen extends ConsumerWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(earningsSummaryProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Earnings')),
      body: summary.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(earningsSummaryProvider)),
        data: (s) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(earningsSummaryProvider),
          child: ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              _Hero(period: s.today, rating: s.rating),
              AppSpacing.gapLg,
              Row(
                children: [
                  Expanded(child: _PeriodCard(label: 'This week', period: s.week)),
                  AppSpacing.wGapMd,
                  Expanded(child: _PeriodCard(label: 'This month', period: s.month)),
                ],
              ),
              AppSpacing.gapLg,
              _PeriodCard(label: 'Lifetime', period: s.lifetime, accent: AppColors.success),
            ],
          ),
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.period, required this.rating});
  final EarningsPeriod period;
  final double rating;

  @override
  Widget build(BuildContext context) {
    return KawCard(
      color: AppColors.secondary.withValues(alpha: 0.12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Today's earnings", style: AppTypography.label),
          AppSpacing.gapSm,
          Text('₹${period.earnings.toStringAsFixed(0)}', style: AppTypography.displayLarge),
          AppSpacing.gapXs,
          Row(
            children: [
              Text('${period.deliveries} deliveries', style: AppTypography.bodyMedium),
              const Spacer(),
              const Icon(Icons.star_rounded, color: AppColors.secondary, size: 18),
              AppSpacing.wGapXs,
              Text(rating.toStringAsFixed(1), style: AppTypography.label),
            ],
          ),
        ],
      ),
    );
  }
}

class _PeriodCard extends StatelessWidget {
  const _PeriodCard({required this.label, required this.period, this.accent});
  final String label;
  final EarningsPeriod period;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    return KawCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: AppTypography.caption),
          AppSpacing.gapXs,
          Text('₹${period.earnings.toStringAsFixed(0)}',
              style: AppTypography.titleLarge.copyWith(color: accent)),
          Text('${period.deliveries} deliveries', style: AppTypography.caption),
        ],
      ),
    );
  }
}
