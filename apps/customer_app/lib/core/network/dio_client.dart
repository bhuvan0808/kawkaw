import 'dart:async';

import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../storage/token_storage.dart';
import 'api_endpoints.dart';

/// Builds the configured Dio instance: base URL, timeouts, bearer-token
/// attachment, and transparent access-token refresh on 401.
Dio buildDio({
  required TokenStorage storage,
  required Future<void> Function() onSessionExpired,
}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiV1,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      contentType: 'application/json',
    ),
  );
  dio.interceptors.add(_AuthRefreshInterceptor(dio, storage, onSessionExpired));
  return dio;
}

class _AuthRefreshInterceptor extends Interceptor {
  _AuthRefreshInterceptor(this._dio, this._storage, this._onSessionExpired);

  final Dio _dio;
  final TokenStorage _storage;
  final Future<void> Function() _onSessionExpired;

  // A dedicated, interceptor-free Dio for the refresh call (avoids recursion).
  final Dio _refreshDio = Dio(BaseOptions(baseUrl: AppConfig.apiV1));

  Completer<bool>? _refreshing;

  static const _authPaths = {ApiEndpoints.firebaseLogin, ApiEndpoints.refresh};

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    if (!_authPaths.contains(options.path)) {
      final token = await _storage.accessToken;
      if (token != null) options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final isAuthCall = _authPaths.contains(err.requestOptions.path);
    final alreadyRetried = err.requestOptions.extra['__retried'] == true;

    if (err.response?.statusCode == 401 && !isAuthCall && !alreadyRetried) {
      final refreshed = await _refreshToken();
      if (refreshed) {
        try {
          final token = await _storage.accessToken;
          final opts = err.requestOptions
            ..extra['__retried'] = true
            ..headers['Authorization'] = 'Bearer $token';
          final response = await _dio.fetch<dynamic>(opts);
          return handler.resolve(response);
        } catch (_) {
          // fall through to session expiry
        }
      }
      await _onSessionExpired();
    }
    handler.next(err);
  }

  Future<bool> _refreshToken() async {
    // Coalesce concurrent refreshes.
    if (_refreshing != null) return _refreshing!.future;
    final completer = Completer<bool>();
    _refreshing = completer;
    try {
      final refresh = await _storage.refreshToken;
      if (refresh == null) {
        completer.complete(false);
        return false;
      }
      final res = await _refreshDio.post<dynamic>(
        ApiEndpoints.refresh,
        data: {'refreshToken': refresh},
      );
      final data = (res.data as Map)['data'] as Map;
      await _storage.save(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String,
      );
      completer.complete(true);
      return true;
    } catch (_) {
      completer.complete(false);
      return false;
    } finally {
      _refreshing = null;
    }
  }
}
