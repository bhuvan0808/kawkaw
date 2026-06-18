import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:permission_handler/permission_handler.dart';

import '../config/app_config.dart';
import 'location_task_handler.dart';

/// Main-isolate control surface for the background-location foreground service.
abstract final class BackgroundLocationService {
  /// Configure the foreground service (call once at startup).
  static void initService() {
    FlutterForegroundTask.init(
      androidNotificationOptions: AndroidNotificationOptions(
        channelId: 'kawkaw_rider_location',
        channelName: 'Delivery location sharing',
        channelDescription: 'Keeps your location updating while you are online.',
        onlyAlertOnce: true,
      ),
      iosNotificationOptions: const IOSNotificationOptions(showNotification: false, playSound: false),
      foregroundTaskOptions: ForegroundTaskOptions(
        eventAction: ForegroundTaskEventAction.repeat(AppConfig.locationIntervalMs),
        autoRunOnBoot: false,
        allowWakeLock: true,
        allowWifiLock: true,
      ),
    );
  }

  /// Requests notification + foreground & background location permissions.
  /// Returns true if at least foreground location is granted (service can run
  /// while the app is alive); background permission enables screen-locked updates.
  static Future<bool> ensurePermissions() async {
    if (await FlutterForegroundTask.checkNotificationPermission() != NotificationPermission.granted) {
      await FlutterForegroundTask.requestNotificationPermission();
    }
    var whenInUse = await Permission.locationWhenInUse.status;
    if (!whenInUse.isGranted) whenInUse = await Permission.locationWhenInUse.request();
    if (!whenInUse.isGranted) return false;

    // Background location (Android 10+) is required for updates while locked.
    final always = await Permission.locationAlways.status;
    if (!always.isGranted) await Permission.locationAlways.request();
    return true;
  }

  static Future<bool> hasBackgroundPermission() => Permission.locationAlways.isGranted;

  // --- Battery optimization (requirement #2) -------------------------------
  static Future<bool> isIgnoringBatteryOptimizations() =>
      FlutterForegroundTask.isIgnoringBatteryOptimizations;
  static Future<void> requestIgnoreBatteryOptimization() =>
      FlutterForegroundTask.requestIgnoreBatteryOptimization();
  static Future<void> openBatteryOptimizationSettings() =>
      FlutterForegroundTask.openIgnoreBatteryOptimizationSettings();

  static Future<bool> isRunning() => FlutterForegroundTask.isRunningService;

  /// Starts (or restarts) the service, storing the access token for the isolate.
  static Future<void> start(String accessToken) async {
    await FlutterForegroundTask.saveData(key: kTokenKey, value: accessToken);
    if (await FlutterForegroundTask.isRunningService) {
      await FlutterForegroundTask.restartService();
      return;
    }
    await FlutterForegroundTask.startService(
      serviceId: 256,
      notificationTitle: 'Kaw Kaw — You are online',
      notificationText: 'Sharing your location for nearby deliveries.',
      callback: startLocationCallback,
    );
  }

  /// Keeps the isolate's token fresh after a refresh.
  static Future<void> updateToken(String accessToken) =>
      FlutterForegroundTask.saveData(key: kTokenKey, value: accessToken);

  static Future<void> stop() async {
    if (await FlutterForegroundTask.isRunningService) {
      await FlutterForegroundTask.stopService();
    }
  }
}
