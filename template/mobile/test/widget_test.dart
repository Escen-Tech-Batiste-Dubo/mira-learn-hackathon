import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Smoke test — placeholder widget renders', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: Scaffold(body: Text('Mira Learn Template')),
    ),);
    expect(find.text('Mira Learn Template'), findsOneWidget);
  });
}
