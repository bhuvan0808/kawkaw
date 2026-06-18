import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../config/app_config.dart';

/// An OSRM route between two points.
class RouteResult {
  const RouteResult({required this.distanceKm, required this.durationMinutes, required this.points});
  final double distanceKm;
  final int durationMinutes;
  final List<LatLng> points;
}

class LocationDeniedException implements Exception {
  LocationDeniedException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Driving routes & ETA via OSRM (for route preview on the delivery screen).
class OsrmService {
  OsrmService([Dio? dio])
      : _dio = dio ?? Dio(BaseOptions(baseUrl: AppConfig.osrmUrl, connectTimeout: const Duration(seconds: 12)));
  final Dio _dio;

  Future<RouteResult?> route({required LatLng from, required LatLng to}) async {
    final coords = '${from.longitude},${from.latitude};${to.longitude},${to.latitude}';
    final res = await _dio.get<dynamic>(
      '/route/v1/driving/$coords',
      queryParameters: {'overview': 'full', 'geometries': 'geojson'},
    );
    final routes = (res.data as Map<String, dynamic>)['routes'] as List?;
    if (routes == null || routes.isEmpty) return null;
    final route = routes.first as Map<String, dynamic>;
    final geometry = route['geometry'] as Map<String, dynamic>;
    final coordsList = (geometry['coordinates'] as List).cast<List<dynamic>>();
    return RouteResult(
      distanceKm: (route['distance'] as num).toDouble() / 1000,
      durationMinutes: ((route['duration'] as num).toDouble() / 60).ceil(),
      points: coordsList.map((c) => LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble())).toList(),
    );
  }
}

/// Foreground device location for the active-delivery map (the background
/// stream is handled by the foreground service).
class LocationService {
  Future<LatLng> currentLocation() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw LocationDeniedException('Location services are disabled. Please enable GPS.');
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
      throw LocationDeniedException('Location permission denied.');
    }
    final pos = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
    return LatLng(pos.latitude, pos.longitude);
  }
}

final osrmServiceProvider = Provider<OsrmService>((ref) => OsrmService());
final locationServiceProvider = Provider<LocationService>((ref) => LocationService());
