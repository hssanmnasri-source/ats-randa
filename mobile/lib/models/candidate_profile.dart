/// Mirrors CandidateProfileOut from backend /api/candidate/profile
class CandidateProfile {
  final int id;
  final String? nom;
  final String? prenom;
  final String? email;
  final String? telephone;
  final String? adresse;
  final String? dateNaissance;
  final String? titrePoste;
  final String? niveauEtude;
  final String? disponibilite;
  final String? genre;
  final String? nationalite;
  final bool hasDrivingLicense;
  final bool ownsCar;
  final String visibilityStatus;
  final String? codePostal;
  final String? ville;
  final String? region;
  final bool mobiliteTn;
  final bool mobiliteIntl;
  final String? statutPro;
  final List<dynamic> secteursRecherche;
  final List<dynamic> metiersRecherche;
  final String createdAt;

  const CandidateProfile({
    required this.id,
    this.nom,
    this.prenom,
    this.email,
    this.telephone,
    this.adresse,
    this.dateNaissance,
    this.titrePoste,
    this.niveauEtude,
    this.disponibilite,
    this.genre,
    this.nationalite,
    this.hasDrivingLicense = false,
    this.ownsCar = false,
    this.visibilityStatus = 'VISIBLE',
    this.codePostal,
    this.ville,
    this.region,
    this.mobiliteTn = false,
    this.mobiliteIntl = false,
    this.statutPro,
    this.secteursRecherche = const [],
    this.metiersRecherche = const [],
    this.createdAt = '',
  });

  factory CandidateProfile.fromJson(Map<String, dynamic> json) {
    return CandidateProfile(
      id: (json['id'] as num).toInt(),
      nom: json['nom'] as String?,
      prenom: json['prenom'] as String?,
      email: json['email'] as String?,
      telephone: json['telephone'] as String?,
      adresse: json['adresse'] as String?,
      dateNaissance: json['date_naissance'] as String?,
      titrePoste: json['titre_poste'] as String?,
      niveauEtude: json['niveau_etude'] as String?,
      disponibilite: json['disponibilite'] as String?,
      genre: json['genre'] as String?,
      nationalite: json['nationalite'] as String?,
      hasDrivingLicense: json['has_driving_license'] as bool? ?? false,
      ownsCar: json['owns_car'] as bool? ?? false,
      visibilityStatus: json['visibility_status'] as String? ?? 'VISIBLE',
      codePostal: json['code_postal'] as String?,
      ville: json['ville'] as String?,
      region: json['region'] as String?,
      mobiliteTn: json['mobilite_tn'] as bool? ?? false,
      mobiliteIntl: json['mobilite_intl'] as bool? ?? false,
      statutPro: json['statut_pro'] as String?,
      secteursRecherche: json['secteurs_recherche'] as List? ?? [],
      metiersRecherche: json['metiers_recherche'] as List? ?? [],
      createdAt: json['created_at']?.toString() ?? '',
    );
  }

  String get fullName {
    final parts = [prenom ?? '', nom ?? ''].where((s) => s.isNotEmpty);
    return parts.join(' ').trim();
  }
}

/// Mirrors ExperienceOut
class CandidateExperience {
  final int id;
  final String poste;
  final String? entreprise;
  final String? dateDebut;
  final String? dateFin;
  final String? description;
  final bool isCurrent;

  const CandidateExperience({
    required this.id,
    required this.poste,
    this.entreprise,
    this.dateDebut,
    this.dateFin,
    this.description,
    this.isCurrent = false,
  });

  factory CandidateExperience.fromJson(Map<String, dynamic> json) {
    return CandidateExperience(
      id: (json['id'] as num).toInt(),
      poste: json['poste'] as String? ?? '',
      entreprise: json['entreprise'] as String?,
      dateDebut: json['date_debut'] as String?,
      dateFin: json['date_fin'] as String?,
      description: json['description'] as String?,
      isCurrent: json['is_current'] as bool? ?? false,
    );
  }
}

/// Mirrors SkillOut
class CandidateSkill {
  final int id;
  final String nom;
  final String? niveau;

  const CandidateSkill({
    required this.id,
    required this.nom,
    this.niveau,
  });

  factory CandidateSkill.fromJson(Map<String, dynamic> json) {
    return CandidateSkill(
      id: (json['id'] as num).toInt(),
      nom: json['nom'] as String? ?? '',
      niveau: json['niveau'] as String?,
    );
  }
}

/// Mirrors FullProfileOut — single endpoint GET /api/candidate/profile/full
class FullProfile {
  final CandidateProfile profile;
  final ProfileCompletion completion;
  final List<CandidateExperience> experiences;
  final List<CandidateSkill> skills;
  final List<Map<String, dynamic>> langues;
  final List<Map<String, dynamic>> formations;

  const FullProfile({
    required this.profile,
    required this.completion,
    required this.experiences,
    required this.skills,
    required this.langues,
    required this.formations,
  });

  factory FullProfile.fromJson(Map<String, dynamic> json) {
    return FullProfile(
      profile: CandidateProfile.fromJson(
          json['profile'] as Map<String, dynamic>),
      completion: ProfileCompletion.fromJson(
          json['completion'] as Map<String, dynamic>),
      experiences: (json['experiences'] as List? ?? [])
          .map((e) => CandidateExperience.fromJson(e as Map<String, dynamic>))
          .toList(),
      skills: (json['skills'] as List? ?? [])
          .map((e) => CandidateSkill.fromJson(e as Map<String, dynamic>))
          .toList(),
      langues: (json['langues'] as List? ?? [])
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList(),
      formations: (json['formations'] as List? ?? [])
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList(),
    );
  }
}

class ProfileCompletion {
  final int total;
  final Map<String, dynamic> sections;

  const ProfileCompletion({required this.total, required this.sections});

  factory ProfileCompletion.fromJson(Map<String, dynamic> json) {
    return ProfileCompletion(
      total: (json['total'] as num?)?.toInt() ?? 0,
      sections: json['sections'] as Map<String, dynamic>? ?? {},
    );
  }
}
