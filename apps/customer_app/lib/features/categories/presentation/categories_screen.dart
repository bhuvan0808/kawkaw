import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../core/router/routes.dart';
import '../../products/application/catalog_providers.dart';

final _serviceFilterProvider = StateProvider.autoDispose<KawService?>((ref) => null);

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(_serviceFilterProvider);
    final categories = ref.watch(categoriesProvider(selected?.apiValue));

    return Scaffold(
      appBar: AppBar(title: const Text('Categories')),
      body: Column(
        children: [
          SizedBox(
            height: 52,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: AppSpacing.page,
              children: [
                _Filter(
                  label: 'All',
                  selected: selected == null,
                  onTap: () => ref.read(_serviceFilterProvider.notifier).state = null,
                ),
                AppSpacing.wGapSm,
                for (final s in KawService.values.where((s) => s != KawService.parcel)) ...[
                  ServiceChip(
                    service: s,
                    selected: selected == s,
                    onTap: () => ref.read(_serviceFilterProvider.notifier).state = s,
                  ),
                  AppSpacing.wGapSm,
                ],
              ],
            ),
          ),
          Expanded(
            child: categories.when(
              loading: () => const LoadingView(),
              error: (e, _) => ErrorView(
                message: '$e',
                onRetry: () => ref.invalidate(categoriesProvider(selected?.apiValue)),
              ),
              data: (list) => list.isEmpty
                  ? const EmptyView(title: 'No categories', icon: Icons.category_outlined)
                  : GridView.builder(
                      padding: AppSpacing.page,
                      itemCount: list.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: AppSpacing.md,
                        mainAxisSpacing: AppSpacing.lg,
                        childAspectRatio: 0.78,
                      ),
                      itemBuilder: (_, i) => CategoryCard(
                        name: list[i].name,
                        imageUrl: list[i].imageUrl,
                        onTap: () => context.push(
                          '${Routes.products}?categoryId=${list[i].id}&title=${Uri.encodeComponent(list[i].name)}',
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Filter extends StatelessWidget {
  const _Filter({required this.label, required this.selected, required this.onTap});
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
    );
  }
}
