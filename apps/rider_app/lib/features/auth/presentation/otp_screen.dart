import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../application/auth_controller.dart';

class OtpArgs {
  const OtpArgs({required this.verificationId, required this.phoneNumber, this.name});
  final String verificationId;
  final String phoneNumber;
  final String? name;
}

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.args});
  final OtpArgs args;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _code = TextEditingController();
  bool _verifying = false;
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    if (_code.text.trim().length < 6) {
      setState(() => _error = 'Enter the 6-digit code.');
      return;
    }
    setState(() {
      _verifying = true;
      _error = null;
    });
    try {
      final idToken = await ref
          .read(firebaseAuthServiceProvider)
          .verifyOtp(verificationId: widget.args.verificationId, smsCode: _code.text.trim())
          .timeout(const Duration(seconds: 30));
      await ref.read(authControllerProvider.notifier).completeLogin(idToken, name: widget.args.name);
    } on TimeoutException {
      if (mounted) {
        setState(() {
          _verifying = false;
          _error = 'This is taking too long. Check your connection and try again.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _verifying = false;
          _error = 'Could not verify the code. Please try again.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Verify your number', style: AppTypography.headlineLarge),
              AppSpacing.gapXs,
              Text('We sent a 6-digit code to ${widget.args.phoneNumber}.', style: AppTypography.bodyMedium),
              AppSpacing.gapXxl,
              TextField(
                controller: _code,
                keyboardType: TextInputType.text, // emulator IME compatibility; digits enforced below
                maxLength: 6,
                textAlign: TextAlign.center,
                style: AppTypography.headlineLarge,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: const InputDecoration(hintText: '••••••', counterText: ''),
              ),
              if (_error != null) ...[
                AppSpacing.gapMd,
                Text(_error!, style: AppTypography.caption.copyWith(color: AppColors.error)),
              ],
              AppSpacing.gapXxl,
              KawButton(label: 'Verify & continue', isLoading: _verifying, onPressed: _verify),
              AppSpacing.gapMd,
              Center(
                child: TextButton(
                  onPressed: _verifying ? null : () => context.pop(),
                  child: const Text('Change number'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
