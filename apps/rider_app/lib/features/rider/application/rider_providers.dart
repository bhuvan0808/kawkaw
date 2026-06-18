import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/location/background_location_service.dart';
import '../../../core/providers/providers.dart';
import '../data/rider_profile.dart';
import '../data/rider_repository.dart';

class LocationPermissionRequired implements Exception {}

final riderRepositoryProvider = Provider<RiderRepository>((ref) {
  return RiderRepository(ref.watch(dioProvider));
});

/// The rider profile (null if this account hasn't registered as a rider yet).
final riderProfileProvider = FutureProvider<RiderProfile?>((ref) {
  return ref.watch(riderRepositoryProvider).getMe();
});

final earningsSummaryProvider = FutureProvider.autoDispose<EarningsSummary>((ref) {
  return ref.watch(riderRepositoryProvider).earningsSummary();
});

final riderControllerProvider = Provider<RiderController>((ref) => RiderController(ref));

class RiderController {
  RiderController(this._ref);
  final Ref _ref;

  RiderRepository get _repo => _ref.read(riderRepositoryProvider);

  /// Go online: ensure permissions, set status, start the background-location
  /// foreground service. Throws [LocationPermissionRequired] if location is denied.
  Future<void> goOnline() async {
    final granted = await BackgroundLocationService.ensurePermissions();
    if (!granted) throw LocationPermissionRequired();
    await _repo.setStatus(RiderStatus.online);
    final token = await _ref.read(tokenStorageProvider).accessToken;
    if (token != null) await BackgroundLocationService.start(token);
    _ref.invalidate(riderProfileProvider);
  }

  Future<void> goOffline() async {
    await _repo.setStatus(RiderStatus.offline);
    await BackgroundLocationService.stop();
    _ref.invalidate(riderProfileProvider);
  }

  Future<void> register({String? vehicleType, String? vehicleNumber, String? licenseNumber}) async {
    await _repo.register(
      vehicleType: vehicleType,
      vehicleNumber: vehicleNumber,
      licenseNumber: licenseNumber,
    );
  }

  /// Keep the foreground-service isolate's token fresh (call on resume).
  Future<void> refreshServiceToken() async {
    if (!await BackgroundLocationService.isRunning()) return;
    final token = await _ref.read(tokenStorageProvider).accessToken;
    if (token != null) await BackgroundLocationService.updateToken(token);
  }
}
