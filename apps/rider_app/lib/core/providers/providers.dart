import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../features/auth/application/auth_controller.dart';
import '../network/dio_client.dart';
import '../storage/token_storage.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
});

final tokenStorageProvider = Provider<TokenStorage>((ref) {
  return TokenStorage(ref.watch(secureStorageProvider));
});

final dioProvider = Provider<Dio>((ref) {
  final storage = ref.watch(tokenStorageProvider);
  return buildDio(
    storage: storage,
    onSessionExpired: () async {
      await storage.clear();
      ref.read(authControllerProvider.notifier).setUnauthenticated();
    },
  );
});

/// Unwraps the backend success envelope `{ success, data, timestamp }`.
T unwrap<T>(Response<dynamic> res) {
  final body = res.data;
  if (body is Map && body.containsKey('data')) return body['data'] as T;
  return body as T;
}
