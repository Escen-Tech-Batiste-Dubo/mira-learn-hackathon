import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../env.dart';
import 'auth_provider.dart';

/// Dio configuré pour le backend FastAPI du Groupe D.
///
/// MIGRATION HINT
/// ──────────────────────────────────────────────────────────────────────────
/// Dans le monorepo mobile, utiliser `MiraDioClient`
/// (`packages/mira_api_client/lib/src/mira_dio_client.dart`) qui ajoute :
///   - `AuthInterceptor` : refresh JWT 401 + retry transparent
///   - `RetryInterceptor` : 5xx + connection errors backoff
///   - `ErrorInterceptor` : mapping vers `MiraApiException`
///   - `MiraEnvironment` : URLs par env (dev/staging/prod)
/// ──────────────────────────────────────────────────────────────────────────
final dioProvider = Provider<Dio>((ref) {
  final token = ref.watch(currentAccessTokenProvider);

  final dio = Dio(BaseOptions(
    baseUrl: Env.apiBaseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
    headers: {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    },
  ),);

  // Log basique (à remplacer par TalkerDioLogger côté mira_chat)
  dio.interceptors.add(LogInterceptor(
    requestBody: false,
    responseBody: false,
    requestHeader: false,
    responseHeader: false,
    error: true,
  ),);

  return dio;
});

/// Helper qui appelle le backend et déballe la réponse JSend
/// `{status: "success", data: {...}}` — convention Hello Mira.
class ApiClient {
  ApiClient(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> get(String path) async {
    final res = await _dio.get<Map<String, dynamic>>(path);
    return _unwrap(res.data);
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(path, data: body);
    return _unwrap(res.data);
  }

  Map<String, dynamic> _unwrap(Map<String, dynamic>? body) {
    if (body == null) return const {};
    if (body['status'] == 'success') {
      return (body['data'] as Map<String, dynamic>?) ?? const {};
    }
    throw ApiException(
      status: body['status']?.toString() ?? 'error',
      message: body['message']?.toString() ?? 'Unknown error',
    );
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(dioProvider));
});

class ApiException implements Exception {
  ApiException({required this.status, required this.message});
  final String status;
  final String message;

  @override
  String toString() => 'ApiException($status): $message';
}
