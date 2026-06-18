import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/app_config.dart';
import '../../../core/router/routes.dart';
import '../../auth/application/auth_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(
            tooltip: 'Edit profile',
            onPressed: () => context.push(Routes.editProfile),
            icon: const Icon(Icons.edit_rounded),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          KawCard(
            child: Row(
              children: [
                const CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.secondarySoft,
                  child: Icon(Icons.person_rounded, color: AppColors.secondary, size: 30),
                ),
                AppSpacing.wGapLg,
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.displayName ?? 'Guest', style: AppTypography.titleMedium),
                      if (user?.phone != null) Text(user!.phone, style: AppTypography.bodyMedium),
                    ],
                  ),
                ),
              ],
            ),
          ),
          AppSpacing.gapLg,
          _tile(context, Icons.location_on_outlined, 'My addresses', () => context.push(Routes.addresses)),
          _tile(context, Icons.receipt_long_outlined, 'My orders', () => context.go(Routes.orders)),
          _tile(context, Icons.notifications_none_rounded, 'Notifications', () => context.push(Routes.notifications)),
          _tile(context, Icons.help_outline_rounded, 'Help & support', () => context.push(Routes.support)),
          const Divider(height: AppSpacing.xxl),
          _tile(context, Icons.description_outlined, 'Terms of Service', () => _openUrl(AppConfig.termsUrl)),
          _tile(context, Icons.privacy_tip_outlined, 'Privacy Policy', () => _openUrl(AppConfig.privacyPolicyUrl)),
          _tile(context, Icons.info_outline_rounded, 'About Kaw Kaw', () => _showAbout(context)),
          AppSpacing.gapXl,
          KawButton(
            label: 'Log out',
            variant: KawButtonVariant.outlined,
            icon: Icons.logout_rounded,
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
          AppSpacing.gapLg,
          Center(child: Text('Kaw Kaw v1.0.0', style: AppTypography.caption)),
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

  void _showAbout(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: 'Kaw Kaw',
      applicationVersion: '1.0.0',
      applicationLegalese: '© KawKawTech Pvt Ltd · Bhadrachalam, Telangana',
      children: const [
        Padding(
          padding: EdgeInsets.only(top: AppSpacing.md),
          child: Text('Need it delivered right away — grocery, pharmacy, food and parcels.'),
        ),
      ],
    );
  }
}
