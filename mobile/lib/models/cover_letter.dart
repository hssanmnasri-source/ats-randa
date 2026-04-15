/// Mirrors CoverLetterOut from backend /api/candidate/cover-letters
class CoverLetter {
  final int id;
  final String titre;
  final String contenu;
  final String createdAt;
  final String? updatedAt;

  const CoverLetter({
    required this.id,
    required this.titre,
    required this.contenu,
    required this.createdAt,
    this.updatedAt,
  });

  factory CoverLetter.fromJson(Map<String, dynamic> json) {
    return CoverLetter(
      id: (json['id'] as num).toInt(),
      titre: json['titre'] as String? ?? '',
      contenu: json['contenu'] as String? ?? '',
      createdAt: json['created_at']?.toString() ?? '',
      updatedAt: json['updated_at']?.toString(),
    );
  }
}
