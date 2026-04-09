/// Plain class — not freezed. Mirrors RH dashboard response from GET /api/rh/dashboard
class DashboardStats {
  final int totalOffers;
  final int activeOffers;
  final int myTotalOffers;
  final int myActiveOffers;
  final int totalCandidates;
  final int totalCvs;
  final int newCvs7Days;
  final int pendingDecisions;
  final int retainedDecisions;
  final int nouvelles24h;

  const DashboardStats({
    required this.totalOffers,
    required this.activeOffers,
    required this.myTotalOffers,
    required this.myActiveOffers,
    required this.totalCandidates,
    required this.totalCvs,
    required this.newCvs7Days,
    required this.pendingDecisions,
    required this.retainedDecisions,
    required this.nouvelles24h,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    final offers = json['offers'] as Map<String, dynamic>? ?? {};
    final cvs = json['cvs'] as Map<String, dynamic>? ?? {};
    final candidates = json['candidates'] as Map<String, dynamic>? ?? {};
    return DashboardStats(
      totalOffers: (offers['total'] as num?)?.toInt() ?? 0,
      activeOffers: (offers['active'] as num?)?.toInt() ?? 0,
      myTotalOffers: (offers['my_total'] as num?)?.toInt() ?? 0,
      myActiveOffers: (offers['my_active'] as num?)?.toInt() ?? 0,
      totalCandidates: (candidates['total'] as num?)?.toInt() ?? 0,
      totalCvs: (cvs['total'] as num?)?.toInt() ?? 0,
      newCvs7Days: (cvs['new_7_days'] as num?)?.toInt() ?? 0,
      pendingDecisions: 0,
      retainedDecisions: 0,
      nouvelles24h: 0,
    );
  }

  factory DashboardStats.empty() => const DashboardStats(
        totalOffers: 0,
        activeOffers: 0,
        myTotalOffers: 0,
        myActiveOffers: 0,
        totalCandidates: 0,
        totalCvs: 0,
        newCvs7Days: 0,
        pendingDecisions: 0,
        retainedDecisions: 0,
        nouvelles24h: 0,
      );
}
