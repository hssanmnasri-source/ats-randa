import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/calendar_event.dart';
import '../repositories/calendar_repository.dart';

final calendarRepositoryProvider = Provider<CalendarRepository>(
  (ref) => CalendarRepository(),
);

final calendarEventsProvider = FutureProvider.autoDispose<List<CalendarEvent>>((ref) async {
  return ref.read(calendarRepositoryProvider).getEvents();
});
