import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../core/router/routes.dart';
import '../../../core/settings/public_settings.dart';
import '../../addresses/application/address_controller.dart';
import '../../cart/application/cart_controller.dart';
import '../../coupons/data/coupons_repository.dart';
import '../../orders/application/orders_providers.dart';
import '../../orders/data/orders_repository.dart';
import '../../prescriptions/data/prescriptions_repository.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _notes = TextEditingController();
  final _coupon = TextEditingController();
  String? _prescriptionId;
  String? _appliedCoupon;
  double _discount = 0;
  String? _couponMessage;
  bool _applyingCoupon = false;
  bool _uploading = false;
  bool _placing = false;

  @override
  void dispose() {
    _notes.dispose();
    _coupon.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon() async {
    final code = _coupon.text.trim();
    if (code.isEmpty) return;
    final cart = ref.read(cartControllerProvider);
    setState(() {
      _applyingCoupon = true;
      _couponMessage = null;
    });
    try {
      final result = await ref.read(couponsRepositoryProvider).validate(
            code: code,
            subtotal: cart.subtotal,
            serviceType: cart.serviceType,
          );
      setState(() {
        _appliedCoupon = result.code;
        _discount = result.discount;
        _couponMessage = 'Coupon applied — you saved ₹${result.discount.toStringAsFixed(0)}';
        _applyingCoupon = false;
      });
    } catch (e) {
      setState(() {
        _appliedCoupon = null;
        _discount = 0;
        _couponMessage = '$e';
        _applyingCoupon = false;
      });
    }
  }

  Future<void> _attachPrescription() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 1600);
    if (file == null) return;
    setState(() => _uploading = true);
    try {
      final id = await ref.read(prescriptionsRepositoryProvider).upload(file.path);
      setState(() {
        _prescriptionId = id;
        _uploading = false;
      });
    } catch (e) {
      setState(() => _uploading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _placeOrder() async {
    final cart = ref.read(cartControllerProvider);
    final address = ref.read(defaultAddressProvider);
    if (address == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add a delivery address first.')),
      );
      return;
    }
    setState(() => _placing = true);
    try {
      final order = await ref.read(ordersRepositoryProvider).create(
            addressId: address.id,
            serviceType: cart.serviceType!,
            items: cart.items
                .map((i) => OrderLineInput(productId: i.productId, quantity: i.quantity))
                .toList(),
            notes: _notes.text.trim(),
            prescriptionId: _prescriptionId,
            couponCode: _appliedCoupon,
          );
      ref.read(cartControllerProvider.notifier).clear();
      ref.invalidate(pagedOrdersProvider);
      if (mounted) context.go(Routes.orderTracking(order.id));
    } catch (e) {
      setState(() => _placing = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartControllerProvider);
    ref.watch(addressControllerProvider); // ensure addresses load
    final address = ref.watch(defaultAddressProvider);
    final settings = ref.watch(publicSettingsProvider).valueOrNull;
    final isPharmacy = cart.serviceType == 'PHARMACY';

    if (cart.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: const EmptyView(title: 'Your cart is empty', icon: Icons.shopping_cart_outlined),
      );
    }

    final subtotal = cart.subtotal;
    final discount = _discount.clamp(0, subtotal).toDouble();
    final taxable = subtotal - discount;
    final deliveryFee = settings == null
        ? 0.0
        : (subtotal >= settings.freeDeliveryAbove ? 0.0 : settings.deliveryFee);
    final tax = settings == null ? 0.0 : taxable * settings.taxPercent / 100;
    final total = taxable + deliveryFee + tax;

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          _AddressCard(
            summary: address?.summary,
            onChange: () => context.push(Routes.addresses),
          ),
          AppSpacing.gapLg,
          if (isPharmacy) ...[
            _PrescriptionCard(
              attached: _prescriptionId != null,
              uploading: _uploading,
              onAttach: _attachPrescription,
            ),
            AppSpacing.gapLg,
          ],
          _CouponCard(
            controller: _coupon,
            applying: _applyingCoupon,
            applied: _appliedCoupon != null,
            message: _couponMessage,
            messageIsError: _appliedCoupon == null && _couponMessage != null,
            onApply: _applyCoupon,
          ),
          AppSpacing.gapLg,
          KawCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Bill details', style: AppTypography.titleMedium),
                AppSpacing.gapMd,
                _row('Item total', '₹${subtotal.toStringAsFixed(0)}'),
                if (discount > 0) _row('Coupon discount', '− ₹${discount.toStringAsFixed(0)}'),
                _row('Delivery fee', deliveryFee == 0 ? 'FREE' : '₹${deliveryFee.toStringAsFixed(0)}'),
                if (tax > 0) _row('Taxes', '₹${tax.toStringAsFixed(2)}'),
                const Divider(),
                _row('To pay (Cash on Delivery)', '₹${total.toStringAsFixed(0)}', bold: true),
              ],
            ),
          ),
          AppSpacing.gapLg,
          TextField(
            controller: _notes,
            maxLines: 2,
            decoration: const InputDecoration(hintText: 'Delivery instructions (optional)'),
          ),
          AppSpacing.gapLg,
          const _CodNotice(),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: KawButton(
            label: 'Place order · ₹${total.toStringAsFixed(0)}',
            isLoading: _placing,
            onPressed: _placeOrder,
          ),
        ),
      ),
    );
  }

  Widget _row(String label, String value, {bool bold = false}) {
    final style = bold ? AppTypography.titleMedium : AppTypography.bodyLarge;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [Text(label, style: AppTypography.bodyMedium), Text(value, style: style)],
      ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({required this.summary, required this.onChange});
  final String? summary;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) {
    return KawCard(
      child: Row(
        children: [
          const Icon(Icons.location_on_rounded, color: AppColors.secondary),
          AppSpacing.wGapMd,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Deliver to', style: AppTypography.caption),
                Text(
                  summary ?? 'No address selected',
                  style: AppTypography.bodyLarge,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          TextButton(onPressed: onChange, child: Text(summary == null ? 'Add' : 'Change')),
        ],
      ),
    );
  }
}

