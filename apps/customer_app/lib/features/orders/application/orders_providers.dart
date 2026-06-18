import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/providers/providers.dart';
import '../data/order.dart';
import '../data/orders_repository.dart';

final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  return OrdersRepository(ref.watch(dioProvider));
});

final orderDetailsProvider = FutureProvider.autoDispose.family<Order, String>((ref, id) {
  return ref.watch(ordersRepositoryProvider).getById(id);
});

/// Paginated order history that accumulates pages via [loadMore].
final pagedOrdersProvider =
    AsyncNotifierProvider.autoDispose<PagedOrdersController, List<Order>>(PagedOrdersController.new);

class PagedOrdersController extends AutoDisposeAsyncNotifier<List<Order>> {
  int _page = 1;
  bool hasMore = true;
  bool _loadingMore = false;

  @override
  Future<List<Order>> build() async {
    _page = 1;
    final res = await ref.watch(ordersRepositoryProvider).myOrders(page: 1);
    hasMore = res.hasMore;
    return res.items;
  }

  Future<void> loadMore() async {
    if (_loadingMore || !hasMore) return;
    final current = state.valueOrNull;
    if (current == null) return;
    _loadingMore = true;
    try {
      final res = await ref.read(ordersRepositoryProvider).myOrders(page: _page + 1);
      _page += 1;
      hasMore = res.hasMore;
      state = AsyncData([...current, ...res.items]);
    } catch (_) {
      // keep current page
    } finally {
      _loadingMore = false;
    }
  }
}
