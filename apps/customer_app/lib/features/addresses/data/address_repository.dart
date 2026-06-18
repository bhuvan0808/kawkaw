import 'package:dio/dio.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/providers/providers.dart';
import 'address.dart';

class AddressRepository {
  AddressRepository(this._dio);

  final Dio _dio;

  Future<List<Address>> list() async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.addresses);
      return unwrap<List<dynamic>>(res)
          .cast<Map<String, dynamic>>()
          .map(Address.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<Address> create(AddressInput input) async {
    try {
      final res = await _dio.post<dynamic>(ApiEndpoints.addresses, data: input.toJson());
      return Address.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<Address> update(String id, AddressInput input) async {
    try {
      final res = await _dio.patch<dynamic>(ApiEndpoints.address(id), data: input.toJson());
      return Address.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> remove(String id) async {
    try {
      await _dio.delete<dynamic>(ApiEndpoints.address(id));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> setDefault(String id) async {
    try {
      await _dio.patch<dynamic>(ApiEndpoints.addressDefault(id));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
