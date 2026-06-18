class Product {
  const Product({
    required this.id,
    required this.name,
    required this.price,
    required this.serviceType,
    this.mrp,
    this.description,
    this.imageUrl,
    this.images = const [],
    this.unit,
    this.categoryId,
    this.requiresPrescription = false,
    this.inStock = true,
  });

  final String id;
  final String name;
  final num price;
  final num? mrp;
  final String serviceType;
  final String? description;
  final String? imageUrl;
  final List<String> images;
  final String? unit;
  final String? categoryId;
  final bool requiresPrescription;
  final bool inStock;

  factory Product.fromJson(Map<String, dynamic> json) {
    final inventory = json['inventory'] as Map<String, dynamic>?;
    return Product(
      id: json['id'] as String,
      name: json['name'] as String,
      price: num.parse(json['price'].toString()),
      mrp: json['mrp'] == null ? null : num.parse(json['mrp'].toString()),
      serviceType: json['serviceType'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      images: (json['images'] as List?)?.cast<String>() ?? const [],
      unit: json['unit'] as String?,
      categoryId: json['categoryId'] as String?,
      requiresPrescription: json['requiresPrescription'] as bool? ?? false,
      inStock: inventory == null ? true : (inventory['isInStock'] as bool? ?? true),
    );
  }
}
