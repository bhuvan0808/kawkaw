import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../application/catalog_providers.dart';
import 'product_grid_tile.dart';

/// Infinite-scroll product grid backed by [pagedProductsProvider].
class PaginatedProductGrid extends ConsumerStatefulWidget {
  const PaginatedProductGrid({super.key, required this.query, this.emptyTitle = 'No products here yet'});

  final ProductQuery query;
  final String emptyTitle;

  @override
  ConsumerState<PaginatedProductGrid> createState() => _PaginatedProductGridState();
}

class _PaginatedProductGridState extends ConsumerState<PaginatedProductGrid> {
  final _scroll = ScrollController();

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 400) {
      ref.read(pagedProductsProvider(widget.query).notifier).loadMore();
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(pagedProductsProvider(widget.query));
    return async.when(
      loading: () => const LoadingView(),
      error: (e, _) =>
          ErrorView(message: '$e', onRetry: () => ref.invalidate(pagedProductsProvider(widget.query))),
      data: (items) {
        if (items.isEmpty) {
          return EmptyView(
            title: widget.emptyTitle,
            message: 'Please check back soon.',
            icon: Icons.shopping_bag_outlined,
          );
        }
        final hasMore = ref.read(pagedProductsProvider(widget.query).notifier).hasMore;
        final crossAxisCount = MediaQuery.sizeOf(context).width >= 600 ? 3 : 2;
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(pagedProductsProvider(widget.query)),
          child: CustomScrollView(
            controller: _scroll,
            slivers: [
              SliverPadding(
                padding: AppSpacing.page,
                sliver: SliverGrid(
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: AppSpacing.md,
                    mainAxisSpacing: AppSpacing.md,
                    childAspectRatio: 0.62,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (_, i) => ProductGridTile(product: items[i]),
                    childCount: items.length,
                  ),
                ),
              ),
              if (hasMore)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.lg),
                    child: Center(child: CircularProgressIndicator(color: AppColors.secondary)),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
