import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_endpoints.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/network/paginated.dart';
import '../../../core/providers/providers.dart';
import '../data/app_notification.dart';

class NotificationsRepository {
  NotificationsRepository(this._dio);
  final Dio _dio;

  Future<Paginated<AppNotification>> list({int page = 1}) async {
    try {
      final res = await _dio.get<dynamic>(
        ApiEndpoints.notifications,
        queryParameters: {'page': page, 'pageSize': 30},
      );
      return Paginated.fromJson(unwrap<Map<String, dynamic>>(res), AppNotification.fromJson);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> markRead(String id) => _dio.patch<dynamic>(ApiEndpoints.notificationRead(id));
  Future<void> markAllRead() => _dio.patch<dynamic>(ApiEndpoints.notificationsReadAll);

  Future<int> unreadCount() async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.notificationsUnread);
      return unwrap<Map<String, dynamic>>(res)['unread'] as int? ?? 0;
    } on DioException {
      return 0;
    }
  }
}

final notificationsRepositoryProvider = Provider<NotificationsRepository>((ref) {
  return NotificationsRepository(ref.watch(dioProvider));
});

final notificationsProvider =
    FutureProvider.autoDispose<Paginated<AppNotification>>((ref) {
  return ref.watch(notificationsRepositoryProvider).list();
});

final unreadCountProvider = FutureProvider.autoDispose<int>((ref) {
  return ref.watch(notificationsRepositoryProvider).unreadCount();
});
