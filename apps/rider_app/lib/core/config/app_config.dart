import 'package:latlong2/latlong.dart';

/// Compile-time configuration. Override with --dart-define at build time, e.g.
///   flutter run --dart-define=API_BASE_URL=https://api.kawkaw.in
abstract final class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static String get apiV1 => '$apiBaseUrl/api/v1';
  static String get realtimeUrl => apiBaseUrl;

  static const String nominatimUrl = String.fromEnvironment(
    'NOMINATIM_URL',
    defaultValue: 'https://nominatim.openstreetmap.org',
  );
  static const String osrmUrl = String.fromEnvironment(
    'OSRM_URL',
    defaultValue: 'https://router.project-osrm.org',
  );
  static const String osmTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  static const String osmUserAgent = 'in.kawkaw.rider';

  static const LatLng launchCityCenter = LatLng(17.6688, 80.8936);

  /// Background-location update cadence (target 10–15s).
  static const int locationIntervalMs = 12000;

  static const String supportPhone = '+910000000000';
  static const String supportEmail = 'riders@kawkaw.in';
  static const String privacyPolicyUrl = 'https://kawkaw.in/privacy';
  static const String termsUrl = 'https://kawkaw.in/terms';
}
