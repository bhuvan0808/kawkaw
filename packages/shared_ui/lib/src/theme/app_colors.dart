import 'package:flutter/material.dart';

/// Kaw Kaw brand colour tokens.
///
/// Primary `#111827`, Secondary `#F59E0B`, Accent `#FFFFFF`, Success `#10B981`.
/// The product is a dark-theme-first quick-commerce app.
abstract final class AppColors {
  // Brand
  static const Color primary = Color(0xFF111827);
  static const Color secondary = Color(0xFFF59E0B);
  static const Color accent = Color(0xFFFFFFFF);
  static const Color success = Color(0xFF10B981);

  // Dark surfaces (derived from the primary tone)
  static const Color background = Color(0xFF0B0F19);
  static const Color surface = Color(0xFF111827);
  static const Color surfaceVariant = Color(0xFF1F2937);
  static const Color surfaceBright = Color(0xFF273244);
  static const Color outline = Color(0xFF374151);
  static const Color outlineVariant = Color(0xFF2A3340);

  // Text
  static const Color textPrimary = Color(0xFFF9FAFB);
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textTertiary = Color(0xFF6B7280);
  static const Color onSecondary = Color(0xFF111827);

  // Status
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Secondary tint for chips / highlights
  static const Color secondarySoft = Color(0x1AF59E0B); // 10% amber

  /// Per-service accent colours (Grocery / Pharmacy / Food / Parcel).
  static const Color grocery = Color(0xFF22C55E);
  static const Color pharmacy = Color(0xFF38BDF8);
  static const Color food = Color(0xFFFB923C);
  static const Color parcel = Color(0xFFA78BFA);
}
