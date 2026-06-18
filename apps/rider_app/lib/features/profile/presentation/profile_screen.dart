import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/app_config.dart';
import '../../../core/router/routes.dart';
import '../../auth/application/auth_controller.dart';
import '../../rider/application/rider_providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final profile = ref.watch(riderProfileProvider).valueOrNull;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          KawCard(
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.secondarySoft,
                  child: Icon(Icons.delivery_dining_rounded, color: AppColors.secondary, size: 28),
                ),
                AppSpacing.wGapLg,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.displayName ?? 'Rider', style: AppTypography.titleMedium),
                      if (user?.phone != null) Text(user!.phone, style: AppTypography.bodyMedium),
                    ],
                  ),
                ),
                if (profile != null && profile.isVerified)
                  const KawBadge(label: 'Verified', color: AppColors.success, icon: Icons.verified_rounded),
              ],
            ),
          ),
          if (profile != null) ...[
            AppSpacing.gapLg,
            Row(
              children: [
                Expanded(child: _Stat(label: 'Rating', value: profile.rating.toStringAsFixed(1), icon: Icons.star_rounded)),
                AppSpacing.wGapMd,
                Expanded(child: _Stat(label: 'Deliveries', value: '${profile.totalDeliveries}', icon: Icons.check_circle_rounded)),
                AppSpacing.wGapMd,
                Expanded(child: _Stat(label: 'Earned', value: '₹${profile.totalEarnings.toStringAsFixed(0)}', icon: Icons.payments_rounded)),
              ],
            ),
            AppSpacing.gapMd,
            KawCard(
              child: Row(
                children: [
                  const Icon(Icons.two_wheeler_rounded, color: AppColors.secondary),
                  AppSpacing.wGapMd,
                  Text(
                    '${profile.vehicleType ?? 'Vehicle'} · ${profile.vehicleNumber ?? '—'}',
                    style: AppTypography.bodyLarge,
                  ),
                ],
              ),
            ),
          ],
          const Divider(height: AppSpacing.xxl),
          _tile(context, Icons.help_outline_rounded, 'Help & support', () => context.push(Routes.support)),
          _tile(context, Icons.description_outlined, 'Terms of Service', () => _openUrl(AppConfig.termsUrl)),
          _tile(context, Icons.privacy_tip_outlined, 'Privacy Policy', () => _openUrl(AppConfig.privacyPolicyUrl)),
          AppSpacing.gapXl,
          KawButton(
            label: 'Log out',
            variant: KawButtonVariant.outlined,
            icon: Icons.logout_rounded,
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
          AppSpacing.gapLg,
          Center(child: Text('Kaw Kaw Rider v1.0.0', style: AppTypography.caption)),
        ],
      ),
    );
  }

  Widget _tile(BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: AppColors.textSecondary),
      title: Text(label, style: AppTypography.bodyLarge),
      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textTertiary),
      onTap: onTap,
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, required this.icon});
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return KawCard(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md, horizontal: AppSpacing.sm),
      child: Column(
        children: [
          Icon(icon, color: AppColors.secondary, size: 20),
          AppSpacing.gapXs,
          Text(value, style: AppTypography.label),
          Text(label, style: AppTypography.caption),
        ],
      ),
    );
  }
}
