import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Soft, dark-friendly elevation system implemented as box shadows
/// (Material 3 surfaces stay flat; we add subtle depth on cards/sheets).
abstract final class AppElevation {
  static const List<BoxShadow> none = <BoxShadow>[];

  static const List<BoxShadow> low = <BoxShadow>[
    BoxShadow(color: Color(0x33000000), blurRadius: 8, offset: Offset(0, 2)),
  ];

  static const List<BoxShadow> medium = <BoxShadow>[
    BoxShadow(color: Color(0x40000000), blurRadius: 16, offset: Offset(0, 6)),
  ];

  static const List<BoxShadow> high = <BoxShadow>[
    BoxShadow(color: Color(0x4D000000), blurRadius: 28, offset: Offset(0, 12)),
  ];

  /// Amber glow used to emphasise primary CTAs.
  static const List<BoxShadow> accentGlow = <BoxShadow>[
    BoxShadow(color: Color(0x33F59E0B), blurRadius: 20, offset: Offset(0, 8)),
  ];

  static const Color shadowColor = AppColors.background;
}
