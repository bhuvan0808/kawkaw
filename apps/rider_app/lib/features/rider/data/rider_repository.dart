import 'package:dio/dio.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/providers/providers.dart';
import 'rider_profile.dart';

class RiderNotRegistered implements Exception {}

class RiderRepository {
  RiderRepository(this._dio);
  final Dio _dio;

  /// Returns the rider profile, or null if this account has no rider profile yet.
  Future<RiderProfile?> getMe() async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.riderMe);
      return RiderProfile.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      if (e.response?.statusCode == 404 || e.response?.statusCode == 403) return null;
      throw ApiException.fromDio(e);
    }
  }

  Future<void> register({String? vehicleType, String? vehicleNumber, String? licenseNumber}) async {
    try {
      await _dio.post<dynamic>(ApiEndpoints.riderRegister, data: {
        if (vehicleType != null && vehicleType.isNotEmpty) 'vehicleType': vehicleType,
        if (vehicleNumber != null && vehicleNumber.isNotEmpty) 'vehicleNumber': vehicleNumber,
        if (licenseNumber != null && licenseNumber.isNotEmpty) 'licenseNumber': licenseNumber,
      });
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> setStatus(RiderStatus status) async {
    try {
      await _dio.patch<dynamic>(ApiEndpoints.riderStatus, data: {'status': status.apiValue});
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<EarningsSummary> earningsSummary() async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.riderEarningsSummary);
      return EarningsSummary.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
