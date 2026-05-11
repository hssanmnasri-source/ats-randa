"""Generate sprint2_cas_utilisation.drawio and sprint2_classes.drawio"""
import sys
sys.stdout.reconfigure(encoding='utf-8')

BASE = 'C:/pfe-dev/ats-randa/docs/uml/drawio/'
ATTR = 'text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;overflow=hidden;rotatable=0;fontSize=11;'

def cls(cid, label, x, y, w, h, fill, stroke):
    return f'''        <mxCell id="{cid}" value="{label}" style="swimlane;fontStyle=1;align=center;startSize=26;fillColor={fill};strokeColor={stroke};fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/>
        </mxCell>\n'''

def attr(aid, parent, text, y, w):
    return f'        <mxCell id="{aid}" value="{text}" style="{ATTR}" vertex="1" parent="{parent}"><mxGeometry y="{y}" width="{w}" height="20" as="geometry"/></mxCell>\n'

def divider(did, parent, y, w):
    stroke = '#6c8ebf'
    return f'        <mxCell id="{did}" value="" style="line;strokeColor={stroke};fillColor=none;" vertex="1" parent="{parent}"><mxGeometry y="{y}" width="{w}" height="6" as="geometry"/></mxCell>\n'

def edge(eid, src, tgt, label='', dashed=False, arrow='open'):
    style = f'endArrow={arrow};endFill=0;endSize=8;{"dashed=1;" if dashed else ""}fontSize=11;fontStyle=2;'
    lbl = label.replace('<', '&lt;').replace('>', '&gt;')
    return f'        <mxCell id="{eid}" value="{lbl}" style="{style}" parent="1" source="{src}" target="{tgt}" edge="1"><mxGeometry relative="1" as="geometry"/></mxCell>\n'

def actor(aid, label, x, y):
    return f'''        <mxCell id="{aid}" value="{label}" style="shape=mxgraph.uml.actor2;whiteSpace=wrap;html=1;fillColor=#f5f5f5;strokeColor=#666666;fontColor=#333333;fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="{x}" y="{y}" width="55" height="75" as="geometry"/>
        </mxCell>\n'''

def uc(uid, label, x, y, w, h, fill='#dae8fc', stroke='#6c8ebf'):
    return f'        <mxCell id="{uid}" value="{label}" style="ellipse;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};fontSize=12;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>\n'

def note(nid, label, x, y, w, h):
    return f'        <mxCell id="{nid}" value="{label}" style="shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;fontSize=11;fontStyle=2;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>\n'

# =============================================================
# USE CASE DIAGRAM
# =============================================================
uc_cells = ''

# title
uc_cells += '        <mxCell id="title" value="Sprint 2 — Analyse intelligente et mise en correspondance sémantique" style="text;fontStyle=1;fontSize=13;align=center;" vertex="1" parent="1"><mxGeometry x="90" y="10" width="1000" height="24" as="geometry"/></mxCell>\n'

# system boundary
uc_cells += '        <mxCell id="sys" value="" style="rounded=0;whiteSpace=wrap;fillColor=none;strokeColor=#555555;strokeWidth=2;" vertex="1" parent="1"><mxGeometry x="145" y="45" width="1020" height="710" as="geometry"/></mxCell>\n'
uc_cells += '        <mxCell id="sys_lbl" value="ATS RANDA" style="text;fontStyle=1;fontSize=13;align=left;verticalAlign=top;" vertex="1" parent="1"><mxGeometry x="150" y="48" width="180" height="22" as="geometry"/></mxCell>\n'

# actors
uc_cells += actor('act_agent', 'Agent', 35, 165)
uc_cells += actor('act_rh', 'Responsable RH', 20, 500)

# ── Row 1: Agent pipeline (top, blue) ──
uc_cells += uc('uc1', 'Uploader un CV', 165, 115, 165, 52)
uc_cells += uc('uc2', 'Analyser le CV&#xa;(NLP + parsing)', 385, 115, 185, 52)
uc_cells += uc('uc3', "Générer l'embedding&#xa;vectoriel (384D)", 635, 115, 205, 52)

