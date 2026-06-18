import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../auth/application/auth_controller.dart';
import '../../application/rider_providers.dart';

class RegisterRiderCard extends ConsumerStatefulWidget {
  const RegisterRiderCard({super.key});

  @override
  ConsumerState<RegisterRiderCard> createState() => _RegisterRiderCardState();
}

class _RegisterRiderCardState extends ConsumerState<RegisterRiderCard> {
  final _vehicleType = TextEditingController(text: 'Bike');
  final _vehicleNumber = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _vehicleType.dispose();
    _vehicleNumber.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(riderControllerProvider).register(
            vehicleType: _vehicleType.text.trim(),
            vehicleNumber: _vehicleNumber.text.trim(),
          );
      // Rotate the token so it carries the new RIDER role + riderId.
      await ref.read(authControllerProvider.notifier).reauthenticate();
      ref.invalidate(riderProfileProvider);
    } catch (e) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _error = '$e';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        AppSpacing.gapLg,
        Text('Become a Kaw Kaw rider', style: AppTypography.headlineLarge),
        AppSpacing.gapXs,
        Text(
          'Register your vehicle to start delivering. An admin will verify you before you can go online.',
          style: AppTypography.bodyMedium,
        ),
        AppSpacing.gapXl,
        Text('Vehicle type', style: AppTypography.label),
        AppSpacing.gapSm,
        TextField(
          controller: _vehicleType,
          decoration: const InputDecoration(hintText: 'Bike / Scooter / Cycle'),
        ),
        AppSpacing.gapLg,
        Text('Vehicle number', style: AppTypography.label),
        AppSpacing.gapSm,
        TextField(
          controller: _vehicleNumber,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(hintText: 'e.g. TS01AB1234'),
        ),
        if (_error != null) ...[
          AppSpacing.gapMd,
          Text(_error!, style: AppTypography.caption.copyWith(color: AppColors.error)),
        ],
        AppSpacing.gapXxl,
        KawButton(label: 'Register as rider', isLoading: _submitting, onPressed: _submit),
      ],
    );
  }
}
