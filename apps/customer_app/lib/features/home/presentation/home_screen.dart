import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../../core/router/routes.dart';
import '../../auth/application/auth_controller.dart';
import '../../notifications/application/notifications_providers.dart';
import '../../products/application/catalog_providers.dart';
import '../../products/presentation/widgets/product_grid_tile.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).user;
    final categories = ref.watch(categoriesProvider(null));
    final featured = ref.watch(featuredProductsProvider(null));

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(categoriesProvider(null));
            ref.invalidate(featuredProductsProvider(null));
          },
          child: ListView(
            padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
            children: [
              _Header(name: user?.displayName ?? 'there'),
              Padding(
                padding: AppSpacing.page,
                child: _SearchBar(onTap: () => context.push(Routes.search)),
              ),
              AppSpacing.gapLg,
              const _ServicesRow(),
              AppSpacing.gapXl,
              Padding(
                padding: AppSpacing.page,
                child: SectionHeader(
                  title: 'Shop by category',
                  actionLabel: 'See all',
                  onAction: () => context.go(Routes.categories),
                ),
              ),
              AppSpacing.gapSm,
              SizedBox(
                height: 132,
                child: categories.when(
                  loading: () => const _RailSkeleton(),
                  error: (e, _) => _InlineError(message: '$e'),
                  data: (list) => ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: AppSpacing.page,
                    itemCount: list.length,
                    separatorBuilder: (_, __) => AppSpacing.wGapMd,
                    itemBuilder: (_, i) => SizedBox(
                      width: 92,
                      child: CategoryCard(
                        name: list[i].name,
                        imageUrl: list[i].imageUrl,
                        onTap: () => context.push(
                          '${Routes.products}?categoryId=${list[i].id}&title=${Uri.encodeComponent(list[i].name)}',
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              AppSpacing.gapXl,
              Padding(
                padding: AppSpacing.page,
                child: const SectionHeader(title: 'Featured'),
              ),
              AppSpacing.gapSm,
              featured.when(
                loading: () => const Padding(
                  padding: EdgeInsets.all(AppSpacing.xxl),
                  child: LoadingView(),
                ),
                error: (e, _) => _InlineError(message: '$e'),
                data: (list) => list.isEmpty
                    ? const Padding(
                        padding: EdgeInsets.all(AppSpacing.xxl),
                        child: EmptyView(
                          title: 'Nothing featured yet',
                          message: 'Check back soon for offers.',
                          icon: Icons.star_outline_rounded,
                        ),
                      )
                    : GridView.builder(
                        padding: AppSpacing.page,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: list.length,
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: AppSpacing.md,
                          mainAxisSpacing: AppSpacing.md,
                          childAspectRatio: 0.62,
                        ),
                        itemBuilder: (_, i) => ProductGridTile(product: list[i]),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Header extends ConsumerWidget {
  const _Header({required this.name});
  final String name;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unread = ref.watch(unreadCountProvider).valueOrNull ?? 0;
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.md, AppSpacing.lg, AppSpacing.sm),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on_rounded, size: 16, color: AppColors.secondary),
                    AppSpacing.wGapXs,
                    Text('Bhadrachalam', style: AppTypography.label),
                  ],
                ),
                Text('Hi, $name', style: AppTypography.caption),
              ],
            ),
          ),
          IconButton(
            onPressed: () => context.push(Routes.notifications),
            icon: Badge(
              isLabelVisible: unread > 0,
              label: Text('$unread'),
              child: const Icon(Icons.notifications_none_rounded),
            ),
          ),
          IconButton(
            onPressed: () => context.push(Routes.cart),
            icon: const Icon(Icons.shopping_cart_outlined),
          ),
        ],
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return KawCard(
      onTap: onTap,
      color: AppColors.surfaceVariant,
      elevated: false,
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.lg),
      child: Row(
        children: [
          const Icon(Icons.search_rounded, color: AppColors.textTertiary),
          AppSpacing.wGapMd,
          Text('Search for items, brands and more', style: AppTypography.bodyMedium),
        ],
      ),
    );
  }
}

class _ServicesRow extends StatelessWidget {
  const _ServicesRow();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: AppSpacing.page,
      child: Wrap(
        spacing: AppSpacing.sm,
        runSpacing: AppSpacing.sm,
        // Parcel booking is not part of the V1 customer app (no product catalogue).
        children: KawService.values
            .where((s) => s != KawService.parcel)
            .map(
              (s) => ServiceChip(
                service: s,
                onTap: () => context.push(
                  '${Routes.products}?serviceType=${s.apiValue}&title=${Uri.encodeComponent(s.label)}',
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _RailSkeleton extends StatelessWidget {
  const _RailSkeleton();
  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: AppSpacing.page,
      itemCount: 5,
      separatorBuilder: (_, __) => AppSpacing.wGapMd,
      itemBuilder: (_, __) => const SizedBox(
        width: 92,
        child: Skeleton(height: 92, borderRadius: AppRadius.brLg),
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: AppSpacing.page,
      child: Text(message, style: AppTypography.caption.copyWith(color: AppColors.error)),
    );
  }
}
