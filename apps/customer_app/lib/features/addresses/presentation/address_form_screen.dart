import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../core/maps/geo_models.dart';
import '../../../core/router/routes.dart';
import '../application/address_controller.dart';
import '../data/address.dart';

class AddressFormScreen extends ConsumerStatefulWidget {
  const AddressFormScreen({super.key, this.existing});

  final Address? existing;

  @override
  ConsumerState<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends ConsumerState<AddressFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late final _line1 = TextEditingController(text: widget.existing?.line1);
  late final _line2 = TextEditingController(text: widget.existing?.line2);
  late final _landmark = TextEditingController(text: widget.existing?.landmark);
  late final _pincode = TextEditingController(text: widget.existing?.pincode);
  late final _receiverName = TextEditingController(text: widget.existing?.receiverName);
  late final _receiverPhone = TextEditingController(text: widget.existing?.receiverPhone);

  late String _type = widget.existing?.type ?? 'HOME';
  late bool _isDefault = widget.existing?.isDefault ?? false;
  double? _lat;
  double? _lng;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _lat = widget.existing?.latitude;
    _lng = widget.existing?.longitude;
  }

  @override
  void dispose() {
    for (final c in [_line1, _line2, _landmark, _pincode, _receiverName, _receiverPhone]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickOnMap() async {
    final place = await context.push<GeoPlace>(Routes.addressPicker);
    if (place == null) return;
    setState(() {
      _lat = place.location.latitude;
      _lng = place.location.longitude;
      if (_line1.text.isEmpty) _line1.text = place.displayName;
      if (place.pincode != null) _pincode.text = place.pincode!;
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_lat == null || _lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please pin the location on the map.')),
      );
      return;
    }
    setState(() => _saving = true);
    final input = AddressInput(
      type: _type,
      line1: _line1.text.trim(),
      line2: _line2.text.trim(),
      landmark: _landmark.text.trim(),
      pincode: _pincode.text.trim(),
      latitude: _lat!,
      longitude: _lng!,
      isDefault: _isDefault,
      receiverName: _receiverName.text.trim(),
      receiverPhone: _receiverPhone.text.trim(),
    );
    try {
      final controller = ref.read(addressControllerProvider.notifier);
      if (widget.existing == null) {
        await controller.create(input);
      } else {
        await controller.updateAddress(widget.existing!.id, input);
      }
      if (mounted) context.pop(true);
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasPin = _lat != null && _lng != null;
    return Scaffold(
      appBar: AppBar(title: Text(widget.existing == null ? 'Add address' : 'Edit address')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            KawButton(
              label: hasPin ? 'Location pinned ✓ — change' : 'Pin location on map',
              icon: Icons.map_rounded,
              variant: KawButtonVariant.outlined,
              onPressed: _pickOnMap,
            ),
            AppSpacing.gapLg,
            Wrap(
              spacing: AppSpacing.sm,
              children: ['HOME', 'WORK', 'OTHER']
                  .map(
                    (t) => ChoiceChip(
                      label: Text(t[0] + t.substring(1).toLowerCase()),
                      selected: _type == t,
                      onSelected: (_) => setState(() => _type = t),
                    ),
                  )
                  .toList(),
            ),
            AppSpacing.gapLg,
            _field(_line1, 'Flat / House no, Building, Street', required: true),
            _field(_line2, 'Area / Colony (optional)'),
            _field(_landmark, 'Landmark (optional)'),
            _field(
              _pincode,
              'PIN code',
              required: true,
              keyboardType: TextInputType.number,
              maxLength: 6,
              validator: (v) =>
                  (v != null && RegExp(r'^\d{6}$').hasMatch(v)) ? null : 'Enter a 6-digit PIN',
            ),
            const Divider(height: AppSpacing.xxl),
            Text('Receiver (optional)', style: AppTypography.label),
            AppSpacing.gapSm,
            _field(_receiverName, 'Receiver name'),
            _field(
              _receiverPhone,
              'Receiver phone',
              keyboardType: TextInputType.phone,
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isDefault,
              onChanged: (v) => setState(() => _isDefault = v),
              title: const Text('Set as default address'),
              activeThumbColor: AppColors.secondary,
            ),
            AppSpacing.gapLg,
            KawButton(label: 'Save address', isLoading: _saving, onPressed: _save),
          ],
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String hint, {
    bool required = false,
    TextInputType? keyboardType,
    int? maxLength,
    String? Function(String?)? validator,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        maxLength: maxLength,
        inputFormatters:
            keyboardType == TextInputType.number ? [FilteringTextInputFormatter.digitsOnly] : null,
        decoration: InputDecoration(hintText: hint, counterText: ''),
        validator: validator ??
            (required
                ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
                : null),
      ),
    );
  }
}
