import 'package:dio/dio.dart';
import 'package:latlong2/latlong.dart';

import '../config/app_config.dart';
import 'geo_models.dart';

/// Driving routes & ETA via the OSRM HTTP API.
class OsrmService {
  OsrmService([Dio? dio])
      : _dio = dio ?? Dio(BaseOptions(baseUrl: AppConfig.osrmUrl, connectTimeout: const Duration(seconds: 12)));

  final Dio _dio;

  Future<RouteResult?> route({required LatLng from, required LatLng to}) async {
    final coords =
        '${from.longitude},${from.latitude};${to.longitude},${to.latitude}';
    final res = await _dio.get<dynamic>(
      '/route/v1/driving/$coords',
      queryParameters: {'overview': 'full', 'geometries': 'geojson'},
    );
    final data = res.data as Map<String, dynamic>;
    final routes = data['routes'] as List?;
    if (routes == null || routes.isEmpty) return null;

    final route = routes.first as Map<String, dynamic>;
    final distanceM = (route['distance'] as num).toDouble();
    final durationS = (route['duration'] as num).toDouble();
    final geometry = route['geometry'] as Map<String, dynamic>;
    final coordsList = (geometry['coordinates'] as List).cast<List<dynamic>>();

    return RouteResult(
      distanceKm: distanceM / 1000,
      durationMinutes: (durationS / 60).ceil(),
      points: coordsList
          .map((c) => LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble()))
          .toList(),
    );
  }
}
