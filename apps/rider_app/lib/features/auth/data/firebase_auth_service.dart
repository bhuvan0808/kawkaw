import 'package:firebase_auth/firebase_auth.dart';

/// Firebase Phone Authentication wrapper. Firebase is the single source of
/// phone identity; the backend only verifies the resulting ID token.
class FirebaseAuthService {
  FirebaseAuthService([FirebaseAuth? auth]) : _auth = auth ?? FirebaseAuth.instance;
  final FirebaseAuth _auth;

  Future<void> sendOtp({
    required String phoneNumber,
    required void Function(String verificationId) onCodeSent,
    required void Function(String message) onError,
    required void Function(String idToken) onAutoVerified,
  }) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      timeout: const Duration(seconds: 60),
      verificationCompleted: (PhoneAuthCredential credential) async {
        try {
          onAutoVerified(await _signInAndGetToken(credential));
        } catch (e) {
          onError(e.toString());
        }
      },
      verificationFailed: (FirebaseAuthException e) => onError(e.message ?? 'Verification failed.'),
      codeSent: (String verificationId, int? _) => onCodeSent(verificationId),
      codeAutoRetrievalTimeout: (String _) {},
    );
  }

  Future<String> verifyOtp({required String verificationId, required String smsCode}) async {
    final credential = PhoneAuthProvider.credential(verificationId: verificationId, smsCode: smsCode);
    return _signInAndGetToken(credential);
  }

  Future<String> _signInAndGetToken(PhoneAuthCredential credential) async {
    final result = await _auth.signInWithCredential(credential);
    final token = await result.user?.getIdToken();
    if (token == null) {
      throw FirebaseAuthException(code: 'no-token', message: 'Could not obtain Firebase token.');
    }
    return token;
  }

  Future<void> signOut() => _auth.signOut();
}