# ── Row 2: RH matching (middle, green) ──
uc_cells += uc('uc4', 'Lancer le matching&#xa;sémantique', 165, 360, 205, 55, '#d5e8d4', '#82b366')
uc_cells += uc('uc5', 'Consulter les résultats&#xa;de matching IA', 440, 280, 215, 55, '#d5e8d4', '#82b366')
uc_cells += uc('uc6', 'Filtrer les candidats&#xa;(score, région…)', 715, 360, 200, 55, '#d5e8d4', '#82b366')

# ── Row 3: RH decisions (bottom, orange) ──
uc_cells += uc('uc7', 'Retenir un candidat', 255, 560, 185, 52, '#ffe6cc', '#d6b656')
uc_cells += uc('uc8', 'Refuser un candidat', 530, 560, 185, 52, '#ffe6cc', '#d6b656')

# scoring note
uc_cells += note('note1',
    'Scores: sémantique 40% · compétences 35%&#xa;expérience 15% · langue 10%',
    730, 560, 310, 48)

# ── Relationships ──
uc_cells += edge('r1', 'act_agent', 'uc1')
uc_cells += edge('r2', 'act_rh',    'uc4')
uc_cells += edge('r3', 'act_rh',    'uc5')
uc_cells += edge('r4', 'act_rh',    'uc7')
uc_cells += edge('r5', 'act_rh',    'uc8')
uc_cells += edge('r6', 'uc1', 'uc2', '<<include>>', dashed=True)
uc_cells += edge('r7', 'uc2', 'uc3', '<<include>>', dashed=True)
uc_cells += edge('r8', 'uc4', 'uc5', '<<include>>', dashed=True)
uc_cells += edge('r9', 'uc6', 'uc5', '<<extend>>',  dashed=True)

uc_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-05-02T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="sprint2_uc" name="Sprint 2 — Cas d&apos;utilisation">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
{uc_cells}      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''

with open(BASE + 'sprint2_cas_utilisation.drawio', 'w', encoding='utf-8') as f:
    f.write(uc_xml)
print('Created sprint2_cas_utilisation.drawio')


# =============================================================
# CLASS DIAGRAM  (same visual style as 01_classes.drawio)
# =============================================================
# Color palette
BLUE_F, BLUE_S   = '#dae8fc', '#6c8ebf'   # data entities
GREEN_F, GREEN_S = '#d5e8d4', '#82b366'   # NLP services
ORANGE_F, ORANGE_S = '#ffe6cc', '#d6b656' # Resultat / tasks

cc = ''  # class cells accumulator

# helper: build full attribute list for a class
def build_class(cid, label, x, y, w, attrs, methods=None, fill=BLUE_F, stroke=BLUE_S):
    n_attrs  = len(attrs)
    n_meths  = len(methods) if methods else 0
    has_div  = methods is not None  # show method divider
    height   = 26 + n_attrs * 20 + (6 + n_meths * 20 if has_div else 0) + 4
    out  = cls(cid, label, x, y, w, height, fill, stroke)
    for i, a in enumerate(attrs):
        out += attr(f'{cid}_a{i+1}', cid, a, 26 + i * 20, w)
    if has_div:
        div_y = 26 + n_attrs * 20
        out += divider(f'{cid}_div', cid, div_y, w)
        for j, m in enumerate(methods):
            out += attr(f'{cid}_m{j+1}', cid, m, div_y + 6 + j * 20, w)
    return out

# ── Column 1: CV, JobOffer ──
cc += build_class('s2_cv', 'CV', 30, 60, 230,
    attrs=[
        '+id : Integer «PK»',
        '+cv_text : Text',
        '+cv_entities : JSONB',
        '+embedding : Vector(384)',
        '+statut : CVStatus',
        '+source : CVSource',
        '+cv_version : Integer',
    ],
    methods=[
        '+parse() : dict',
        '+embed() : Vector',
    ])

