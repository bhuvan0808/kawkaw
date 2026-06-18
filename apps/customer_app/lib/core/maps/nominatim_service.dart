import 'package:dio/dio.dart';
import 'package:latlong2/latlong.dart';

import '../config/app_config.dart';
import 'geo_models.dart';

/// Forward & reverse geocoding via OpenStreetMap Nominatim.
/// A descriptive User-Agent is required by the Nominatim usage policy.
class NominatimService {
  NominatimService([Dio? dio])
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: AppConfig.nominatimUrl,
                headers: {'User-Agent': AppConfig.osmUserAgent},
                connectTimeout: const Duration(seconds: 12),
              ),
            );

  final Dio _dio;

  Future<List<GeoPlace>> search(String query) async {
    if (query.trim().length < 3) return [];
    final res = await _dio.get<dynamic>(
      '/search',
      queryParameters: {
        'q': query,
        'format': 'jsonv2',
        'addressdetails': 1,
        'limit': 8,
        'countrycodes': 'in',
      },
    );
    final list = (res.data as List).cast<Map<String, dynamic>>();
    return list.map(_fromJson).toList();
  }

  Future<GeoPlace?> reverse(LatLng point) async {
    final res = await _dio.get<dynamic>(
      '/reverse',
      queryParameters: {
        'lat': point.latitude,
        'lon': point.longitude,
        'format': 'jsonv2',
        'addressdetails': 1,
      },
    );
    final data = res.data;
    if (data is Map<String, dynamic> && data['lat'] != null) {
      return _fromJson(data);
    }
    return null;
  }

  GeoPlace _fromJson(Map<String, dynamic> json) {
    return GeoPlace(
      displayName: json['display_name'] as String? ?? 'Selected location',
      location: LatLng(
        double.parse(json['lat'].toString()),
        double.parse(json['lon'].toString()),
      ),
      address: (json['address'] as Map?)?.cast<String, dynamic>() ?? const {},
    );
  }
}
