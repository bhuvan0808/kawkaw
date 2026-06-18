import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'realtime_service.dart';

final riderRealtimeProvider = Provider<RiderRealtimeService>((ref) {
  final service = RiderRealtimeService();
  ref.onDispose(service.dispose);
  return service;
});
