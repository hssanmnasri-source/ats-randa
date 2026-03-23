"""
pdf_export.py
Génération de rapport PDF de matching — ATS RANDA.

Utilise reportlab pour créer un PDF paginé avec :
  - En-tête RANDA brandé (#8B1A1A / #C9A84C)
  - Informations de l'offre
  - Tableau des candidats classés (rang, nom, scores, décision)
  - Pied de page avec date et pagination
"""
from __future__ import annotations

import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

# ── Palette RANDA ──────────────────────────────────────────────────────────────
RANDA_RED    = colors.HexColor("#8B1A1A")
RANDA_DARK   = colors.HexColor("#3D0C02")
RANDA_GOLD   = colors.HexColor("#C9A84C")
RANDA_LIGHT  = colors.HexColor("#F8F0E8")
RANDA_GREEN  = colors.HexColor("#2E7D32")
RANDA_GREY   = colors.HexColor("#555555")
WHITE        = colors.white

PAGE_W, PAGE_H = A4
MARGIN = 1.8 * cm


def _decision_color(decision: str) -> colors.HexColor:
    return {
        "RETAINED": RANDA_GREEN,
        "REFUSED":  RANDA_RED,
    }.get(decision, RANDA_GREY)


def _score_bar_text(score: float) -> str:
    """Représentation textuelle du score (0-100)."""
    pct = round(score * 100, 1)
    return f"{pct}%"


