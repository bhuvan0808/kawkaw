import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:kawkaw_customer/features/auth/presentation/splash_screen.dart';
import 'package:kawkaw_ui/kawkaw_ui.dart';

void main() {
  testWidgets('Splash shows branding and a loader', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: SplashScreen()),
    );
    expect(find.text('Kaw Kaw'), findsOneWidget);
    expect(find.text('Need it delivered right away.'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    // Theme tokens are available to the app.
    expect(AppColors.secondary, const Color(0xFFF59E0B));
  });
}
