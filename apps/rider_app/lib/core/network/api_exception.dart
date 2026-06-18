import 'package:dio/dio.dart';

/// Normalised API error mapped from the backend's standard error envelope.
class ApiException implements Exception {
  ApiException({required this.message, this.statusCode, this.errorCode, this.details});

  final String message;
  final int? statusCode;
  final String? errorCode;
  final Object? details;

  bool get isUnauthorized => statusCode == 401;
  bool get isNetwork => statusCode == null;

  factory ApiException.fromDio(DioException e) {
    final response = e.response;
    if (response != null && response.data is Map) {
      final data = response.data as Map;
      final dynamic msg = data['message'];
      return ApiException(
        statusCode: response.statusCode,
        errorCode: data['errorCode']?.toString(),
        message: msg is List ? msg.join(', ') : (msg?.toString() ?? 'Request failed.'),
        details: data['details'],
      );
    }
    final friendly = switch (e.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout =>
        'The connection timed out. Please try again.',
      DioExceptionType.connectionError => 'Cannot reach Kaw Kaw. Check your internet connection.',
      _ => 'Something went wrong. Please try again.',
    };
    return ApiException(message: friendly, statusCode: response?.statusCode);
  }

  @override
  String toString() => message;
}
