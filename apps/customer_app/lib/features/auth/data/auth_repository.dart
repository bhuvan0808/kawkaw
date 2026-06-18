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

  /// Exchanges a Firebase ID token for Kaw Kaw JWTs and persists them.
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

  Future<AppUser> fetchProfile() async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.me);
      return AppUser.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<AppUser> updateProfile({String? name, String? email}) async {
    try {
      final res = await _dio.patch<dynamic>(
        ApiEndpoints.usersMe,
        data: {
          if (name != null && name.isNotEmpty) 'name': name,
          if (email != null && email.isNotEmpty) 'email': email,
        },
      );
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
      // best-effort server revoke
    } finally {
      await _storage.clear();
    }
  }
}
