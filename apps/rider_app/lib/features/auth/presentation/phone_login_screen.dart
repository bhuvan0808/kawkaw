import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../core/router/routes.dart';
import '../application/auth_controller.dart';
import 'otp_screen.dart';

class PhoneLoginScreen extends ConsumerStatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  ConsumerState<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends ConsumerState<PhoneLoginScreen> {
  final _phone = TextEditingController();
  final _name = TextEditingController();
  bool _sending = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final digits = _phone.text.trim();
    if (digits.length != 10) {
      setState(() => _error = 'Enter a valid 10-digit mobile number.');
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    final phone = '+91$digits';
    final name = _name.text.trim();
    await ref.read(firebaseAuthServiceProvider).sendOtp(
          phoneNumber: phone,
          onCodeSent: (verificationId) {
            if (!mounted) return;
            setState(() => _sending = false);
            context.push(
              Routes.otp,
              extra: OtpArgs(verificationId: verificationId, phoneNumber: phone, name: name),
            );
          },
          onAutoVerified: (idToken) async {
            try {
              await ref.read(authControllerProvider.notifier).completeLogin(idToken, name: name);
            } catch (e) {
              if (mounted) setState(() => _error = '$e');
            }
          },
          onError: (message) {
            if (mounted) {
              setState(() {
                _sending = false;
                _error = message;
              });
            }
          },
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppSpacing.gapXxl,
              Text('Rider login', style: AppTypography.headlineLarge),
              AppSpacing.gapXs,
              Text(
                'Log in with your mobile number to start accepting deliveries.',
                style: AppTypography.bodyMedium,
              ),
              AppSpacing.gapXxl,
              Text('Mobile number', style: AppTypography.label),
              AppSpacing.gapSm,
              TextField(
                controller: _phone,
                keyboardType: TextInputType.text, // emulator IME compatibility; digits enforced below
                maxLength: 10,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(prefixText: '+91  ', hintText: '10-digit number', counterText: ''),
              ),
              AppSpacing.gapLg,
              Text('Name (optional)', style: AppTypography.label),
              AppSpacing.gapSm,
              TextField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(hintText: 'Your name'),
              ),
              if (_error != null) ...[
                AppSpacing.gapMd,
                Text(_error!, style: AppTypography.caption.copyWith(color: AppColors.error)),
              ],
              AppSpacing.gapXxl,
              KawButton(label: 'Send OTP', isLoading: _sending, onPressed: _sendOtp),
            ],
          ),
        ),
      ),
    );
  }
}
