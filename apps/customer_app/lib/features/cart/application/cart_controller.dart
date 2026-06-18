import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../products/data/product.dart';
import '../data/cart_item.dart';

/// Thrown when adding a product from a different service than the current cart.
class CartServiceConflict implements Exception {
  CartServiceConflict(this.currentService, this.newService);
  final String currentService;
  final String newService;
}

class CartState {
  const CartState(this.items);
  const CartState.empty() : items = const [];

  final List<CartItem> items;

  bool get isEmpty => items.isEmpty;
  int get totalItems => items.fold(0, (sum, i) => sum + i.quantity);
  double get subtotal => items.fold(0, (sum, i) => sum + i.price * i.quantity);
  String? get serviceType => items.isEmpty ? null : items.first.serviceType;

  int quantityOf(String productId) {
    for (final item in items) {
      if (item.productId == productId) return item.quantity;
    }
    return 0;
  }
}

final cartControllerProvider =
    NotifierProvider<CartController, CartState>(CartController.new);

class CartController extends Notifier<CartState> {
  static const _key = 'kk_cart_v1';
  static const _maxPerItem = 100;

  @override
  CartState build() {
    _load();
    return const CartState.empty();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return;
    try {
      final list = (jsonDecode(raw) as List)
          .cast<Map<String, dynamic>>()
          .map(CartItem.fromJson)
          .toList();
      state = CartState(list);
    } catch (_) {
      /* corrupt cache — ignore */
    }
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(state.items.map((i) => i.toJson()).toList()));
  }

  /// Adds a product. Throws [CartServiceConflict] if the cart holds another service
  /// (unless [replaceService] is set, which clears the cart first).
  void addProduct(Product product, {bool replaceService = false}) {
    if (!state.isEmpty && state.serviceType != product.serviceType) {
      if (!replaceService) {
        throw CartServiceConflict(state.serviceType!, product.serviceType);
      }
      state = const CartState.empty();
    }
    increment(product);
  }

  void increment(Product product) {
    final items = [...state.items];
    final idx = items.indexWhere((i) => i.productId == product.id);
    if (idx == -1) {
      items.add(CartItem(
        productId: product.id,
        name: product.name,
        price: product.price,
        serviceType: product.serviceType,
        quantity: 1,
        imageUrl: product.imageUrl,
        unit: product.unit,
      ));
    } else {
      final current = items[idx];
      if (current.quantity >= _maxPerItem) return;
      items[idx] = current.copyWith(quantity: current.quantity + 1);
    }
    state = CartState(items);
    _persist();
  }

  /// Bumps the quantity of an item already in the cart.
  void incrementById(String productId) {
    final items = [...state.items];
    final idx = items.indexWhere((i) => i.productId == productId);
    if (idx == -1) return;
    final current = items[idx];
    if (current.quantity >= _maxPerItem) return;
    items[idx] = current.copyWith(quantity: current.quantity + 1);
    state = CartState(items);
    _persist();
  }

  void decrementById(String productId) {
    final items = [...state.items];
    final idx = items.indexWhere((i) => i.productId == productId);
    if (idx == -1) return;
    final current = items[idx];
    if (current.quantity <= 1) {
      items.removeAt(idx);
    } else {
      items[idx] = current.copyWith(quantity: current.quantity - 1);
    }
    state = CartState(items);
    _persist();
  }

  void removeById(String productId) {
    state = CartState(state.items.where((i) => i.productId != productId).toList());
    _persist();
  }

  void clear() {
    state = const CartState.empty();
    _persist();
  }
}
