import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/providers.dart';
import '../data/app_user.dart';
import '../data/auth_repository.dart';
import '../data/firebase_auth_service.dart';

final firebaseAuthServiceProvider = Provider<FirebaseAuthService>((ref) => FirebaseAuthService());

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(dioProvider), ref.watch(tokenStorageProvider));
});

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState({required this.status, this.user});
  final AuthStatus status;
  final AppUser? user;

  const AuthState.unknown() : this(status: AuthStatus.unknown);
  const AuthState.unauthenticated() : this(status: AuthStatus.unauthenticated);
  AuthState.authenticated(AppUser user) : this(status: AuthStatus.authenticated, user: user);

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isResolved => status != AuthStatus.unknown;
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    unawaited(_restore());
    return const AuthState.unknown();
  }

  AuthRepository get _repo => ref.read(authRepositoryProvider);

  Future<void> _restore() async {
    if (!await ref.read(tokenStorageProvider).hasSession) {
      state = const AuthState.unauthenticated();
      return;
    }
    try {
      final user = await _repo.fetchProfile().timeout(const Duration(seconds: 12));
      state = AuthState.authenticated(user);
    } catch (_) {
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> completeLogin(String idToken, {String? name}) async {
    final fcmToken = await _fcmToken().timeout(const Duration(seconds: 8), onTimeout: () => null);
    final user = await _repo
        .loginWithFirebase(idToken: idToken, name: name, fcmToken: fcmToken)
        .timeout(const Duration(seconds: 25));
    state = AuthState.authenticated(user);
  }

  /// After registering as a rider, rotate the token so it carries the RIDER
  /// role + riderId, then refresh the profile.
  Future<void> reauthenticate() async {
    await _repo.refreshSession();
    final user = await _repo.fetchProfile();
    state = AuthState.authenticated(user);
  }

  Future<void> refreshProfile() async {
    try {
      state = AuthState.authenticated(await _repo.fetchProfile());
    } catch (_) {}
  }

  Future<void> logout() async {
    await _repo.logout();
    try {
      await ref.read(firebaseAuthServiceProvider).signOut();
    } catch (_) {}
    state = const AuthState.unauthenticated();
  }

  void setUnauthenticated() => state = const AuthState.unauthenticated();

  Future<String?> _fcmToken() async {
    try {
      final m = FirebaseMessaging.instance;
      await m.requestPermission();
      return await m.getToken();
    } catch (e) {
      debugPrint('FCM token unavailable: $e');
      return null;
    }
  }
}
