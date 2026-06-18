import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../config/app_config.dart';

class LocationDeniedException implements Exception {
  LocationDeniedException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Device location via geolocator, with permission handling.
class LocationService {
  Future<LatLng> currentLocation() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw LocationDeniedException('Location services are disabled. Please enable GPS.');
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw LocationDeniedException('Location permission denied.');
    }

    final pos = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
    return LatLng(pos.latitude, pos.longitude);
  }

  /// Fallback to the launch-city centre when location can't be obtained.
  LatLng get fallback => AppConfig.launchCityCenter;
}
