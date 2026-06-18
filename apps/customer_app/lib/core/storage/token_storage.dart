import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Securely persists the Kaw Kaw JWT access/refresh token pair.
class TokenStorage {
  TokenStorage(this._storage);

  final FlutterSecureStorage _storage;

  static const _kAccess = 'kk_access_token';
  static const _kRefresh = 'kk_refresh_token';

  String? _cachedAccess;

  Future<void> save({required String accessToken, required String refreshToken}) async {
    _cachedAccess = accessToken;
    await _storage.write(key: _kAccess, value: accessToken);
    await _storage.write(key: _kRefresh, value: refreshToken);
  }

  Future<String?> get accessToken async {
    return _cachedAccess ??= await _storage.read(key: _kAccess);
  }

  Future<String?> get refreshToken => _storage.read(key: _kRefresh);

  Future<bool> get hasSession async => (await refreshToken) != null;

  Future<void> clear() async {
    _cachedAccess = null;
    await _storage.delete(key: _kAccess);
    await _storage.delete(key: _kRefresh);
  }
}
