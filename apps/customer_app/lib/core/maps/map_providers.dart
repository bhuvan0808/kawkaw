import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'location_service.dart';
import 'nominatim_service.dart';
import 'osrm_service.dart';

final nominatimServiceProvider = Provider<NominatimService>((ref) => NominatimService());
final osrmServiceProvider = Provider<OsrmService>((ref) => OsrmService());
final locationServiceProvider = Provider<LocationService>((ref) => LocationService());
