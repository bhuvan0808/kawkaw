import 'package:dio/dio.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/paginated.dart';
import '../../../core/providers/providers.dart';
import '../../categories/data/category.dart';
import 'product.dart';

class CatalogRepository {
  CatalogRepository(this._dio);

  final Dio _dio;

  Future<List<Category>> categories({String? serviceType}) async {
    try {
      final res = await _dio.get<dynamic>(
        ApiEndpoints.categories,
        queryParameters: {if (serviceType != null) 'serviceType': serviceType},
      );
      return unwrap<List<dynamic>>(res)
          .cast<Map<String, dynamic>>()
          .map(Category.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<List<Product>> featured({String? serviceType}) async {
    try {
      final res = await _dio.get<dynamic>(
        ApiEndpoints.featuredProducts,
        queryParameters: {if (serviceType != null) 'serviceType': serviceType},
      );
      return unwrap<List<dynamic>>(res)
          .cast<Map<String, dynamic>>()
          .map(Product.fromJson)
          .toList();
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<Paginated<Product>> products({
    String? serviceType,
    String? categoryId,
    String? search,
    int page = 1,
    int pageSize = 20,
  }) async {
    try {
      final res = await _dio.get<dynamic>(
        ApiEndpoints.products,
        queryParameters: {
          'page': page,
          'pageSize': pageSize,
          if (serviceType != null) 'serviceType': serviceType,
          if (categoryId != null) 'categoryId': categoryId,
          if (search != null && search.isNotEmpty) 'search': search,
        },
      );
      return Paginated.fromJson(unwrap<Map<String, dynamic>>(res), Product.fromJson);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<Product> product(String id) async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.product(id));
      return Product.fromJson(unwrap<Map<String, dynamic>>(res));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}
