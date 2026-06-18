import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:geolocator/geolocator.dart';

import '../config/app_config.dart';
import '../network/api_endpoints.dart';

const String kTokenKey = 'kk_rider_token';
const String kQueueKey = 'kk_rider_locq';
const int _maxQueue = 300;

/// Entry point for the foreground-service isolate. MUST be top-level + annotated.
@pragma('vm:entry-point')
void startLocationCallback() {
  FlutterForegroundTask.setTaskHandler(LocationTaskHandler());
}

/// Runs inside the foreground service. On each tick it reads GPS, posts the
/// location to the backend, and — if offline — queues it for later sync.
class LocationTaskHandler extends TaskHandler {
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiV1,
      connectTimeout: const Duration(seconds: 10),
      sendTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );

  @override
  Future<void> onStart(DateTime timestamp, TaskStarter starter) async {
    await _tick(timestamp);
  }

  @override
  void onRepeatEvent(DateTime timestamp) {
    _tick(timestamp);
  }

  Future<void> _tick(DateTime timestamp) async {
    try {
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      final payload = <String, dynamic>{
        'latitude': pos.latitude,
        'longitude': pos.longitude,
        'accuracy': pos.accuracy,
        'heading': pos.heading,
        'speed': pos.speed,
      };

      // Notify the UI isolate (for the live "last update" indicator).
      FlutterForegroundTask.sendDataToMain({
        'lat': pos.latitude,
        'lng': pos.longitude,
        'at': timestamp.toIso8601String(),
      });

      final token = await FlutterForegroundTask.getData<String>(key: kTokenKey);
      if (token == null) {
        await _enqueue(payload);
        return;
      }
      if (await _post(token, payload)) {
        await _flushQueue(token);
      } else {
        await _enqueue(payload);
      }
    } catch (_) {
      // Skip this tick on any GPS/IO error; next tick retries.
    }
  }

  Future<bool> _post(String token, Map<String, dynamic> payload) async {
    try {
      await _dio.post<dynamic>(
        ApiEndpoints.riderLocation,
        data: payload,
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> _enqueue(Map<String, dynamic> payload) async {
    final raw = await FlutterForegroundTask.getData<String>(key: kQueueKey);
    final list = raw == null ? <dynamic>[] : (jsonDecode(raw) as List);
    list.add(payload);
    final capped = list.length > _maxQueue ? list.sublist(list.length - _maxQueue) : list;
    await FlutterForegroundTask.saveData(key: kQueueKey, value: jsonEncode(capped));
  }

  /// Flushes queued offline locations once connectivity returns.
  Future<void> _flushQueue(String token) async {
    final raw = await FlutterForegroundTask.getData<String>(key: kQueueKey);
    if (raw == null) return;
    final list = jsonDecode(raw) as List;
    if (list.isEmpty) return;
    final remaining = <dynamic>[];
    for (final item in list) {
      final ok = await _post(token, Map<String, dynamic>.from(item as Map));
      if (!ok) {
        remaining.add(item); // stop optimism: keep the rest for next flush
      }
    }
    await FlutterForegroundTask.saveData(key: kQueueKey, value: jsonEncode(remaining));
  }

  @override
  Future<void> onDestroy(DateTime timestamp) async {}

  @override
  void onReceiveData(Object data) {}

  @override
  void onNotificationButtonPressed(String id) {}

  @override
  void onNotificationPressed() => FlutterForegroundTask.launchApp();

  @override
  void onNotificationDismissed() {}
}
