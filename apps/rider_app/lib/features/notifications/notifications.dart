import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../../core/network/api_endpoints.dart';
import '../../core/network/api_exception.dart';
import '../../core/network/paginated.dart';
import '../../core/providers/providers.dart';

class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.isRead,
    required this.createdAt,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final bool isRead;
  final DateTime createdAt;

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: j['id'] as String,
        type: j['type'] as String? ?? 'SYSTEM',
        title: j['title'] as String? ?? '',
        body: j['body'] as String? ?? '',
        isRead: j['isRead'] as bool? ?? false,
        createdAt: DateTime.parse(j['createdAt'] as String),
      );
}

class NotificationsRepository {
  NotificationsRepository(this._dio);
  final Dio _dio;

  Future<Paginated<AppNotification>> list() async {
    try {
      final res = await _dio.get<dynamic>(ApiEndpoints.notifications, queryParameters: {'page': 1, 'pageSize': 30});
      return Paginated.fromJson(unwrap<Map<String, dynamic>>(res), AppNotification.fromJson);
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Future<void> markAllRead() => _dio.patch<dynamic>(ApiEndpoints.notificationsReadAll);
}

final notificationsRepositoryProvider =
    Provider<NotificationsRepository>((ref) => NotificationsRepository(ref.watch(dioProvider)));

final notificationsProvider =
    FutureProvider.autoDispose<Paginated<AppNotification>>((ref) => ref.watch(notificationsRepositoryProvider).list());

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(notificationsRepositoryProvider).markAllRead();
              ref.invalidate(notificationsProvider);
            },
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: notifications.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(notificationsProvider)),
        data: (page) => page.items.isEmpty
            ? const EmptyView(
                title: 'No notifications',
                message: 'Assignment and system alerts appear here.',
                icon: Icons.notifications_off_outlined,
              )
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.lg),
                itemCount: page.items.length,
                separatorBuilder: (_, __) => AppSpacing.gapMd,
                itemBuilder: (_, i) {
                  final n = page.items[i];
                  return KawCard(
                    color: n.isRead ? AppColors.surface : AppColors.surfaceVariant,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(n.title, style: AppTypography.label),
                        AppSpacing.gapXs,
                        Text(n.body, style: AppTypography.bodyMedium),
                        AppSpacing.gapXs,
                        Text(DateFormat('d MMM, h:mm a').format(n.createdAt.toLocal()), style: AppTypography.caption),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }
}
