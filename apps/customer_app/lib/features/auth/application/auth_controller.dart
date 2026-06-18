import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/providers.dart';
import '../data/app_user.dart';
import '../data/auth_repository.dart';
import '../data/firebase_auth_service.dart';

final firebaseAuthServiceProvider = Provider<FirebaseAuthService>((ref) {
  return FirebaseAuthService();
});

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
    final hasSession = await ref.read(tokenStorageProvider).hasSession;
    if (!hasSession) {
      state = const AuthState.unauthenticated();
      return;
    }
    try {
      // Never let session-restore hang the splash forever.
      final user = await _repo.fetchProfile().timeout(const Duration(seconds: 12));
      state = AuthState.authenticated(user);
    } catch (_) {
      state = const AuthState.unauthenticated();
    }
  }

  /// Completes login after a Firebase ID token has been obtained.
  Future<void> completeLogin(String idToken, {String? name}) async {
    final fcmToken = await _fcmToken().timeout(
      const Duration(seconds: 8),
      onTimeout: () => null,
    );
    final user = await _repo
        .loginWithFirebase(idToken: idToken, name: name, fcmToken: fcmToken)
        .timeout(const Duration(seconds: 25));
    state = AuthState.authenticated(user);
  }

  Future<void> refreshProfile() async {
    try {
      final user = await _repo.fetchProfile();
      state = AuthState.authenticated(user);
    } catch (_) {
      /* keep current state */
    }
  }

  Future<void> updateProfile({String? name, String? email}) async {
    final user = await _repo.updateProfile(name: name, email: email);
    state = AuthState.authenticated(user);
  }

  Future<void> logout() async {
    await _repo.logout();
    try {
      await ref.read(firebaseAuthServiceProvider).signOut();
    } catch (_) {}
    state = const AuthState.unauthenticated();
  }

  /// Called by the Dio interceptor when refresh fails.
  void setUnauthenticated() {
    state = const AuthState.unauthenticated();
  }

  Future<String?> _fcmToken() async {
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      return await messaging.getToken();
    } catch (e) {
      debugPrint('FCM token unavailable: $e');
      return null;
    }
  }
}