cc += build_class('s2_jo', 'JobOffer', 30, 360, 230,
    attrs=[
        '+id : Integer «PK»',
        '+titre : String',
        '+description : Text',
        '+competences_requises : JSONB',
        '+experience_requise : Float',
        '+embedding : Vector(384)',
        '+statut : OfferStatus',
    ],
    methods=[
        '+embed() : Vector',
    ])

# ── Column 2: Resultat, ProcessCVTask ──
cc += build_class('s2_res', 'Resultat', 320, 60, 245,
    attrs=[
        '+id : Integer «PK»',
        '+id_cv : Integer «FK»',
        '+id_offre : Integer «FK»',
        '+score_matching : Float [40%]',
        '+score_skills : Float [35%]',
        '+score_experience : Float [15%]',
        '+score_langue : Float [10%]',
        '+score_final : Float',
        '+decision : Decision',
        '+feedback_rh : Text «nullable»',
        '+feedback_visible : Boolean',
    ],
    fill=ORANGE_F, stroke=ORANGE_S)

cc += build_class('s2_tsk', '«celery»&#xa;ProcessCVTask', 320, 510, 245,
    attrs=[],
    methods=[
        '+process_cv_on_upload(cv_id)',
        '+embed_cv(cv_id)',
        '+match_against_offers(cv_id)',
    ],
    fill=ORANGE_F, stroke=ORANGE_S)

# ── Column 3: Embedder, Scorer, CVParser ──
cc += build_class('s2_emb', '«service»&#xa;Embedder', 625, 60, 240,
    attrs=[
        '- model : SentenceTransformer',
        '- dim : int = 384',
    ],
    methods=[
        '+encode(text: str) : Vector',
        '+encode_batch(texts) : List[Vector]',
    ],
    fill=GREEN_F, stroke=GREEN_S)

cc += build_class('s2_scr', '«service»&#xa;Scorer', 625, 270, 240,
    attrs=[
        '- W_SEMANTIC : float = 0.40',
        '- W_SKILLS : float = 0.35',
        '- W_EXP : float = 0.15',
        '- W_LANG : float = 0.10',
    ],
    methods=[
        '+match(cv, offer) : Resultat',
        '- semantic_sim(v1, v2) : float',
        '- skill_overlap(cv, offer) : float',
        '- experience_match(cv, offer) : float',
    ],
    fill=GREEN_F, stroke=GREEN_S)

cc += build_class('s2_par', '«service»&#xa;CVParser', 625, 570, 240,
    attrs=[],
    methods=[
        '+parse_keejob(pdf: str) : dict',
        '+parse_generic(pdf: str) : dict',
    ],
    fill=GREEN_F, stroke=GREEN_S)

# ── Relationships ──
# CV 1 ---< * Resultat
cc += edge('rc_res',  's2_cv',  's2_res', '1 génère *',    arrow='ERone')
# JobOffer 1 ---< * Resultat
cc += edge('rj_res',  's2_jo',  's2_res', '1 concerne *',  arrow='ERone')
# ProcessCVTask dependencies
cc += edge('rt_emb',  's2_tsk', 's2_emb', '«uses»', dashed=True)
cc += edge('rt_par',  's2_tsk', 's2_par', '«uses»', dashed=True)
cc += edge('rt_scr',  's2_tsk', 's2_scr', '«uses»', dashed=True)
# Scorer uses Embedder
cc += edge('rs_emb',  's2_scr', 's2_emb', '«uses»', dashed=True)

cls_xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-05-02T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="sprint2_cls" name="Sprint 2 — Diagramme de Classes">
    <mxGraphModel dx="1800" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="cls_title" value="Sprint 2 — Diagramme de Classes — Analyse intelligente &amp; Matching sémantique" style="text;fontStyle=1;fontSize=13;align=center;" vertex="1" parent="1"><mxGeometry x="30" y="10" width="1000" height="24" as="geometry"/></mxCell>
{cc}      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''

with open(BASE + 'sprint2_classes.drawio', 'w', encoding='utf-8') as f:
    f.write(cls_xml)
print('Created sprint2_classes.drawio')


