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
          Text('We are here to help', style: AppTypography.titleLarge),
          AppSpacing.gapXs,
          Text(
            'Reach our Bhadrachalam support team for any issue with your orders.',
            style: AppTypography.bodyMedium,
          ),
          AppSpacing.gapXl,
          _ContactTile(
            icon: Icons.call_rounded,
            title: 'Call support',
            subtitle: AppConfig.supportPhone,
            onTap: () => _launch(Uri(scheme: 'tel', path: AppConfig.supportPhone)),
          ),
          _ContactTile(
            icon: Icons.email_rounded,
            title: 'Email us',
            subtitle: AppConfig.supportEmail,
            onTap: () => _launch(Uri(scheme: 'mailto', path: AppConfig.supportEmail)),
          ),
          const Divider(height: AppSpacing.xxl),
          Text('Common questions', style: AppTypography.titleMedium),
          AppSpacing.gapMd,
          const _Faq(
            q: 'How do I pay?',
            a: 'Version 1 supports Cash on Delivery only. Pay the rider when your order arrives.',
          ),
          const _Faq(
            q: 'Can I cancel an order?',
            a: 'Yes, before the rider picks it up. Open the order and tap Cancel.',
          ),
          const _Faq(
            q: 'Do I need a prescription for medicines?',
            a: 'For prescription medicines, attach a photo of your prescription at checkout.',
          ),
        ],
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  const _ContactTile({required this.icon, required this.title, required this.subtitle, required this.onTap});
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
            CircleAvatar(
              backgroundColor: AppColors.secondarySoft,
              child: Icon(icon, color: AppColors.secondary),
            ),
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
        title: Text(q, style: AppTypography.bodyLarge),
        iconColor: AppColors.secondary,
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