class _PrescriptionCard extends StatelessWidget {
  const _PrescriptionCard({required this.attached, required this.uploading, required this.onAttach});
  final bool attached;
  final bool uploading;
  final VoidCallback onAttach;

  @override
  Widget build(BuildContext context) {
    return KawCard(
      border: Border.all(color: AppColors.pharmacy.withValues(alpha: 0.4)),
      child: Row(
        children: [
          const Icon(Icons.medical_information_rounded, color: AppColors.pharmacy),
          AppSpacing.wGapMd,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Prescription', style: AppTypography.label),
                Text(
                  attached
                      ? 'Attached — a pharmacist will verify it.'
                      : 'Required for prescription medicines.',
                  style: AppTypography.caption,
                ),
              ],
            ),
          ),
          uploading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : TextButton(
                  onPressed: onAttach,
                  child: Text(attached ? 'Replace' : 'Attach'),
                ),
        ],
      ),
    );
  }
}

class _CouponCard extends StatelessWidget {
  const _CouponCard({
    required this.controller,
    required this.applying,
    required this.applied,
    required this.message,
    required this.messageIsError,
    required this.onApply,
  });

  final TextEditingController controller;
  final bool applying;
  final bool applied;
  final String? message;
  final bool messageIsError;
  final VoidCallback onApply;

  @override
  Widget build(BuildContext context) {
    return KawCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.local_offer_rounded, color: AppColors.secondary),
              AppSpacing.wGapMd,
              Expanded(
                child: TextField(
                  controller: controller,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                    hintText: 'Coupon code',
                    isDense: true,
                  ),
                ),
              ),
              AppSpacing.wGapSm,
              TextButton(
                onPressed: applying ? null : onApply,
                child: applying
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : Text(applied ? 'Applied' : 'Apply'),
              ),
            ],
          ),
          if (message != null) ...[
            AppSpacing.gapXs,
            Text(
              message!,
              style: AppTypography.caption.copyWith(
                color: messageIsError ? AppColors.error : AppColors.success,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _CodNotice extends StatelessWidget {
  const _CodNotice();
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.payments_rounded, color: AppColors.success, size: 18),
        AppSpacing.wGapSm,
        Expanded(
          child: Text(
            'Cash on Delivery — pay the rider when your order arrives.',
            style: AppTypography.caption,
          ),
        ),
      ],
    );
  }
}
