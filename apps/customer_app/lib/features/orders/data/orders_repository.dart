import 'package:dio/dio.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/paginated.dart';
import '../../../core/providers/providers.dart';
import 'order.dart';

/// A single line in a create-order request.
class OrderLineInput {
  const OrderLineInput({required this.productId, required this.quantity});
  final String productId;
  final int quantity;
  Map<String, dynamic> toJson() => {'productId': productId, 'quantity': quantity};
}

class OrdersRepository {
  OrdersRepository(this._dio);

  final Dio _dio;

  Future<Paginated<Order>> myOrders({int page = 1}) async {
    try {
      final res = await _dio.get<dynamic>(
        ApiEndpoints.orders,
        queryParameters: {'page': page, 'pageSize': 20},
      );
      return Paginated.fromJson(unwrap<Map<String, dynamic>>(res), Order.fromJson);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<Order> getById(String id) async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.order(id));
      return Order.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<Order> create({
    required String addressId,
    required String serviceType,
    required List<OrderLineInput> items,
    String? couponCode,
    String? notes,
    String? prescriptionId,
  }) async {
    try {
      final res = await _dio.post<dynamic>(
        ApiEndpoints.orders,
        data: {
          'addressId': addressId,
          'serviceType': serviceType,
          'items': items.map((i) => i.toJson()).toList(),
          if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
          if (notes != null && notes.isNotEmpty) 'notes': notes,
          if (prescriptionId != null) 'prescriptionId': prescriptionId,
        },
      );
      return Order.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<Order> cancel(String id, String reason) async {
    try {
      final res = await _dio.post<dynamic>(ApiEndpoints.cancelOrder(id), data: {'reason': reason});
      return Order.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
