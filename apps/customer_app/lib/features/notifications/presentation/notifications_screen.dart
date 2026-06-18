import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

import '../application/notifications_providers.dart';
import '../data/app_notification.dart';

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
              ref.invalidate(unreadCountProvider);
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
                message: 'Order updates and offers will show up here.',
                icon: Icons.notifications_off_outlined,
              )
            : ListView.separated(
                padding: const EdgeInsets.all(AppSpacing.lg),
                itemCount: page.items.length,
                separatorBuilder: (_, __) => AppSpacing.gapMd,
                itemBuilder: (_, i) => _NotificationTile(item: page.items[i]),
              ),
      ),
    );
  }
}

class _NotificationTile extends ConsumerWidget {
  const _NotificationTile({required this.item});
  final AppNotification item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return KawCard(
      color: item.isRead ? AppColors.surface : AppColors.surfaceVariant,
      onTap: item.isRead
          ? null
          : () async {
              await ref.read(notificationsRepositoryProvider).markRead(item.id);
              ref.invalidate(notificationsProvider);
              ref.invalidate(unreadCountProvider);
            },
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            item.type == 'PROMOTION' ? Icons.local_offer_rounded : Icons.notifications_rounded,
            color: AppColors.secondary,
          ),
          AppSpacing.wGapMd,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.title, style: AppTypography.label),
                AppSpacing.gapXs,
                Text(item.body, style: AppTypography.bodyMedium),
                AppSpacing.gapXs,
                Text(
                  DateFormat('d MMM, h:mm a').format(item.createdAt.toLocal()),
                  style: AppTypography.caption,
                ),
              ],
            ),
          ),
          if (!item.isRead)
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(color: AppColors.secondary, shape: BoxShape.circle),
            ),
        ],
      ),
    );
  }
}
