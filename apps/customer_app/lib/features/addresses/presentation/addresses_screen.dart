import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../core/router/routes.dart';
import '../application/address_controller.dart';
import '../data/address.dart';

class AddressesScreen extends ConsumerWidget {
  const AddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addresses = ref.watch(addressControllerProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My addresses')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push(Routes.addressForm),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add address'),
        backgroundColor: AppColors.secondary,
        foregroundColor: AppColors.onSecondary,
      ),
      body: addresses.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(addressControllerProvider)),
        data: (list) => list.isEmpty
            ? EmptyView(
                title: 'No saved addresses',
                message: 'Add an address to get started.',
                icon: Icons.location_off_outlined,
                actionLabel: 'Add address',
                onAction: () => context.push(Routes.addressForm),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.lg),
                itemCount: list.length,
                separatorBuilder: (_, __) => AppSpacing.gapMd,
                itemBuilder: (_, i) => _AddressTile(address: list[i]),
              ),
      ),
    );
  }
}

class _AddressTile extends ConsumerWidget {
  const _AddressTile({required this.address});
  final Address address;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return KawCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            address.type == 'WORK' ? Icons.work_rounded : Icons.home_rounded,
            color: AppColors.secondary,
          ),
          AppSpacing.wGapMd,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(address.type, style: AppTypography.label),
                    if (address.isDefault) ...[
                      AppSpacing.wGapSm,
                      const KawBadge(label: 'Default', color: AppColors.success),
                    ],
                  ],
                ),
                AppSpacing.gapXs,
                Text(address.summary, style: AppTypography.bodyMedium),
              ],
            ),
          ),
          PopupMenuButton<String>(
            onSelected: (value) async {
              final controller = ref.read(addressControllerProvider.notifier);
              switch (value) {
                case 'edit':
                  context.push(Routes.addressForm, extra: address);
                case 'default':
                  await controller.setDefault(address.id);
                case 'delete':
                  await controller.remove(address.id);
              }
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'edit', child: Text('Edit')),
              if (!address.isDefault)
                const PopupMenuItem(value: 'default', child: Text('Set as default')),
              const PopupMenuItem(value: 'delete', child: Text('Delete')),
            ],
          ),
        ],
      ),
    );
  }
}
