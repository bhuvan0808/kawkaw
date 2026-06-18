class OrderItemLine {
  const OrderItemLine({
    required this.productName,
    required this.unitPrice,
    required this.quantity,
    required this.total,
  });

  final String productName;
  final num unitPrice;
  final int quantity;
  final num total;

  factory OrderItemLine.fromJson(Map<String, dynamic> json) => OrderItemLine(
        productName: json['productName'] as String,
        unitPrice: num.parse(json['unitPrice'].toString()),
        quantity: json['quantity'] as int,
        total: num.parse(json['total'].toString()),
      );
}

class OrderRider {
  const OrderRider({this.name, this.phone, this.latitude, this.longitude, this.vehicleType});

  final String? name;
  final String? phone;
  final double? latitude;
  final double? longitude;
  final String? vehicleType;

  factory OrderRider.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return OrderRider(
      name: user?['name'] as String?,
      phone: user?['phone'] as String?,
      vehicleType: json['vehicleType'] as String?,
      latitude: (json['currentLatitude'] as num?)?.toDouble(),
      longitude: (json['currentLongitude'] as num?)?.toDouble(),
    );
  }
}

class OrderStatusEntry {
  const OrderStatusEntry({required this.status, required this.createdAt, this.note});
  final String status;
  final DateTime createdAt;
  final String? note;

  factory OrderStatusEntry.fromJson(Map<String, dynamic> json) => OrderStatusEntry(
        status: json['status'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        note: json['note'] as String?,
      );
}

class Order {
  const Order({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.serviceType,
    required this.paymentStatus,
    required this.subtotal,
    required this.deliveryFee,
    required this.discount,
    required this.tax,
    required this.total,
    required this.placedAt,
    this.items = const [],
    this.statusHistory = const [],
    this.rider,
    this.deliveryLatitude,
    this.deliveryLongitude,
  });

  final String id;
  final String orderNumber;
  final String status;
  final String serviceType;
  final String paymentStatus;
  final num subtotal;
  final num deliveryFee;
  final num discount;
  final num tax;
  final num total;
  final DateTime placedAt;
  final List<OrderItemLine> items;
  final List<OrderStatusEntry> statusHistory;
  final OrderRider? rider;
  final double? deliveryLatitude;
  final double? deliveryLongitude;

  bool get isLive => const ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].contains(status);
  bool get isCancellable => const ['PENDING', 'ASSIGNED', 'ACCEPTED'].contains(status);

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      status: json['status'] as String,
      serviceType: json['serviceType'] as String,
      paymentStatus: json['paymentStatus'] as String,
      subtotal: num.parse((json['subtotal'] ?? 0).toString()),
      deliveryFee: num.parse((json['deliveryFee'] ?? 0).toString()),
      discount: num.parse((json['discount'] ?? 0).toString()),
      tax: num.parse((json['tax'] ?? 0).toString()),
      total: num.parse((json['total'] ?? 0).toString()),
      placedAt: DateTime.parse(json['placedAt'] as String),
      items: (json['items'] as List?)
              ?.cast<Map<String, dynamic>>()
              .map(OrderItemLine.fromJson)
              .toList() ??
          const [],
      statusHistory: (json['statusHistory'] as List?)
              ?.cast<Map<String, dynamic>>()
              .map(OrderStatusEntry.fromJson)
              .toList() ??
          const [],
      rider: json['rider'] == null ? null : OrderRider.fromJson(json['rider'] as Map<String, dynamic>),
      deliveryLatitude: (json['deliveryLatitude'] as num?)?.toDouble(),
      deliveryLongitude: (json['deliveryLongitude'] as num?)?.toDouble(),
    );
  }
}
