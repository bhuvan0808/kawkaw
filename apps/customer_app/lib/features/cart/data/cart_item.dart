class CartItem {
  const CartItem({
    required this.productId,
    required this.name,
    required this.price,
    required this.serviceType,
    required this.quantity,
    this.imageUrl,
    this.unit,
  });

  final String productId;
  final String name;
  final num price;
  final String serviceType;
  final int quantity;
  final String? imageUrl;
  final String? unit;

  CartItem copyWith({int? quantity}) => CartItem(
        productId: productId,
        name: name,
        price: price,
        serviceType: serviceType,
        quantity: quantity ?? this.quantity,
        imageUrl: imageUrl,
        unit: unit,
      );

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'name': name,
        'price': price,
        'serviceType': serviceType,
        'quantity': quantity,
        'imageUrl': imageUrl,
        'unit': unit,
      };

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        productId: json['productId'] as String,
        name: json['name'] as String,
        price: num.parse(json['price'].toString()),
        serviceType: json['serviceType'] as String,
        quantity: json['quantity'] as int,
        imageUrl: json['imageUrl'] as String?,
        unit: json['unit'] as String?,
      );
}
