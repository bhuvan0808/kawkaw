import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/app_config.dart';
import '../../../core/maps/geo_models.dart';
import '../../../core/maps/map_providers.dart';
import '../../../core/providers/providers.dart';
import '../../../core/realtime/realtime_service.dart';
import '../application/orders_providers.dart';
import '../data/order.dart';

class OrderTrackingScreen extends ConsumerWidget {
  const OrderTrackingScreen({super.key, required this.orderId});
  final String orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderDetailsProvider(orderId));
    return Scaffold(
      appBar: AppBar(title: const Text('Live tracking')),
      body: order.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(message: '$e', onRetry: () => ref.invalidate(orderDetailsProvider(orderId))),
        data: (o) => _TrackingView(order: o),
      ),
    );
  }
}

class _TrackingView extends ConsumerStatefulWidget {
  const _TrackingView({required this.order});
  final Order order;

  @override
  ConsumerState<_TrackingView> createState() => _TrackingViewState();
}

class _TrackingViewState extends ConsumerState<_TrackingView> {
  final _rt = RealtimeService();
  final _mapController = MapController();

  late LatLng _delivery;
  LatLng? _rider;
  late String _status;
  RouteResult? _route;
  int? _eta;
  double? _distanceKm;
  Timer? _routeDebounce;
  final List<StreamSubscription<dynamic>> _subs = [];

  @override
  void initState() {
    super.initState();
    _status = widget.order.status;
    _delivery = LatLng(
      widget.order.deliveryLatitude ?? AppConfig.launchCityCenter.latitude,
      widget.order.deliveryLongitude ?? AppConfig.launchCityCenter.longitude,
    );
    final r = widget.order.rider;
    if (r?.latitude != null && r?.longitude != null) {
      _rider = LatLng(r!.latitude!, r.longitude!);
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _connect());
  }

  Future<void> _connect() async {
    final token = await ref.read(tokenStorageProvider).accessToken;
    if (token == null) return;
    _rt.connect(token);
    _rt.subscribeToOrder(widget.order.id);
    _subs.add(_rt.riderLocation.listen((e) {
      setState(() => _rider = LatLng(e.latitude, e.longitude));
      _scheduleRoute();
    }));
    _subs.add(_rt.orderStatus.listen((e) {
      if (e.orderId == widget.order.id) {
        setState(() => _status = e.status);
        ref.invalidate(orderDetailsProvider(widget.order.id));
      }
    }));
    _scheduleRoute();
  }

  void _scheduleRoute() {
    _routeDebounce?.cancel();
    _routeDebounce = Timer(const Duration(seconds: 3), _recomputeRoute);
  }

  Future<void> _recomputeRoute() async {
    if (_rider == null) return;
    try {
      final route = await ref.read(osrmServiceProvider).route(from: _rider!, to: _delivery);
      if (mounted && route != null) {
        setState(() {
          _route = route;
          _eta = route.durationMinutes;
          _distanceKm = route.distanceKm;
        });
      }
    } catch (_) {/* keep last known */}
  }

  Future<void> _callRider() async {
    final phone = widget.order.rider?.phone;
    if (phone == null) return;
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  void dispose() {
    _routeDebounce?.cancel();
    for (final s in _subs) {
      s.cancel();
    }
    _rt.dispose();
    _mapController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final statusLabel = KawOrderStatusX.fromApi(_status).label;
    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _rider ?? _delivery,
            initialZoom: 14,
          ),
          children: [
            TileLayer(
              urlTemplate: AppConfig.osmTileUrl,
              userAgentPackageName: AppConfig.osmUserAgent,
            ),
            if (_route != null)
              PolylineLayer(
                polylines: [
                  Polyline(points: _route!.points, strokeWidth: 4, color: AppColors.secondary),
                ],
              ),
            MarkerLayer(
              markers: [
                Marker(
                  point: _delivery,
                  width: 44,
                  height: 44,
                  child: const Icon(Icons.home_rounded, color: AppColors.success, size: 36),
                ),
                if (_rider != null)
                  Marker(
                    point: _rider!,
                    width: 48,
                    height: 48,
                    child: const Icon(Icons.delivery_dining_rounded, color: AppColors.secondary, size: 40),
                  ),
              ],
            ),
          ],
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: RiderTrackingCard(
            riderName: widget.order.rider?.name ?? 'Awaiting rider',
            vehicle: widget.order.rider?.vehicleType,
            statusLabel: statusLabel,
            etaMinutes: _eta,
            distanceKm: _distanceKm,
            onCall: widget.order.rider?.phone == null ? null : _callRider,
          ),
        ),
      ],
    );
  }
}
