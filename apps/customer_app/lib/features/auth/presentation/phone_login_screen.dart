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
  final _phoneController = TextEditingController();
  final _nameController = TextEditingController();
  bool _sending = false;
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final digits = _phoneController.text.trim();
    if (digits.length != 10) {
      setState(() => _error = 'Enter a valid 10-digit mobile number.');
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    final phone = '+91$digits';
    final name = _nameController.text.trim();

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
              if (mounted) setState(() => _error = e.toString());
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
              Text('Welcome to Kaw Kaw', style: AppTypography.headlineLarge),
              AppSpacing.gapXs,
              Text(
                'Login with your mobile number to get groceries, medicines, food and parcels delivered fast.',
                style: AppTypography.bodyMedium,
              ),
              AppSpacing.gapXxl,
              Text('Mobile number', style: AppTypography.label),
              AppSpacing.gapSm,
              TextField(
                controller: _phoneController,
                // Default text keyboard (same as the Name field) — some emulator
                // IMEs don't surface the numeric keyboard. Digits are enforced below.
                keyboardType: TextInputType.text,
                maxLength: 10,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(
                  prefixText: '+91  ',
                  hintText: '10-digit number',
                  counterText: '',
                ),
              ),
              AppSpacing.gapLg,
              Text('Name (optional)', style: AppTypography.label),
              AppSpacing.gapSm,
              TextField(
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(hintText: 'Your name'),
              ),
              if (_error != null) ...[
                AppSpacing.gapMd,
                Text(_error!, style: AppTypography.caption.copyWith(color: AppColors.error)),
              ],
              AppSpacing.gapXxl,
              KawButton(label: 'Send OTP', isLoading: _sending, onPressed: _sendOtp),
              AppSpacing.gapLg,
              Center(
                child: Text(
                  'By continuing you agree to our Terms & Privacy Policy.',
                  style: AppTypography.caption,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
