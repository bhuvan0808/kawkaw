import 'package:dio/dio.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/providers/providers.dart';
import '../../../core/storage/token_storage.dart';
import 'app_user.dart';

class AuthRepository {
  AuthRepository(this._dio, this._storage);

  final Dio _dio;
  final TokenStorage _storage;

  Future<AppUser> loginWithFirebase({
    required String idToken,
    String? name,
    String? fcmToken,
  }) async {
    try {
      final res = await _dio.post<dynamic>(
        ApiEndpoints.firebaseLogin,
        data: {
          'idToken': idToken,
          if (name != null && name.isNotEmpty) 'name': name,
          if (fcmToken != null) 'fcmToken': fcmToken,
        },
      );
      final data = unwrap<Map<String, dynamic>>(res);
      final tokens = data['tokens'] as Map<String, dynamic>;
      await _storage.save(
        accessToken: tokens['accessToken'] as String,
        refreshToken: tokens['refreshToken'] as String,
      );
      return AppUser.fromJson(data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  /// Rotates the session so a freshly-elevated RIDER role (+ riderId) lands in
  /// the access token immediately after registration.
  Future<void> refreshSession() async {
    final refresh = await _storage.refreshToken;
    if (refresh == null) return;
    try {
      final res = await _dio.post<dynamic>(ApiEndpoints.refresh, data: {'refreshToken': refresh});
      final data = unwrap<Map<String, dynamic>>(res);
      await _storage.save(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<AppUser> fetchProfile() async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.me);
      return AppUser.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> logout() async {
    final refresh = await _storage.refreshToken;
    try {
      if (refresh != null) {
        await _dio.post<dynamic>(ApiEndpoints.logout, data: {'refreshToken': refresh});
      }
    } on DioException {
      // best effort
    } finally {
      await _storage.clear();
    }
  }
}
