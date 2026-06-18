import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'state/skeleton.dart';

/// Network image with a shimmer placeholder and a graceful fallback icon.
/// Dependency-light (no cached_network_image) so the design system stays lean.
class KawNetworkImage extends StatelessWidget {
  const KawNetworkImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.fallbackIcon = Icons.image_outlined,
  });

  final String? url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final IconData fallbackIcon;

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.isEmpty) {
      return _placeholder();
    }
    return Image.network(
      url!,
      width: width,
      height: height,
      fit: fit,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return Skeleton(width: width, height: height ?? 80);
      },
      errorBuilder: (context, error, stack) => _placeholder(),
    );
  }

  Widget _placeholder() {
    return Container(
      width: width,
      height: height,
      color: AppColors.surfaceVariant,
      alignment: Alignment.center,
      child: Icon(fallbackIcon, color: AppColors.textTertiary, size: 28),
    );
  }
}
