import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/app_config.dart';

/// Realtime event payloads.
class OrderStatusEvent {
  OrderStatusEvent({required this.orderId, required this.status});
  final String orderId;
  final String status;
}

class RiderLocationEvent {
  RiderLocationEvent({required this.latitude, required this.longitude, this.heading});
  final double latitude;
  final double longitude;
  final double? heading;
}

/// Thin wrapper over the Socket.IO `/realtime` namespace (JWT-authenticated).
class RealtimeService {
  io.Socket? _socket;

  final _statusController = StreamController<OrderStatusEvent>.broadcast();
  final _locationController = StreamController<RiderLocationEvent>.broadcast();

  Stream<OrderStatusEvent> get orderStatus => _statusController.stream;
  Stream<RiderLocationEvent> get riderLocation => _locationController.stream;

  void connect(String accessToken) {
    if (_socket != null) return;
    final socket = io.io(
      '${AppConfig.realtimeUrl}/realtime',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth({'token': accessToken})
          .build(),
    );

    socket.onConnect((_) => debugPrint('Realtime connected'));
    socket.onConnectError((e) => debugPrint('Realtime connect error: $e'));

    socket.on('order:status_changed', (data) {
      if (data is Map) {
        _statusController.add(
          OrderStatusEvent(
            orderId: data['orderId']?.toString() ?? '',
            status: data['status']?.toString() ?? '',
          ),
        );
      }
    });

    socket.on('rider:location', (data) {
      if (data is Map && data['latitude'] != null && data['longitude'] != null) {
        _locationController.add(
          RiderLocationEvent(
            latitude: (data['latitude'] as num).toDouble(),
            longitude: (data['longitude'] as num).toDouble(),
            heading: (data['heading'] as num?)?.toDouble(),
          ),
        );
      }
    });

    socket.connect();
    _socket = socket;
  }

  void subscribeToOrder(String orderId) {
    _socket?.emit('order:subscribe', {'orderId': orderId});
  }

  void unsubscribeFromOrder(String orderId) {
    _socket?.emit('order:unsubscribe', {'orderId': orderId});
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
    _statusController.close();
    _locationController.close();
  }
}
