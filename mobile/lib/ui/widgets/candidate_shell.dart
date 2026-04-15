import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme.dart';

class CandidateShell extends StatelessWidget {
  final Widget child;
  const CandidateShell({super.key, required this.child});

  static const _tabs = [
    (path: '/candidate/dashboard', icon: Icons.home_outlined, label: 'Accueil'),
    (path: '/candidate/offers',    icon: Icons.work_outline,   label: 'Offres'),
    (path: '/candidate/applications', icon: Icons.assignment_outlined, label: 'Candidatures'),
    (path: '/candidate/profile',   icon: Icons.person_outline, label: 'Profil'),
  ];

  int _selectedIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    for (var i = 0; i < _tabs.length; i++) {
      if (loc.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final idx = _selectedIndex(context);
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: idx,
        selectedItemColor: kPrimary,
        unselectedItemColor: Colors.grey,
        backgroundColor: Colors.white,
        elevation: 8,
        type: BottomNavigationBarType.fixed,
        onTap: (i) => context.go(_tabs[i].path),
        items: _tabs
            .map((t) => BottomNavigationBarItem(
                  icon: Icon(t.icon),
                  label: t.label,
                ))
            .toList(),
      ),
    );
  }
}
