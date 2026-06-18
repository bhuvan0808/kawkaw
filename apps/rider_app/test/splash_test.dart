import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kawkaw_rider/features/auth/presentation/splash_screen.dart';

void main() {
  testWidgets('Splash shows rider branding', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SplashScreen()));
    expect(find.text('Kaw Kaw Rider'), findsOneWidget);
    expect(find.text('Deliver. Earn. Repeat.'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
