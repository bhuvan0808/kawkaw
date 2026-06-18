import 'package:flutter/material.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/app_config.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  Future<void> _launch(Uri uri) async {
    if (await canLaunchUrl(uri)) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & support')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Text('Rider support', style: AppTypography.titleLarge),
          AppSpacing.gapXs,
          Text('Reach the Kaw Kaw rider desk for any delivery or account issue.', style: AppTypography.bodyMedium),
          AppSpacing.gapXl,
          _Tile(
            icon: Icons.call_rounded,
            title: 'Call rider support',
            subtitle: AppConfig.supportPhone,
            onTap: () => _launch(Uri(scheme: 'tel', path: AppConfig.supportPhone)),
          ),
          _Tile(
            icon: Icons.email_rounded,
            title: 'Email us',
            subtitle: AppConfig.supportEmail,
            onTap: () => _launch(Uri(scheme: 'mailto', path: AppConfig.supportEmail)),
          ),
          const Divider(height: AppSpacing.xxl),
          Text('Common questions', style: AppTypography.titleMedium),
          AppSpacing.gapMd,
          const _Faq(q: 'Location stops when my screen is off', a: 'Keep the foreground notification active and allow "unrestricted" battery usage for Kaw Kaw Rider. The Dashboard shows a Fix button if battery optimization is restricting updates.'),
          const _Faq(q: 'I missed a new order', a: 'Stay online with notifications and sound enabled. New jobs ring + vibrate and show a full-screen Accept/Reject card.'),
          const _Faq(q: 'How is COD handled?', a: 'Collect the cash amount shown on the delivery screen when you hand over the order, then tap "Mark delivered".'),
        ],
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.icon, required this.title, required this.subtitle, required this.onTap});
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: KawCard(
        onTap: onTap,
        child: Row(
          children: [
            CircleAvatar(backgroundColor: AppColors.secondarySoft, child: Icon(icon, color: AppColors.secondary)),
            AppSpacing.wGapLg,
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppTypography.label),
                  Text(subtitle, style: AppTypography.bodyMedium),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppColors.textTertiary),
          ],
        ),
      ),
    );
  }
}

class _Faq extends StatelessWidget {
  const _Faq({required this.q, required this.a});
  final String q;
  final String a;

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: EdgeInsets.zero,
        iconColor: AppColors.secondary,
        title: Text(q, style: AppTypography.bodyLarge),
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: Text(a, style: AppTypography.bodyMedium),
            ),
          ),
        ],
      ),
    );
  }
}
