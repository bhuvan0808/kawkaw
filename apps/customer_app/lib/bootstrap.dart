import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import 'firebase_options.dart';

/// Background FCM handler — must be a top-level function.
@pragma('vm:entry-point')
Future<void> _firebaseBackgroundHandler(RemoteMessage message) async {
  // Data is delivered to the system tray automatically; nothing to do here for V1.
  debugPrint('FCM background message: ${message.messageId}');
}

/// One-time app initialization. Firebase failures are tolerated in dev so the
/// app still boots before `flutterfire configure` has been run.
Future<void> bootstrap() async {
  try {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    FirebaseMessaging.onBackgroundMessage(_firebaseBackgroundHandler);
  } catch (e) {
    debugPrint('Firebase not initialized (configure with flutterfire): $e');
  }
}
