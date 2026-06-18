import 'package:flutter/material.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';
import 'package:url_launcher/url_launcher.dart';

/// Hands off turn-by-turn navigation to an external app (Google Maps / Waze),
/// with an OSM-based in-app preview already shown on the delivery screen.
abstract final class ExternalNavigation {
  static Future<void> openChooser(BuildContext context, double lat, double lng) async {
    final wazeApp = Uri.parse('waze://?ll=$lat,$lng&navigate=yes');
    final wazeInstalled = await canLaunchUrl(wazeApp);

    if (!context.mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AppSpacing.gapMd,
            Text('Navigate with', style: AppTypography.titleMedium),
            AppSpacing.gapSm,
            ListTile(
              leading: const Icon(Icons.map_rounded, color: AppColors.grocery),
              title: const Text('Google Maps'),
              onTap: () {
                Navigator.pop(context);
                _launchGoogleMaps(lat, lng);
              },
            ),
            if (wazeInstalled)
              ListTile(
                leading: const Icon(Icons.navigation_rounded, color: AppColors.info),
                title: const Text('Waze'),
                onTap: () {
                  Navigator.pop(context);
                  launchUrl(wazeApp, mode: LaunchMode.externalApplication);
                },
              ),
            AppSpacing.gapMd,
          ],
        ),
      ),
    );
  }

  static Future<void> _launchGoogleMaps(double lat, double lng) async {
    // Prefer the turn-by-turn navigation intent; fall back to the universal URL.
    final nav = Uri.parse('google.navigation:q=$lat,$lng&mode=d');
    final universal =
        Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving');
    if (await canLaunchUrl(nav)) {
      await launchUrl(nav, mode: LaunchMode.externalApplication);
    } else {
      await launchUrl(universal, mode: LaunchMode.externalApplication);
    }
  }
}
