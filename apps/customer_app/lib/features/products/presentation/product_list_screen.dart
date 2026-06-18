import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../application/catalog_providers.dart';
import 'widgets/paginated_product_grid.dart';

class ProductListScreen extends ConsumerWidget {
  const ProductListScreen({super.key, this.serviceType, this.categoryId, this.title});

  final String? serviceType;
  final String? categoryId;
  final String? title;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ProductQuery(serviceType: serviceType, categoryId: categoryId);
    return Scaffold(
      appBar: AppBar(title: Text(title ?? 'Products')),
      body: PaginatedProductGrid(query: query),
    );
  }
}
