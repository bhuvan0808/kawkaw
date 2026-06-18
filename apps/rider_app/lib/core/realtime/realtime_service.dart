import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

import '../config/app_config.dart';

class AssignmentEvent {
  AssignmentEvent({required this.orderId, this.orderNumber, this.kind = 'order'});
  final String orderId;
  final String? orderNumber;
  final String kind; // 'order' | 'parcel'
}

/// Rider realtime channel. On connect the gateway auto-joins `rider:{riderId}`,
/// so `order:assigned` events arrive without an explicit subscribe.
class RiderRealtimeService {
  io.Socket? _socket;
  final _assignmentController = StreamController<AssignmentEvent>.broadcast();
  final _notificationController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<AssignmentEvent> get assignments => _assignmentController.stream;
  Stream<Map<String, dynamic>> get notifications => _notificationController.stream;
  bool get isConnected => _socket?.connected ?? false;

  void connect(String accessToken) {
    if (_socket != null) {
      _socket!.dispose();
      _socket = null;
    }
    final socket = io.io(
      '${AppConfig.realtimeUrl}/realtime',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .enableReconnection()
          .setAuth({'token': accessToken})
          .build(),
    );
    socket.onConnect((_) => debugPrint('Rider realtime connected'));
    socket.onConnectError((e) => debugPrint('Rider realtime error: $e'));

    socket.on('order:assigned', (data) {
      if (data is Map) {
        _assignmentController.add(AssignmentEvent(
          orderId: (data['orderId'] ?? data['parcelId'] ?? '').toString(),
          orderNumber: data['orderNumber']?.toString(),
          kind: data['parcelId'] != null ? 'parcel' : 'order',
        ));
      }
    });
    socket.on('notification', (data) {
      if (data is Map) _notificationController.add(Map<String, dynamic>.from(data));
    });

    socket.connect();
    _socket = socket;
  }

  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _assignmentController.close();
    _notificationController.close();
  }
}
