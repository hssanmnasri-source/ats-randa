import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../core/theme.dart';
import '../../models/calendar_event.dart';
import '../../providers/calendar_provider.dart';
import '../widgets/status_badge.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;

  @override
  Widget build(BuildContext context) {
    final eventsAsync = ref.watch(calendarEventsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Calendrier')),
      body: eventsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur : $e')),
        data: (events) {
          final eventMap = _buildEventMap(events);
          final selected = _selectedDay ?? _focusedDay;
          final dayEvents = _eventsForDay(eventMap, selected);

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(calendarEventsProvider),
            child: Column(
              children: [
                TableCalendar<CalendarEvent>(
                  firstDay: DateTime.utc(2024, 1, 1),
                  lastDay: DateTime.utc(2027, 12, 31),
                  focusedDay: _focusedDay,
                  selectedDayPredicate: (d) => isSameDay(_selectedDay, d),
                  eventLoader: (d) => _eventsForDay(eventMap, d),
                  calendarStyle: CalendarStyle(
                    selectedDecoration: const BoxDecoration(
                        color: kPrimary, shape: BoxShape.circle),
                    todayDecoration: BoxDecoration(
                        color: kGold.withValues(alpha: 0.4),
                        shape: BoxShape.circle),
                    markerDecoration: const BoxDecoration(
                        color: kPrimary, shape: BoxShape.circle),
                  ),
                  headerStyle: const HeaderStyle(
                    formatButtonVisible: false,
                    titleCentered: true,
                  ),
                  onDaySelected: (selected, focused) {
                    setState(() {
                      _selectedDay = selected;
                      _focusedDay = focused;
                    });
                  },
                  onPageChanged: (focused) {
                    _focusedDay = focused;
                  },
                ),
                const Divider(height: 1),
                Expanded(
                  child: dayEvents.isEmpty
                      ? const Center(
                          child: Text('Aucun entretien ce jour',
                              style: TextStyle(color: Colors.grey)))
                      : ListView.builder(
                          itemCount: dayEvents.length,
                          itemBuilder: (_, i) =>
                              _EventCard(event: dayEvents[i]),
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Map<DateTime, List<CalendarEvent>> _buildEventMap(
      List<CalendarEvent> events) {
    final map = <DateTime, List<CalendarEvent>>{};
    for (final e in events) {
      try {
        final dt = DateTime.parse(e.dateEntretien);
        final key = DateTime.utc(dt.year, dt.month, dt.day);
        map.putIfAbsent(key, () => []).add(e);
      } catch (_) {}
    }
    return map;
  }

  List<CalendarEvent> _eventsForDay(
      Map<DateTime, List<CalendarEvent>> map, DateTime day) {
    final key = DateTime.utc(day.year, day.month, day.day);
    return map[key] ?? [];
  }
}

class _EventCard extends StatelessWidget {
  final CalendarEvent event;
  const _EventCard({required this.event});

  @override
  Widget build(BuildContext context) {
    DateTime? dt;
    try {
      dt = DateTime.parse(event.dateEntretien);
    } catch (_) {}

    final timeStr = dt != null
        ? '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}'
        : '';

    final candidateName =
        '${event.candidatPrenom ?? ''} ${event.candidatNom ?? ''}'.trim();

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: kPrimary,
          child: Text(
            timeStr.isEmpty ? '?' : timeStr.substring(0, 2),
            style: const TextStyle(
                color: Colors.white, fontSize: 12),
          ),
        ),
        title: Text(
          event.offreTitre ?? 'Entretien',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (candidateName.isNotEmpty) Text(candidateName),
            Text('$timeStr - ${event.lieu}',
                style:
                    const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
        trailing: StatusBadge(event.statut),
        isThreeLine: candidateName.isNotEmpty,
      ),
    );
  }
}
