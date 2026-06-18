import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kawkaw_customer/features/cart/application/cart_controller.dart';
import 'package:kawkaw_customer/features/products/data/product.dart';
import 'package:shared_preferences/shared_preferences.dart';

Product _p(String id, {String service = 'GROCERY', num price = 10}) =>
    Product(id: id, name: 'P-$id', price: price, serviceType: service);

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  ProviderContainer makeContainer() {
    final c = ProviderContainer();
    addTearDown(c.dispose);
    return c;
  }

  test('adds and increments items, computing totals', () {
    final c = makeContainer();
    final cart = c.read(cartControllerProvider.notifier);

    cart.addProduct(_p('1', price: 30));
    cart.addProduct(_p('1', price: 30));
    cart.addProduct(_p('2', price: 20));

    final state = c.read(cartControllerProvider);
    expect(state.totalItems, 3);
    expect(state.subtotal, 80); // 30*2 + 20
    expect(state.quantityOf('1'), 2);
  });

  test('decrement removes item at zero', () {
    final c = makeContainer();
    final cart = c.read(cartControllerProvider.notifier);
    cart.addProduct(_p('1'));
    cart.decrementById('1');
    expect(c.read(cartControllerProvider).isEmpty, true);
  });

  test('blocks mixing services unless replaced', () {
    final c = makeContainer();
    final cart = c.read(cartControllerProvider.notifier);
    cart.addProduct(_p('1', service: 'GROCERY'));

    expect(
      () => cart.addProduct(_p('2', service: 'PHARMACY')),
      throwsA(isA<CartServiceConflict>()),
    );

    cart.addProduct(_p('2', service: 'PHARMACY'), replaceService: true);
    final state = c.read(cartControllerProvider);
    expect(state.serviceType, 'PHARMACY');
    expect(state.totalItems, 1);
  });
}
