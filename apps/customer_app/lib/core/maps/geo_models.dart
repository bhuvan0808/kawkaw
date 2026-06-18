import 'package:latlong2/latlong.dart';

/// A geocoded place from Nominatim.
class GeoPlace {
  const GeoPlace({required this.displayName, required this.location, this.address = const {}});

  final String displayName;
  final LatLng location;
  final Map<String, dynamic> address;

  String? get pincode => address['postcode'] as String?;
  String? get city =>
      (address['city'] ?? address['town'] ?? address['village'] ?? address['suburb']) as String?;
  String? get state => address['state'] as String?;
}

/// An OSRM route between two points.
class RouteResult {
  const RouteResult({required this.distanceKm, required this.durationMinutes, required this.points});

  final double distanceKm;
  final int durationMinutes;
  final List<LatLng> points;
}
