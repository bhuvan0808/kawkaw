import 'package:latlong2/latlong.dart';

class DeliveryItem {
  const DeliveryItem({required this.name, required this.quantity});
  final String name;
  final int quantity;
  factory DeliveryItem.fromJson(Map<String, dynamic> j) =>
      DeliveryItem(name: j['productName'] as String? ?? 'Item', quantity: j['quantity'] as int? ?? 1);
}

class DeliveryAddress {
  const DeliveryAddress({
    required this.line1,
    required this.latitude,
    required this.longitude,
    this.landmark,
    this.city,
    this.pincode,
    this.receiverName,
    this.receiverPhone,
  });

  final String line1;
  final double latitude;
  final double longitude;
  final String? landmark;
  final String? city;
  final String? pincode;
  final String? receiverName;
  final String? receiverPhone;

  LatLng get latLng => LatLng(latitude, longitude);
  String get summary =>
      [line1, if (landmark != null) landmark, city, pincode].whereType<String>().join(', ');

  factory DeliveryAddress.fromJson(Map<String, dynamic> j) => DeliveryAddress(
        line1: j['line1'] as String? ?? '',
        latitude: (j['latitude'] as num).toDouble(),
        longitude: (j['longitude'] as num).toDouble(),
        landmark: j['landmark'] as String?,
        city: j['city'] as String?,
        pincode: j['pincode'] as String?,
        receiverName: j['receiverName'] as String?,
        receiverPhone: j['receiverPhone'] as String?,
      );
}

/// An order from the rider's perspective.
class DeliveryOrder {
  const DeliveryOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.serviceType,
    required this.total,
    required this.deliveryFee,
    required this.items,
    this.address,
    this.customerName,
    this.customerPhone,
    this.notes,
  });

  final String id;
  final String orderNumber;
  final String status;
  final String serviceType;
  final num total;
  final num deliveryFee;
  final List<DeliveryItem> items;
  final DeliveryAddress? address;
  final String? customerName;
  final String? customerPhone;
  final String? notes;

  /// Best contact number: the address receiver phone, else the customer's.
  String? get contactPhone =>
      (address?.receiverPhone != null && address!.receiverPhone!.isNotEmpty)
          ? address!.receiverPhone
          : customerPhone;

  String get contactName => address?.receiverName ?? customerName ?? 'Customer';

  factory DeliveryOrder.fromJson(Map<String, dynamic> j) {
    final user = j['user'] as Map<String, dynamic>?;
    final addr = j['address'] as Map<String, dynamic>?;
    return DeliveryOrder(
      id: j['id'] as String,
      orderNumber: j['orderNumber'] as String,
      status: j['status'] as String,
      serviceType: j['serviceType'] as String,
      total: num.parse((j['total'] ?? 0).toString()),
      deliveryFee: num.parse((j['deliveryFee'] ?? 0).toString()),
      items: (j['items'] as List?)?.cast<Map<String, dynamic>>().map(DeliveryItem.fromJson).toList() ?? const [],
      address: addr == null ? null : DeliveryAddress.fromJson(addr),
      customerName: user?['name'] as String?,
      customerPhone: user?['phone'] as String?,
      notes: j['notes'] as String?,
    );
  }
}