# =============================================================
# PUML sources (documentation)
# =============================================================
uc_puml = '''@startuml Sprint2_Cas_Utilisation
left to right direction
skinparam actorStyle awesome
skinparam usecaseBackgroundColor #FEFECE
skinparam usecaseBorderColor #A80036
skinparam arrowColor #555555

title Sprint 2 — Analyse intelligente et mise en correspondance sémantique

actor "Agent" as AGT
actor "Responsable RH" as RH

rectangle "ATS RANDA" {
  usecase "Uploader un CV" as UC1
  usecase "Analyser le CV (NLP + parsing)" as UC2
  usecase "Générer l\'embedding vectoriel (384D)" as UC3
  usecase "Lancer le matching sémantique" as UC4
  usecase "Consulter les résultats de matching IA" as UC5
  usecase "Filtrer les candidats (score, région...)" as UC6
  usecase "Retenir un candidat" as UC7
  usecase "Refuser un candidat" as UC8
}

AGT --> UC1
RH  --> UC4
RH  --> UC5
RH  --> UC7
RH  --> UC8

UC1 ..> UC2 : <<include>>
UC2 ..> UC3 : <<include>>
UC4 ..> UC5 : <<include>>
UC6 ..> UC5 : <<extend>>

note right of UC5
  Scores : sémantique 40%
  compétences 35%
  expérience 15%
  langue 10%
end note

@enduml
'''

cls_puml = '''@startuml Sprint2_Classes

skinparam classBackgroundColor #FEFECE
skinparam classBorderColor #555555
skinparam arrowColor #555555
skinparam stereotypeCBackgroundColor #d5e8d4

title Sprint 2 — Diagramme de Classes — Analyse intelligente & Matching

class CV {
  +id : Integer «PK»
  +cv_text : Text
  +cv_entities : JSONB
  +embedding : Vector(384)
  +statut : CVStatus
  +source : CVSource
  +cv_version : Integer
  --
  +parse() : dict
  +embed() : Vector
}

class JobOffer {
  +id : Integer «PK»
  +titre : String
  +description : Text
  +competences_requises : JSONB
  +experience_requise : Float
  +embedding : Vector(384)
  +statut : OfferStatus
  --
  +embed() : Vector
}

class Resultat {
  +id : Integer «PK»
  +id_cv : Integer «FK»
  +id_offre : Integer «FK»
  +score_matching : Float [40%]
  +score_skills : Float [35%]
  +score_experience : Float [15%]
  +score_langue : Float [10%]
  +score_final : Float
  +decision : Decision
  +feedback_rh : Text
  +feedback_visible : Boolean
}

class Embedder <<service>> {
  - model : SentenceTransformer
  - dim : int = 384
  --
  +encode(text: str) : Vector
  +encode_batch(texts) : List[Vector]
}

class Scorer <<service>> {
  - W_SEMANTIC : float = 0.40
  - W_SKILLS : float = 0.35
  - W_EXP : float = 0.15
  - W_LANG : float = 0.10
  --
  +match(cv, offer) : Resultat
  - semantic_sim(v1, v2) : float
  - skill_overlap(cv, offer) : float
  - experience_match(cv, offer) : float
}

class CVParser <<service>> {
  --
  +parse_keejob(pdf: str) : dict
  +parse_generic(pdf: str) : dict
}

class ProcessCVTask <<celery>> {
  --
  +process_cv_on_upload(cv_id)
  +embed_cv(cv_id)
  +match_against_offers(cv_id)
}

CV       "1" --> "*" Resultat : génère
JobOffer "1" --> "*" Resultat : concerne

ProcessCVTask ..> Embedder : <<uses>>
ProcessCVTask ..> CVParser  : <<uses>>
ProcessCVTask ..> Scorer    : <<uses>>
Scorer        ..> Embedder  : <<uses>>

@enduml
'''

with open(BASE + 'sprint2_cas_utilisation.puml', 'w', encoding='utf-8') as f:
    f.write(uc_puml)
print('Created sprint2_cas_utilisation.puml')

with open(BASE + 'sprint2_classes.puml', 'w', encoding='utf-8') as f:
    f.write(cls_puml)
print('Created sprint2_classes.puml')
