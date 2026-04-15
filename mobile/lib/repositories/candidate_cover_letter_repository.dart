import '../core/api_client.dart';
import '../models/cover_letter.dart';

class CandidateCoverLetterRepository {
  /// GET /api/candidate/cover-letters
  Future<List<CoverLetter>> list() async {
    final response = await dio.get('/api/candidate/cover-letters');
    final data = response.data as Map<String, dynamic>;
    final list = data['cover_letters'] as List? ?? [];
    return list
        .map((e) => CoverLetter.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /api/candidate/cover-letters
  Future<CoverLetter> create(String titre, String contenu) async {
    final response = await dio.post('/api/candidate/cover-letters',
        data: {'titre': titre, 'contenu': contenu});
    return CoverLetter.fromJson(response.data as Map<String, dynamic>);
  }

  /// PUT /api/candidate/cover-letters/{id}
  Future<CoverLetter> update(int id, String titre, String contenu) async {
    final response = await dio.put('/api/candidate/cover-letters/$id',
        data: {'titre': titre, 'contenu': contenu});
    return CoverLetter.fromJson(response.data as Map<String, dynamic>);
  }

  /// DELETE /api/candidate/cover-letters/{id}
  Future<void> delete(int id) async {
    await dio.delete('/api/candidate/cover-letters/$id');
  }
}
