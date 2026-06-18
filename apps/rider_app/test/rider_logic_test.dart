import 'package:flutter_test/flutter_test.dart';
import 'package:kawkaw_rider/features/orders/data/delivery_order.dart';
import 'package:kawkaw_rider/features/rider/data/rider_profile.dart';

void main() {
  group('RiderStatus', () {
    test('parses backend values', () {
      expect(RiderStatusX.fromApi('ONLINE'), RiderStatus.online);
      expect(RiderStatusX.fromApi('BUSY'), RiderStatus.busy);
      expect(RiderStatusX.fromApi('OFFLINE'), RiderStatus.offline);
      expect(RiderStatus.online.apiValue, 'ONLINE');
    });

    test('isOnline includes busy', () {
      const p = RiderProfile(id: 'r', status: RiderStatus.busy, isVerified: true);
      expect(p.isOnline, true);
    });
  });

  group('DeliveryOrder', () {
    DeliveryOrder build({String? receiverPhone, String? customerPhone}) => DeliveryOrder(
          id: 'o1',
          orderNumber: 'KK-G-1',
          status: 'ACCEPTED',
          serviceType: 'GROCERY',
          total: 110,
          deliveryFee: 20,
          items: const [DeliveryItem(name: 'Rice', quantity: 1)],
          customerPhone: customerPhone,
          address: DeliveryAddress(
            line1: 'Street',
            latitude: 17.6,
            longitude: 80.8,
            receiverPhone: receiverPhone,
          ),
        );

    test('prefers receiver phone, falls back to customer phone', () {
      expect(build(receiverPhone: '+91111', customerPhone: '+91222').contactPhone, '+91111');
      expect(build(customerPhone: '+91222').contactPhone, '+91222');
    });

    test('parses from backend json', () {
      final o = DeliveryOrder.fromJson({
        'id': 'o2',
        'orderNumber': 'KK-G-2',
        'status': 'OUT_FOR_DELIVERY',
        'serviceType': 'GROCERY',
        'total': '110',
        'deliveryFee': '20',
        'items': [
          {'productName': 'Milk', 'quantity': 2},
        ],
        'user': {'name': 'Asha', 'phone': '+91999'},
        'address': {'line1': 'H1', 'latitude': 17.6, 'longitude': 80.9, 'pincode': '507111'},
      });
      expect(o.contactName, 'Asha');
      expect(o.items.first.quantity, 2);
      expect(o.deliveryFee, 20);
    });
  });

  group('EarningsSummary', () {
    test('parses periods', () {
      final s = EarningsSummary.fromJson({
        'today': {'earnings': 60, 'deliveries': 3},
        'week': {'earnings': '420', 'deliveries': 21},
        'month': {'earnings': 1800, 'deliveries': 90},
        'lifetime': {'earnings': 5000, 'deliveries': 250},
        'rating': 4.8,
      });
      expect(s.today.deliveries, 3);
      expect(s.week.earnings, 420);
      expect(s.rating, 4.8);
    });
  });
}
