import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/config/app_config.dart';
import '../../../core/maps/geo_models.dart';
import '../../../core/maps/location_service.dart';
import '../../../core/maps/map_providers.dart';

/// Full-screen map picker. Pops a [GeoPlace] for the chosen location.
class AddressPickerScreen extends ConsumerStatefulWidget {
  const AddressPickerScreen({super.key, this.initial});

  final LatLng? initial;

  @override
  ConsumerState<AddressPickerScreen> createState() => _AddressPickerScreenState();
}

class _AddressPickerScreenState extends ConsumerState<AddressPickerScreen> {
  final _mapController = MapController();
  late LatLng _center = widget.initial ?? AppConfig.launchCityCenter;
  GeoPlace? _place;
  bool _resolving = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _resolve(_center));
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _mapController.dispose();
    super.dispose();
  }

  void _onPositionChanged(MapCamera camera, bool hasGesture) {
    _center = camera.center;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), () => _resolve(_center));
  }

  Future<void> _resolve(LatLng point) async {
    setState(() => _resolving = true);
    try {
      final place = await ref.read(nominatimServiceProvider).reverse(point);
      if (mounted) {
        setState(() {
          _place = place ?? GeoPlace(displayName: 'Pinned location', location: point);
          _resolving = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _place = GeoPlace(displayName: 'Pinned location', location: point);
          _resolving = false;
        });
      }
    }
  }

  Future<void> _useCurrentLocation() async {
    try {
      final loc = await ref.read(locationServiceProvider).currentLocation();
      _mapController.move(loc, 16);
      await _resolve(loc);
    } on LocationDeniedException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pin your location')),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _center,
              initialZoom: 16,
              onPositionChanged: _onPositionChanged,
            ),
            children: [
              TileLayer(
                urlTemplate: AppConfig.osmTileUrl,
                userAgentPackageName: AppConfig.osmUserAgent,
              ),
            ],
          ),
          // Fixed centre pin (map moves underneath).
          const IgnorePointer(
            child: Center(
              child: Padding(
                padding: EdgeInsets.only(bottom: 36),
                child: Icon(Icons.location_on, size: 44, color: AppColors.secondary),
              ),
            ),
          ),
          Positioned(
            right: AppSpacing.lg,
            bottom: 180,
            child: FloatingActionButton.small(
              heroTag: 'locate',
              onPressed: _useCurrentLocation,
              child: const Icon(Icons.my_location_rounded),
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: _ConfirmPanel(
              place: _place,
              resolving: _resolving,
              onConfirm: _place == null ? null : () => Navigator.pop(context, _place),
            ),
          ),
        ],
      ),
    );
  }
}

class _ConfirmPanel extends StatelessWidget {
  const _ConfirmPanel({required this.place, required this.resolving, required this.onConfirm});

  final GeoPlace? place;
  final bool resolving;
  final VoidCallback? onConfirm;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(AppSpacing.lg),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          borderRadius: AppRadius.brLg,
          boxShadow: AppElevation.high,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Delivering to', style: AppTypography.caption),
            AppSpacing.gapXs,
            resolving
                ? const Skeleton(height: 18)
                : Text(
                    place?.displayName ?? 'Move the map to pick a spot',
                    style: AppTypography.bodyLarge,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
            AppSpacing.gapLg,
            KawButton(label: 'Confirm location', onPressed: onConfirm),
          ],
        ),
      ),
    );
  }
}