def generate_matching_pdf(
    offer: Any,
    results: list[dict],
    generated_at: datetime | None = None,
) -> bytes:
    """
    Génère le PDF de matching pour une offre.

    :param offer:        Objet ORM JobOffer
    :param results:      Liste de dicts retournés par result_repository.list_by_offer()
    :param generated_at: Horodatage (défaut = maintenant)
    :returns:            Contenu PDF en bytes
    """
    generated_at = generated_at or datetime.now()
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title=f"Matching — {offer.titre}",
        author="ATS RANDA",
    )

    styles = getSampleStyleSheet()
    story  = []

    # ── En-tête ──────────────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        "RandaTitle",
        parent=styles["Title"],
        textColor=RANDA_RED,
        fontSize=22,
        leading=28,
        spaceAfter=4,
    )
    sub_style = ParagraphStyle(
        "RandaSub",
        parent=styles["Normal"],
        textColor=RANDA_GREY,
        fontSize=10,
        leading=14,
        spaceAfter=2,
    )
    label_style = ParagraphStyle(
        "RandaLabel",
        parent=styles["Normal"],
        textColor=RANDA_DARK,
        fontSize=10,
        fontName="Helvetica-Bold",
    )
    value_style = ParagraphStyle(
        "RandaValue",
        parent=styles["Normal"],
        textColor=RANDA_GREY,
        fontSize=10,
    )

    story.append(Paragraph("ATS RANDA", title_style))
    story.append(Paragraph("Applicant Tracking System — Rapport de Matching", sub_style))
    story.append(HRFlowable(width="100%", thickness=2, color=RANDA_GOLD, spaceAfter=12))

    # ── Informations de l'offre ───────────────────────────────────────────────
    offer_data = [
        [Paragraph("Offre d'emploi", label_style), Paragraph(offer.titre or "—", value_style)],
        [Paragraph("Statut", label_style),          Paragraph(offer.statut.value if offer.statut else "—", value_style)],
        [Paragraph("Date publication", label_style), Paragraph(
            offer.date_publication.strftime("%d/%m/%Y") if offer.date_publication else "—", value_style
        )],
        [Paragraph("Candidats analysés", label_style), Paragraph(str(len(results)), value_style)],
        [Paragraph("Rapport généré le", label_style), Paragraph(
            generated_at.strftime("%d/%m/%Y à %H:%M"), value_style
        )],
    ]

    offer_table = Table(offer_data, colWidths=[5 * cm, PAGE_W - 2 * MARGIN - 5 * cm])
    offer_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), RANDA_LIGHT),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [RANDA_LIGHT, WHITE]),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#E8E0D0")),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(offer_table)
    story.append(Spacer(1, 0.6 * cm))

    # ── Description offre (tronquée) ─────────────────────────────────────────
    if offer.description:
        desc_text = offer.description[:400] + ("…" if len(offer.description) > 400 else "")
        story.append(Paragraph("Description :", label_style))
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph(desc_text, value_style))
        story.append(Spacer(1, 0.4 * cm))

    story.append(HRFlowable(width="100%", thickness=1, color=RANDA_GOLD, spaceAfter=12))

    # ── Tableau des résultats ─────────────────────────────────────────────────
    header_style = ParagraphStyle(
        "TblHeader",
        parent=styles["Normal"],
        textColor=WHITE,
        fontSize=9,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
    )
    cell_style = ParagraphStyle(
        "TblCell",
        parent=styles["Normal"],
        textColor=RANDA_DARK,
        fontSize=8,
        alignment=TA_LEFT,
    )
    score_style = ParagraphStyle(
        "TblScore",
        parent=styles["Normal"],
        textColor=RANDA_DARK,
        fontSize=8,
        alignment=TA_CENTER,
    )

    headers = ["#", "Candidat", "Email", "Score\nFinal", "Sém.", "Compét.", "Exp.", "Langue", "Décision"]
    col_widths = [0.8*cm, 3.8*cm, 4.2*cm, 1.6*cm, 1.4*cm, 1.4*cm, 1.2*cm, 1.4*cm, 2.0*cm]

    table_data = [[Paragraph(h, header_style) for h in headers]]

    for row in results:
        decision     = row.get("decision", "PENDING")
        dec_color    = _decision_color(decision)
        dec_style    = ParagraphStyle(
            f"Dec_{row['id']}",
            parent=styles["Normal"],
            textColor=dec_color,
            fontSize=8,
            fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        )
        nom    = f"{row.get('candidat_prenom', '')} {row.get('candidat_nom', '')}".strip()
        email  = row.get("candidat_email", "—") or "—"
        rang   = str(row.get("rang") or "—")

        table_data.append([
            Paragraph(rang, score_style),
            Paragraph(nom or "—", cell_style),
            Paragraph(email, cell_style),
            Paragraph(_score_bar_text(row.get("score_final", 0)), score_style),
            Paragraph(_score_bar_text(row.get("score_matching", 0)), score_style),
            Paragraph(_score_bar_text(row.get("score_skills", 0)), score_style),
            Paragraph(_score_bar_text(row.get("score_experience", 0)), score_style),
            Paragraph(_score_bar_text(row.get("score_langue", 0)), score_style),
            Paragraph(decision, dec_style),
        ])

    tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
    tbl.setStyle(TableStyle([
        # En-tête
        ("BACKGROUND",   (0, 0), (-1, 0),  RANDA_RED),
        ("TEXTCOLOR",    (0, 0), (-1, 0),  WHITE),
        ("ALIGN",        (0, 0), (-1, 0),  "CENTER"),
        ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        # Lignes alternées
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, RANDA_LIGHT]),
        # Grille
        ("GRID",         (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        # Padding
        ("LEFTPADDING",  (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING",   (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
    ]))
    story.append(tbl)

    # ── Pied de page ─────────────────────────────────────────────────────────
    story.append(Spacer(1, 0.8 * cm))
    story.append(HRFlowable(width="100%", thickness=1, color=RANDA_GOLD))
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        textColor=RANDA_GREY,
        fontSize=8,
        alignment=TA_CENTER,
    )
    story.append(Paragraph(
        f"ATS RANDA — Document confidentiel — Généré le {generated_at.strftime('%d/%m/%Y à %H:%M')}",
        footer_style,
    ))

    doc.build(story)
    return buf.getvalue()
