import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/providers/providers.dart';

class CouponResult {
  const CouponResult({required this.code, required this.discount});
  final String code;
  final double discount;
}

class CouponsRepository {
  CouponsRepository(this._dio);
  final Dio _dio;

  /// Validates a coupon against a subtotal; throws [ApiException] with the
  /// server's reason (e.g. min-order, expired) if not applicable.
  Future<CouponResult> validate({
    required String code,
    required double subtotal,
    String? serviceType,
  }) async {
    try {
      final res = await _dio.post<dynamic>(
        ApiEndpoints.validateCoupon,
        data: {
          'code': code,
          'subtotal': subtotal,
          if (serviceType != null) 'serviceType': serviceType,
        },
      );
      final data = unwrap<Map<String, dynamic>>(res);
      return CouponResult(
        code: data['code'] as String,
        discount: num.parse(data['discount'].toString()).toDouble(),
      );
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final couponsRepositoryProvider = Provider<CouponsRepository>((ref) {
  return CouponsRepository(ref.watch(dioProvider));
});
