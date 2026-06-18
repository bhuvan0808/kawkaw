import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/providers/providers.dart';
import '../data/delivery_order.dart';

class RiderOrdersRepository {
  RiderOrdersRepository(this._dio);
  final Dio _dio;

  Future<List<DeliveryOrder>> queue() async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.orderQueue);
      return unwrap<List<dynamic>>(res)
          .cast<Map<String, dynamic>>()
          .map(DeliveryOrder.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<DeliveryOrder> getById(String id) async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.order(id));
      return DeliveryOrder.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<DeliveryOrder> _action(String path, {Map<String, dynamic>? body}) async {
    try {
      final res = await _dio.post<dynamic>(path, data: body);
      return DeliveryOrder.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<DeliveryOrder> accept(String id) => _action(ApiEndpoints.acceptOrder(id));
  Future<DeliveryOrder> reject(String id, String reason) =>
      _action(ApiEndpoints.rejectOrder(id), body: {'reason': reason});
  Future<DeliveryOrder> pickup(String id) => _action(ApiEndpoints.pickupOrder(id));
  Future<DeliveryOrder> outForDelivery(String id) => _action(ApiEndpoints.outForDeliveryOrder(id));
  Future<DeliveryOrder> deliver(String id) => _action(ApiEndpoints.deliverOrder(id));
}

final riderOrdersRepositoryProvider = Provider<RiderOrdersRepository>((ref) {
  return RiderOrdersRepository(ref.watch(dioProvider));
});

/// The rider's active queue (assigned/accepted/picked-up/out-for-delivery).
final orderQueueProvider = FutureProvider.autoDispose<List<DeliveryOrder>>((ref) {
  return ref.watch(riderOrdersRepositoryProvider).queue();
});

final orderDetailProvider =
    FutureProvider.autoDispose.family<DeliveryOrder, String>((ref, id) {
  return ref.watch(riderOrdersRepositoryProvider).getById(id);
});
