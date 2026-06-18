import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/app_config.dart';
import '../../../core/maps/maps.dart';
import '../../../core/navigation/external_navigation.dart';
import '../application/orders_providers.dart';
import '../data/delivery_order.dart';

class ActiveDeliveryScreen extends ConsumerWidget {
  const ActiveDeliveryScreen({super.key, required this.orderId});
  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderDetailProvider(orderId));
    return Scaffold(
      appBar: AppBar(title: const Text('Delivery')),
      body: order.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(orderDetailProvider(orderId))),
        data: (o) => _DeliveryView(order: o),
      ),
    );
  }
}

class _DeliveryView extends ConsumerStatefulWidget {
  const _DeliveryView({required this.order});
  final DeliveryOrder order;

  @override
  ConsumerState<_DeliveryView> createState() => _DeliveryViewState();
}

class _DeliveryViewState extends ConsumerState<_DeliveryView> {
  LatLng? _riderLoc;
  RouteResult? _route;
  bool _busy = false;

  LatLng get _drop => widget.order.address?.latLng ?? AppConfig.launchCityCenter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadRoute());
  }

  Future<void> _loadRoute() async {
    try {
      final loc = await ref.read(locationServiceProvider).currentLocation();
      final route = await ref.read(osrmServiceProvider).route(from: loc, to: _drop);
      if (mounted) {
        setState(() {
          _riderLoc = loc;
          _route = route;
        });
      }
    } catch (_) {
      // Map still shows the drop marker without a route.
    }
  }

  Future<void> _advance() async {
    final repo = ref.read(riderOrdersRepositoryProvider);
    final id = widget.order.id;
    setState(() => _busy = true);
    try {
      switch (widget.order.status) {
        case 'ASSIGNED':
          await repo.accept(id);
        case 'ACCEPTED':
          await repo.pickup(id);
        case 'PICKED_UP':
          await repo.outForDelivery(id);
        case 'OUT_FOR_DELIVERY':
          await repo.deliver(id);
      }
      ref.invalidate(orderDetailProvider(id));
      ref.invalidate(orderQueueProvider);
      if (widget.order.status == 'OUT_FOR_DELIVERY' && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Delivered. COD collected.')));
        context.pop();
      }
    } catch (e) {
      // Re-sync from the server so a stale action button (e.g. status already
      // advanced elsewhere) self-corrects instead of leaving the rider stuck.
      ref.invalidate(orderDetailProvider(id));
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _call() async {
    final phone = widget.order.contactPhone;
    if (phone == null) return;
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  ({String label, IconData icon})? _actionFor(String status) => switch (status) {
        'ASSIGNED' => (label: 'Accept order', icon: Icons.check_rounded),
        'ACCEPTED' => (label: 'Confirm pickup', icon: Icons.shopping_bag_rounded),
        'PICKED_UP' => (label: 'Start delivery', icon: Icons.delivery_dining_rounded),
        'OUT_FOR_DELIVERY' => (label: 'Mark delivered · collect COD', icon: Icons.done_all_rounded),
        _ => null,
      };

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final action = _actionFor(order.status);
    return Column(
      children: [
        Expanded(
          child: Stack(
            children: [
              FlutterMap(
                options: MapOptions(initialCenter: _riderLoc ?? _drop, initialZoom: 14),
                children: [
                  TileLayer(urlTemplate: AppConfig.osmTileUrl, userAgentPackageName: AppConfig.osmUserAgent),
                  if (_route != null)
                    PolylineLayer(polylines: [
                      Polyline(points: _route!.points, strokeWidth: 4, color: AppColors.secondary),
                    ]),
                  MarkerLayer(markers: [
                    Marker(
                      point: _drop,
                      width: 44,
                      height: 44,
                      child: const Icon(Icons.location_on, color: AppColors.success, size: 40),
                    ),
                    if (_riderLoc != null)
                      Marker(
                        point: _riderLoc!,
                        width: 44,
                        height: 44,
                        child: const Icon(Icons.delivery_dining_rounded, color: AppColors.secondary, size: 36),
                      ),
                  ]),
                ],
              ),
              if (_route != null)
                Positioned(
                  top: AppSpacing.md,
                  left: AppSpacing.md,
                  child: KawBadge(
                    label: '${_route!.distanceKm.toStringAsFixed(1)} km · ${_route!.durationMinutes} min',
                    icon: Icons.route_rounded,
                  ),
                ),
              Positioned(
                right: AppSpacing.md,
                bottom: AppSpacing.md,
                child: FloatingActionButton.extended(
                  heroTag: 'nav',
                  backgroundColor: AppColors.secondary,
                  foregroundColor: AppColors.onSecondary,
                  onPressed: () => ExternalNavigation.openChooser(context, _drop.latitude, _drop.longitude),
                  icon: const Icon(Icons.navigation_rounded),
                  label: const Text('Navigate'),
                ),
              ),
            ],
          ),
        ),
        _Panel(order: order, busy: _busy, action: action, onAdvance: _advance, onCall: _call),
      ],
    );
  }
}

class _Panel extends StatelessWidget {
  const _Panel({required this.order, required this.busy, required this.action, required this.onAdvance, required this.onCall});

  final DeliveryOrder order;
  final bool busy;
  final ({String label, IconData icon})? action;
  final VoidCallback onAdvance;
  final VoidCallback onCall;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: const BoxDecoration(color: AppColors.surface, boxShadow: AppElevation.medium),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(order.contactName, style: AppTypography.titleMedium),
                      Text(order.address?.summary ?? '', style: AppTypography.caption, maxLines: 2),
                    ],
                  ),
                ),
                if (order.contactPhone != null)
                  IconButton.filled(
                    onPressed: onCall,
                    icon: const Icon(Icons.call_rounded),
                    style: IconButton.styleFrom(backgroundColor: AppColors.success, foregroundColor: AppColors.onSecondary),
                  ),
              ],
            ),
            AppSpacing.gapMd,
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${order.items.length} item(s)', style: AppTypography.bodyMedium),
                Text('Collect ₹${order.total.toStringAsFixed(0)} (COD)', style: AppTypography.label),
              ],
            ),
            if (order.notes != null && order.notes!.isNotEmpty) ...[
              AppSpacing.gapSm,
              Text('Note: ${order.notes}', style: AppTypography.caption),
            ],
            AppSpacing.gapLg,
            if (action != null)
              KawButton(label: action!.label, icon: action!.icon, isLoading: busy, onPressed: onAdvance)
            else
              const Center(child: KawBadge(label: 'Delivered', color: AppColors.success)),
          ],
        ),
      ),
    );
  }
}
