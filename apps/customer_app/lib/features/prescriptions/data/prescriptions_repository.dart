import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/providers/providers.dart';

class PrescriptionsRepository {
  PrescriptionsRepository(this._dio);

  final Dio _dio;

  /// Uploads a prescription image and returns its id (used at checkout).
  Future<String> upload(String filePath) async {
    try {
      final form = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
      });
      final res = await _dio.post<dynamic>(ApiEndpoints.prescriptionUpload, data: form);
      return unwrap<Map<String, dynamic>>(res)['id'] as String;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final prescriptionsRepositoryProvider = Provider<PrescriptionsRepository>((ref) {
  return PrescriptionsRepository(ref.watch(dioProvider));
});
