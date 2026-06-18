class Category {
  const Category({
    required this.id,
    required this.name,
    required this.serviceType,
    this.imageUrl,
  });

  final String id;
  final String name;
  final String serviceType;
  final String? imageUrl;

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as String,
      name: json['name'] as String,
      serviceType: json['serviceType'] as String,
      imageUrl: json['imageUrl'] as String?,
    );
  }
}
