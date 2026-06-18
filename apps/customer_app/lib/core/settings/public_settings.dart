import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_endpoints.dart';
import '../providers/providers.dart';

/// Public platform settings (delivery fee, tax, store hours) keyed by name.
class PublicSettings {
  const PublicSettings(this._map);
  final Map<String, dynamic> _map;

  num number(String key, num fallback) {
    final v = _map[key];
    if (v is num) return v;
    return num.tryParse('$v') ?? fallback;
  }

  bool flag(String key, bool fallback) => _map[key] is bool ? _map[key] as bool : fallback;

  double get deliveryFee => number('delivery_fee', 20).toDouble();
  double get freeDeliveryAbove => number('free_delivery_above', 499).toDouble();
  double get taxPercent => number('tax_percent', 0).toDouble();
  bool get storeOpen => flag('store_open', true);
}

final publicSettingsProvider = FutureProvider<PublicSettings>((ref) async {
  final dio = ref.watch(dioProvider);
  try {
    final res = await dio.get<dynamic>(ApiEndpoints.publicSettings);
    final list = unwrap<List<dynamic>>(res).cast<Map<String, dynamic>>();
    final map = {for (final s in list) s['key'] as String: s['value']};
    return PublicSettings(map);
  } on DioException {
    return const PublicSettings({});
  }
});
