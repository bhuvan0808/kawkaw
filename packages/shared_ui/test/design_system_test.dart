import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

Widget _host(Widget child) => MaterialApp(
      theme: AppTheme.dark,
      home: Scaffold(body: Center(child: child)),
    );

void main() {
  group('KawOrderStatus', () {
    test('parses backend SCREAMING_SNAKE_CASE', () {
      expect(KawOrderStatusX.fromApi('OUT_FOR_DELIVERY'), KawOrderStatus.outForDelivery);
      expect(KawOrderStatusX.fromApi('DELIVERED'), KawOrderStatus.delivered);
      expect(KawOrderStatusX.fromApi('unknown'), KawOrderStatus.pending);
    });
  });

  group('KawService', () {
    test('maps to API value', () {
      expect(KawService.grocery.apiValue, 'GROCERY');
      expect(KawService.parcel.apiValue, 'PARCEL');
    });
  });

  testWidgets('PriceText shows price and struck-through MRP', (tester) async {
    await tester.pumpWidget(_host(const PriceText(price: 49, mrp: 59)));
    expect(find.text('₹49'), findsOneWidget);
    expect(find.text('₹59'), findsOneWidget);
  });

  testWidgets('QuantitySelector shows ADD at qty 0, stepper otherwise', (tester) async {
    await tester.pumpWidget(
      _host(QuantitySelector(quantity: 0, onIncrement: () {}, onDecrement: () {})),
    );
    expect(find.text('ADD'), findsOneWidget);

    await tester.pumpWidget(
      _host(QuantitySelector(quantity: 2, onIncrement: () {}, onDecrement: () {})),
    );
    expect(find.text('2'), findsOneWidget);
    expect(find.byIcon(Icons.add_rounded), findsOneWidget);
    expect(find.byIcon(Icons.remove_rounded), findsOneWidget);
  });

  testWidgets('OrderStatusTimeline renders the delivered step', (tester) async {
    await tester.pumpWidget(
      _host(const SizedBox(width: 320, child: OrderStatusTimeline(current: KawOrderStatus.outForDelivery))),
    );
    expect(find.text('Out for delivery'), findsOneWidget);
    expect(find.text('Delivered'), findsOneWidget);
  });

  testWidgets('KawButton shows a spinner when loading', (tester) async {
    await tester.pumpWidget(_host(const KawButton(label: 'Go', onPressed: null, isLoading: true)));
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
