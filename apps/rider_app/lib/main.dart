import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'bootstrap.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Required for data exchange between the UI isolate and the foreground task.
  FlutterForegroundTask.initCommunicationPort();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  await bootstrap();
  runApp(const ProviderScope(child: RiderApp()));
}
