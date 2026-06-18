import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/providers.dart';
import '../../categories/data/category.dart';
import '../data/catalog_repository.dart';
import '../data/product.dart';

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository(ref.watch(dioProvider));
});

/// Categories, optionally filtered by service type.
final categoriesProvider =
    FutureProvider.family<List<Category>, String?>((ref, serviceType) {
  return ref.watch(catalogRepositoryProvider).categories(serviceType: serviceType);
});

/// Featured products for the home feed.
final featuredProductsProvider =
    FutureProvider.family<List<Product>, String?>((ref, serviceType) {
  return ref.watch(catalogRepositoryProvider).featured(serviceType: serviceType);
});

/// Query parameters for a product listing.
class ProductQuery {
  const ProductQuery({this.serviceType, this.categoryId, this.search});
  final String? serviceType;
  final String? categoryId;
  final String? search;

  @override
  bool operator ==(Object other) =>
      other is ProductQuery &&
      other.serviceType == serviceType &&
      other.categoryId == categoryId &&
      other.search == search;

  @override
  int get hashCode => Object.hash(serviceType, categoryId, search);
}

final productDetailsProvider =
    FutureProvider.family<Product, String>((ref, id) {
  return ref.watch(catalogRepositoryProvider).product(id);
});

/// Paginated product list/search that accumulates pages via [loadMore].
final pagedProductsProvider = AsyncNotifierProvider.autoDispose
    .family<PagedProductsController, List<Product>, ProductQuery>(PagedProductsController.new);

class PagedProductsController
    extends AutoDisposeFamilyAsyncNotifier<List<Product>, ProductQuery> {
  int _page = 1;
  bool hasMore = true;
  bool _loadingMore = false;

  @override
  Future<List<Product>> build(ProductQuery arg) async {
    _page = 1;
    final res = await ref.watch(catalogRepositoryProvider).products(
          serviceType: arg.serviceType,
          categoryId: arg.categoryId,
          search: arg.search,
          page: 1,
        );
    hasMore = res.hasMore;
    return res.items;
  }

  Future<void> loadMore() async {
    if (_loadingMore || !hasMore) return;
    final current = state.valueOrNull;
    if (current == null) return;
    _loadingMore = true;
    try {
      final res = await ref.read(catalogRepositoryProvider).products(
            serviceType: arg.serviceType,
            categoryId: arg.categoryId,
            search: arg.search,
            page: _page + 1,
          );
      _page += 1;
      hasMore = res.hasMore;
      state = AsyncData([...current, ...res.items]);
    } catch (_) {
      // keep current page; the user can retry by scrolling again
    } finally {
      _loadingMore = false;
    }
  }
}
