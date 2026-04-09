import '../core/api_client.dart';
import '../models/calendar_event.dart';

class CalendarRepository {
  /// GET /api/rh/calendar — fetch all RH calendar events (interviews)
  Future<List<CalendarEvent>> getEvents() async {
    final response = await dio.get('/api/rh/calendar');
    final data = response.data as Map<String, dynamic>;
    final list = data['entretiens'] as List<dynamic>? ?? [];
    return list
        .map((e) => CalendarEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
