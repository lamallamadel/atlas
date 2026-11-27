#!/usr/bin/env python3
"""Génère les données de démonstration métier (doc : docs/atlas-immobilier/03_technique/18_donnees_demo.md).

Depuis la racine du dépôt :
    python3 scripts/demo/gen_demo_seed.py \
        backend/src/main/resources/db/demo/demo-seed.sql \
        frontend/src/app/pages/login/demo-accounts.ts

Écrit le seed SQL (PostgreSQL et H2) et la liste des comptes de la page de connexion, qui
doivent rester alignés (mêmes sub, rôles et organisations).
"""
import json
import sys

OUT = sys.argv[1]
L = []
def w(s=""): L.append(s)

def q(v):
    if v is None: return "NULL"
    if isinstance(v, bool): return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)): return repr(v)
    return "'" + str(v).replace("'", "''") + "'"

def js(o):
    return q(json.dumps(o, ensure_ascii=False)) + " /*json*/"

def ago(days=0, hours=0):
    """Horodatage relatif : ago(3) = il y a 3 jours ; ago(-2) = dans 2 jours."""
    parts = ["CURRENT_TIMESTAMP"]
    for n, unit in ((days, "DAY"), (hours, "HOUR")):
        if n:
            parts.append(("- " if n > 0 else "+ ") + f"INTERVAL '{abs(n)}' {unit}")
    return " ".join(parts)

def at_day(days_from_today, hour):
    """Créneau à heure fixe : at_day(2, 10) = après-demain 10 h."""
    sign = "+" if days_from_today >= 0 else "-"
    return f"CAST(CURRENT_DATE AS TIMESTAMP) {sign} INTERVAL '{abs(days_from_today)}' DAY + INTERVAL '{hour}' HOUR"

def date_in(days):
    return f"CAST(CURRENT_DATE + INTERVAL '{days}' DAY AS DATE)"

def insert(table, rows):
    if not rows: return
    cols = list(rows[0].keys())
    w(f"INSERT INTO {table} ({', '.join(cols)}) VALUES")
    vals = []
    for r in rows:
        vals.append("    (" + ", ".join(r[c] for c in cols) + ")")
    w(",\n".join(vals) + ";")
    w()

# ------------------------------------------------------------------ référentiel démo

PHOTOS = {
    "Appartement": ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80", "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"],
    "Villa": ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80", "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80"],
    "Studio": ["https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800&q=80"],
    "Riad": ["https://images.unsplash.com/photo-1539437829697-1b4ed5aebd19?w=800&q=80"],
    "Terrain": ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"],
    "Local commercial": ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"],
    "Bureau": ["https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80"],
}
CATEGORY = {"Appartement": "APPARTEMENT", "Villa": "VILLA", "Studio": "STUDIO", "Riad": "RIAD", "Terrain": "TERRAIN", "Local commercial": "LOCAL_COMMERCIAL", "Bureau": "BUREAU"}

ROLE_SLUG = {"ADMIN": "directeur", "MANAGER": "manager", "AGENT": "agent"}

AGENCIES = [
    dict(key="detroit", org="DEMO-DETROIT", name="Agence du Détroit", verified=True,
         desc="Agence de quartier à Tanger depuis 2012 : vente et location sur Malabata, Marshan et le centre-ville.",
         langs="français,darija,espagnol", types="Appartement,Villa", tx="SALE,RENT",
         zones=[("Tanger", "Malabata"), ("Tanger", "Marshan"), ("Tanger", "Centre")],
         users=[("ADMIN", "Hassan", "Amrani"), ("MANAGER", "Samira", "Bennis"), ("AGENT", "Yassine", "Alaoui"), ("AGENT", "Imane", "Zerouali")]),
    dict(key="tangerimmo", org="DEMO-TANGERIMMO", name="Tanger Immo Conseil", verified=True,
         desc="Conseil en transaction et location sur tout Tanger et Tétouan, du studio au local commercial.",
         langs="français,darija,anglais", types=None, tx="SALE,RENT",
         zones=[("Tanger", None), ("Tétouan", None)],
         users=[("ADMIN", "Mustapha", "El Khattabi"), ("MANAGER", "Khadija", "Ouazzani"), ("AGENT", "Anas", "Bakkali"), ("AGENT", "Houda", "Rifi")]),
    dict(key="iberia", org="DEMO-IBERIA", name="Iberia Habitat", verified=True,
         desc="Spécialiste de la location familiale et des villas à Iberia et Boubana.",
         langs="français,espagnol,darija", types="Appartement,Maison,Villa", tx="RENT,SALE",
         zones=[("Tanger", "Iberia"), ("Tanger", "Boubana")],
         users=[("ADMIN", "Driss", "Benmoussa"), ("MANAGER", "Najat", "El Amrani"), ("AGENT", "Mehdi", "Ouahbi"), ("AGENT", "Sara", "Tahiri")]),
    dict(key="casaprestige", org="DEMO-CASAPRESTIGE", name="Casa Prestige Immobilier", verified=True,
         desc="Biens d'exception à Anfa, Aïn Diab et Racine : estimation, photos professionnelles, accompagnement juridique.",
         langs="français,anglais,arabe", types="Appartement,Villa", tx="SALE",
         zones=[("Casablanca", "Anfa"), ("Casablanca", "Aïn Diab"), ("Casablanca", "Racine")],
         users=[("ADMIN", "Kamal", "Lazrak"), ("MANAGER", "Ghita", "Benkirane"), ("AGENT", "Adil", "Sqalli"), ("AGENT", "Nour", "Berrada")]),
    dict(key="maarif", org="DEMO-MAARIF", name="Maârif Immo", verified=True,
         desc="Location et vente d'appartements, studios et bureaux à Maârif, Gauthier et Bourgogne.",
         langs="français,darija", types="Appartement,Studio,Bureau", tx="RENT,SALE",
         zones=[("Casablanca", "Maârif"), ("Casablanca", "Gauthier"), ("Casablanca", "Bourgogne")],
         users=[("ADMIN", "Abdelaziz", "Hajji"), ("MANAGER", "Siham", "Mernissi"), ("AGENT", "Reda", "Chami"), ("AGENT", "Loubna", "Kettani")]),
    dict(key="atlantic", org="DEMO-ATLANTIC", name="Atlantic Habitat", verified=True,
         desc="Réseau de trois agences sur Casablanca et Mohammedia.",
         langs="français,darija,anglais", types=None, tx="SALE,RENT",
         zones=[("Casablanca", None), ("Mohammedia", None)],
         users=[("ADMIN", "Jamal", "Bouzid"), ("MANAGER", "Asmae", "Filali"), ("AGENT", "Othmane", "Naciri"), ("AGENT", "Kenza", "Belhaj")]),
    dict(key="agdal", org="DEMO-AGDAL", name="Rabat Agdal Immobilier", verified=True,
         desc="Vente et location à Agdal et Hay Riad, gestion locative pour les propriétaires bailleurs.",
         langs="français,arabe,darija", types="Appartement,Villa,Studio", tx="SALE,RENT",
         zones=[("Rabat", "Agdal"), ("Rabat", "Hay Riad")],
         users=[("ADMIN", "Noureddine", "Squalli"), ("MANAGER", "Hanane", "Benabdellah"), ("AGENT", "Ilyas", "Guessous"), ("AGENT", "Zineb", "Ammor")]),
    dict(key="souissi", org="DEMO-SOUISSI", name="Souissi Prestige", verified=True,
         desc="Villas et terrains à Souissi et Témara.",
         langs="français,anglais", types="Villa,Terrain", tx="SALE",
         zones=[("Rabat", "Souissi"), ("Rabat", "Témara")],
         users=[("ADMIN", "Mohamed", "Bennouna"), ("MANAGER", "Rim", "Lamrani"), ("AGENT", "Hamza", "Skalli"), ("AGENT", "Aya", "Cherkaoui")]),
    dict(key="palmeraie", org="DEMO-PALMERAIE", name="Marrakech Palmeraie Immo", verified=True,
         desc="Villas, riads et appartements à la Palmeraie, Guéliz, Hivernage et dans la Médina.",
         langs="français,anglais,darija", types="Villa,Riad,Appartement", tx="SALE,RENT",
         zones=[("Marrakech", "Palmeraie"), ("Marrakech", "Guéliz"), ("Marrakech", "Hivernage"), ("Marrakech", "Médina")],
         users=[("ADMIN", "Abdellah", "Ouarzazi"), ("MANAGER", "Fadwa", "Tounsi"), ("AGENT", "Ismail", "Marrakchi"), ("AGENT", "Salma", "Haddaoui")]),
    dict(key="kech", org="DEMO-KECH", name="Kech Immo Nouvelle", verified=False,
         desc="Jeune agence de Guéliz, en attente de vérification par Atlas.",
         langs="français,darija", types="Appartement", tx="SALE,RENT",
         zones=[("Marrakech", "Guéliz")],
         users=[("ADMIN", "Youness", "Ait Lahcen"), ("MANAGER", "Wiam", "Chafik"), ("AGENT", "Saad", "Amzil"), ("AGENT", "Oumaima", "Ennaji")]),
]
AG = {a["key"]: a for a in AGENCIES}

def users_of(a):
    out = []; n = 0
    for role, first, last in a["users"]:
        if role == "AGENT":
            n += 1; slug = f"agent{n}"
        else:
            slug = ROLE_SLUG[role]
        email = f"{first}.{last}".lower().replace(" ", "").replace("ï", "i").replace("é", "e").replace("è", "e") + f"@{a['key']}.demo"
        out.append(dict(sub=f"demo-{a['key']}-{slug}", role=role, first=first, last=last, name=f"{first} {last}", email=email, slug=slug))
    return out
for a in AGENCIES:
    a["u"] = {u["slug"]: u for u in users_of(a)}

OWNERS = [
    ("01", "Nadia", "Idrissi"), ("02", "Karim", "Benjelloun"), ("03", "Salma", "El Fassi"), ("04", "Omar", "Tazi"),
    ("05", "Leïla", "Berrada"), ("06", "Hicham", "Chraïbi"), ("07", "Fatima Zahra", "Lahlou"), ("08", "Youssef", "Bennani"),
    ("09", "Meryem", "Alami"), ("10", "Rachid", "Sefrioui"),
]
OWN = {}
for n, first, last in OWNERS:
    OWN[n] = dict(org=f"OWN-DEMO{n}", sub=f"demo-owner-{n}", first=first, last=last,
                  display=f"{first} {last[0]}.", phone=f"+2126000001{n}")

# Biens : clé, propriétaire, titre, type, transaction, ville, quartier, adresse, surface, pièces, prix, titre foncier, vérification
PROPS = [
    ("P01", "01", "Appartement 3 pièces vue mer", "Appartement", "SALE", "Tanger", "Malabata", "12 rue des Oliviers, 3e étage", 92, 3, 1450000, "TF 12345/06", "VERIFIED",
     "Appartement lumineux avec vue sur la baie, cuisine équipée, parking en sous-sol. Résidence gardée avec piscine."),
    ("P02", "01", "Studio meublé centre-ville", "Studio", "RENT", "Tanger", "Centre", "8 avenue Pasteur, 2e étage", 38, 1, 4500, None, "NONE",
     "Studio entièrement meublé et rénové, à deux pas du boulevard Pasteur. Idéal pour un jeune actif."),
    ("P03", "02", "Villa avec jardin à Boubana", "Villa", "SALE", "Tanger", "Boubana", "Route de Boubana, villa 14", 320, 6, 4800000, "TF 8812/06", "PENDING",
     "Villa de 6 pièces sur 900 m² de terrain, jardin arboré, garage double. Proche du golf."),
    ("P04", "02", "Appartement familial Iberia", "Appartement", "RENT", "Tanger", "Iberia", "27 rue de Fès, 1er étage", 110, 4, 7500, None, "NONE",
     "Grand appartement familial, trois chambres, deux salles de bain, proche des écoles espagnoles."),
    ("P05", "09", "Duplex avec terrasse Marshan", "Appartement", "SALE", "Tanger", "Marshan", "3 rue de la Kasbah, dernier étage", 145, 4, 2300000, "TF 4521/06", "VERIFIED",
     "Duplex avec terrasse de 40 m² face au détroit, à cinq minutes du Café Hafa."),
    ("P06", "09", "Local commercial boulevard Pasteur", "Local commercial", "RENT", "Tanger", "Centre", "45 boulevard Pasteur, rez-de-chaussée", 80, 2, 12000, None, "NONE",
     "Local en angle avec grande vitrine, idéal commerce ou agence. Réserve et sanitaire."),
    ("P07", "03", "Appartement haut standing Anfa", "Appartement", "SALE", "Casablanca", "Anfa", "Boulevard d'Anfa, résidence Les Palmiers, 5e étage", 160, 4, 3900000, "TF 30211/C", "VERIFIED",
     "Appartement de standing avec double séjour, terrasse et deux places de parking."),
    ("P08", "03", "Villa Aïn Diab vue océan", "Villa", "SALE", "Casablanca", "Aïn Diab", "Rue de la Corniche, villa 7", 420, 7, 9500000, "TF 18877/C", "NONE",
     "Villa contemporaine avec piscine et vue sur l'océan, à 300 m de la plage."),
    ("P09", "04", "Appartement 2 pièces Maârif", "Appartement", "RENT", "Casablanca", "Maârif", "14 rue Ibnou Mounir, 4e étage", 68, 2, 6500, None, "NONE",
     "Deux pièces rénové, ascenseur, proche du Twin Center et du tramway."),
    ("P10", "04", "Bureau 120 m² Sidi Maârouf", "Bureau", "RENT", "Casablanca", "Sidi Maârouf", "Casanearshore, immeuble 3", 120, 3, 15000, None, "NONE",
     "Plateau de bureaux climatisé, trois salles, fibre optique, parking."),
    ("P11", "10", "Appartement neuf Bourgogne", "Appartement", "SALE", "Casablanca", "Bourgogne", "22 rue Ali Abderrazak, 6e étage", 98, 3, 1650000, "TF 27654/C", "VERIFIED",
     "Appartement neuf jamais habité, vue dégagée, cuisine américaine."),
    ("P12", "10", "Studio Gauthier meublé", "Studio", "RENT", "Casablanca", "Gauthier", "9 rue Jean Jaurès, 3e étage", 42, 1, 5200, None, "NONE",
     "Studio meublé avec balcon, quartier Gauthier, commerces au pied de l'immeuble."),
    ("P13", "05", "Appartement Agdal proche tram", "Appartement", "SALE", "Rabat", "Agdal", "18 avenue de France, 2e étage", 115, 4, 1900000, "TF 9921/R", "VERIFIED",
     "Appartement traversant à deux minutes du tramway, trois chambres, cave."),
    ("P14", "05", "Villa Souissi avec piscine", "Villa", "SALE", "Rabat", "Souissi", "Avenue Mohammed VI, villa 31", 600, 8, 12500000, "TF 1202/R", "PENDING",
     "Villa de maître sur 1 500 m² de terrain, piscine chauffée, dépendance pour le personnel."),
    ("P15", "06", "Appartement Hay Riad 3 chambres", "Appartement", "RENT", "Rabat", "Hay Riad", "Avenue Annakhil, résidence Al Andalous", 130, 4, 9000, None, "NONE",
     "Appartement familial dans une résidence avec espaces verts, proche du centre d'affaires."),
    ("P16", "06", "Terrain constructible Témara", "Terrain", "SALE", "Rabat", "Témara", "Lotissement Al Wifaq, lot 112", 500, None, 1800000, "TF 7710/R", "NONE",
     "Terrain de 500 m² titré, zone villas R+1, viabilisé."),
    ("P17", "07", "Riad rénové Médina", "Riad", "SALE", "Marrakech", "Médina", "Derb Sidi Bouloukat, riad 5", 240, 6, 3200000, "TF 4410/M", "VERIFIED",
     "Riad de cinq chambres entièrement rénové, patio avec bassin, terrasse panoramique."),
    ("P18", "07", "Villa Palmeraie piscine", "Villa", "RENT", "Marrakech", "Palmeraie", "Circuit de la Palmeraie, villa 22", 350, 5, 25000, None, "NONE",
     "Villa meublée avec piscine et jardin, location à l'année."),
    ("P19", "08", "Appartement Guéliz 2 chambres", "Appartement", "SALE", "Marrakech", "Guéliz", "Rue de la Liberté, résidence Atlas, 3e étage", 85, 3, 1250000, None, "NONE",
     "Appartement deux chambres en plein Guéliz, ascenseur et parking."),
    ("P20", "08", "Appartement Hivernage meublé", "Appartement", "RENT", "Marrakech", "Hivernage", "Avenue Echouhada, résidence Les Jardins", 75, 2, 8000, None, "NONE",
     "Appartement meublé avec piscine de résidence, à deux pas du Palais des congrès."),
]
P = {p[0]: dict(key=p[0], own=OWN[p[1]], title=p[2], type=p[3], tx=p[4], city=p[5], district=p[6], address=p[7],
                 surface=p[8], rooms=p[9], price=p[10], land=p[11], verif=p[12], desc=p[13]) for p in PROPS}

def prop_id(k):
    p = P[k]
    return f"(SELECT id FROM property WHERE org_id = {q(p['own']['org'])} AND title = {q(p['title'])})"

def req_id(k):
    return f"(SELECT id FROM mandate_request WHERE property_id = {prop_id(k)})"

def prop_id_of(k, agency):
    return f"(SELECT id FROM mandate_proposal WHERE request_id = {req_id(k)} AND agency_org_id = {q(AG[agency]['org'])})"

def mandate_id(k):
    return f"(SELECT id FROM mandate WHERE property_id = {prop_id(k)})"

def dossier_id(org, lead_name):
    return f"(SELECT id FROM dossier WHERE org_id = {q(org)} AND lead_name = {q(lead_name)})"

def annonce_id(org, title):
    return f"(SELECT id FROM annonce WHERE org_id = {q(org)} AND title = {q(title)})"

# ------------------------------------------------------------------ en-tête

w("""-- =====================================================================================
-- Données de démonstration Atlas Immobilier (cas d'usage n°1 : propriétaires et agences)
--
-- 10 agences (directeur, manager, 2 agents chacune ; 9 vérifiées), 10 propriétaires, 20 biens
-- (vente et location) à Tanger, Casablanca, Rabat et Marrakech, et tout le cycle métier :
-- annonces de particuliers et leurs contacts, demandes de mandat (bourse et demandes directes),
-- propositions et échanges, mandats (à signer, actifs, terminés, notés), offres, dossiers
-- acquéreurs et locataires, visites, tâches, notes internes ou visibles du propriétaire.
--
-- Comptes : jetons "mock-demo-…" (page de connexion, bloc « Comptes démo »), voir
-- docs/atlas-immobilier/03_technique/18_donnees_demo.md. Organisations : DEMO-* (agences),
-- OWN-DEMO* (propriétaires), DEMO-PLATFORM (super-admin).
--
-- Chargé au démarrage en profil dev par DemoSeedLoader (une seule fois : il ne fait rien si
-- DEMO-DETROIT existe). Compatible PostgreSQL et H2 ; les colonnes JSON sont marquées
-- /*json*/ : le chargeur ajoute FORMAT JSON sous H2. Exécution manuelle sous PostgreSQL :
--   psql -d atlas -f demo-seed.sql
-- Ne pas modifier à la main : généré par scripts/demo/gen_demo_seed.py (qui écrit aussi les comptes du front).
-- =====================================================================================
""")

# ------------------------------------------------------------------ organisations

w("-- Organisations : agences, propriétaires, plateforme")
rows = []
for a in AGENCIES:
    rows.append(dict(org_id=q(a["org"]), org_type=q("AGENCY"), display_name=q(a["name"]), verified=q(a["verified"]),
                     owner_user_id="NULL", owner_phone="NULL", terms_version="NULL", terms_accepted_at="NULL",
                     created_at=ago(400 if a["verified"] else 20), updated_at=ago(1)))
for n, o in OWN.items():
    rows.append(dict(org_id=q(o["org"]), org_type=q("OWNER"), display_name=q(o["display"]), verified=q(n in ("01", "03", "05", "07")),
                     owner_user_id=q(o["sub"]), owner_phone=q(o["phone"]), terms_version=q("2026-11-25"),
                     terms_accepted_at=ago(60 - int(n)), created_at=ago(60 - int(n)), updated_at=ago(1)))
rows.append(dict(org_id=q("DEMO-PLATFORM"), org_type=q("AGENCY"), display_name=q("Atlas — équipe plateforme"), verified=q(True),
                 owner_user_id="NULL", owner_phone="NULL", terms_version="NULL", terms_accepted_at="NULL", created_at=ago(500), updated_at=ago(1)))
insert("organization", rows)

w("-- Profils et zones des agences (bourse aux mandats)")
insert("agency_profile", [dict(org_id=q(a["org"]), display_name=q(a["name"]), description=q(a["desc"]), languages=q(a["langs"]),
                                property_types=q(a["types"]), transactions=q(a["tx"]), created_at=ago(300), updated_at=ago(5),
                                created_by=q(a["u"]["directeur"]["sub"]), updated_by=q(a["u"]["directeur"]["sub"])) for a in AGENCIES])
insert("agency_zone", [dict(org_id=q(a["org"]), city=q(c), district=q(d), created_at=ago(300), updated_at=ago(300),
                             created_by=q(a["u"]["directeur"]["sub"]), updated_by=q(a["u"]["directeur"]["sub"]))
                        for a in AGENCIES for c, d in a["zones"]])

w("-- Quota de propositions par offre : Atlantic Habitat est sur l'offre Essentiel (5 par mois)")
insert("organization_settings", [dict(org_id=q("DEMO-ATLANTIC"), settings=js({"quotas": {"maxMandateProposalsMonth": 5}}), version="1",
                                       created_at=ago(100), updated_at=ago(100), whatsapp_quota_tier="1", verified_pro=q(True))])

# ------------------------------------------------------------------ biens

w("-- Biens des propriétaires (20)")
insert("property", [dict(org_id=q(p["own"]["org"]), title=q(p["title"]), property_type=q(p["type"]), transaction_type=q(p["tx"]),
                         city=q(p["city"]), district=q(p["district"]), address=q(p["address"]), surface=q(float(p["surface"])),
                         rooms=q(p["rooms"]), expected_price=q(p["price"]), currency=q("MAD"), description=q(p["desc"]),
                         land_title_number=q(p["land"]), verification_status=q(p["verif"]),
                         created_at=ago(45 - i), updated_at=ago(3), created_by=q(p["own"]["sub"]), updated_by=q(p["own"]["sub"]))
                    for i, p in enumerate(P.values())])

# ------------------------------------------------------------------ annonces de particuliers

def annonce_row(org, p, status, publisher, created_by, created_days, moderation=None, mandate=None, title=None, price=None):
    return dict(org_id=q(org), title=q(title or p["title"]), description=q(p["desc"]), category=q(p["type"]),
                type=q(p["tx"]), address=q(p["district"]), surface=q(float(p["surface"])), city=q(p["city"]),
                price=q(price or p["price"]), currency=q("MAD"), status=q(status),
                photos_json=js(PHOTOS[p["type"]]), meta_json=js({"rooms": p["rooms"]} if p["rooms"] else {}),
                property_id=prop_id(p["key"]), publisher_kind=q(publisher), moderation_status=q(moderation),
                moderated_by=q("auto" if moderation == "MOD_APPROVED" else None),
                moderated_at=ago(created_days - 1) if moderation == "MOD_APPROVED" else "NULL",
                mandate_id=mandate or "NULL",
                created_at=ago(created_days), updated_at=ago(max(created_days - 1, 0)), created_by=q(created_by), updated_by=q(created_by))

w("-- Annonces publiées par les propriétaires (particuliers) ; P12 attend la modération, P10 est un brouillon")
OWNER_ANN = [("P02", "PUBLISHED", "MOD_APPROVED", 30), ("P08", "PUBLISHED", "MOD_APPROVED", 12), ("P16", "PUBLISHED", "MOD_APPROVED", 25),
             ("P20", "PUBLISHED", "MOD_APPROVED", 18), ("P12", "DRAFT", "MOD_PENDING", 2), ("P10", "DRAFT", None, 4)]
insert("annonce", [annonce_row(P[k]["own"]["org"], P[k], st, "OWNER", P[k]["own"]["sub"], d, moderation=mod) for k, st, mod, d in OWNER_ANN])

# ------------------------------------------------------------------ demandes de mandat

SERV_SALE = "ESTIMATION,PHOTOS,VISITS,NEGOTIATION"
SERV_RENT = "PHOTOS,VISITS,TENANT_SELECTION"

# clé bien : (visibilité, agence ciblée, statut, ouverte il y a (h), message, types, autres)
REQUESTS = {
    # Mandats signés ou en cours : demandes attribuées
    "P01": dict(vis="MREQ_OPEN_MARKET", status="MREQ_AWARDED", opened_h=40 * 24, types="SIMPLE,EXCLUSIVE", services=SERV_SALE,
                msg="Je vis à Casablanca et ne peux pas organiser les visites moi-même.", deadline="Sous 3 mois"),
    "P04": dict(vis="MREQ_DIRECT", target="iberia", status="MREQ_AWARDED", opened_h=6 * 24, types="SIMPLE", services=SERV_RENT,
                msg="Je cherche une famille sérieuse, bail d'un an minimum.", deadline="Disponible le 1er du mois"),
    "P05": dict(vis="MREQ_OPEN_MARKET", status="MREQ_AWARDED", opened_h=110 * 24, types="EXCLUSIVE", services=SERV_SALE,
                msg=None, deadline="Sous 3 mois"),
    "P07": dict(vis="MREQ_OPEN_MARKET", status="MREQ_AWARDED", opened_h=50 * 24, types="SIMPLE", services=SERV_SALE + ",LEGAL",
                msg="Merci de joindre une estimation argumentée.", deadline="Sous 6 mois"),
    "P09": dict(vis="MREQ_DIRECT", target="maarif", status="MREQ_AWARDED", opened_h=35 * 24, types="SIMPLE,EXCLUSIVE", services=SERV_RENT + ",RENT_MANAGEMENT",
                msg=None, deadline="Au plus vite"),
    "P11": dict(vis="MREQ_OPEN_MARKET", status="MREQ_AWARDED", opened_h=100 * 24, types="SIMPLE,EXCLUSIVE", services=SERV_SALE,
                msg=None, deadline="Sous 3 mois"),
    "P13": dict(vis="MREQ_OPEN_MARKET", status="MREQ_AWARDED", opened_h=85 * 24, types="EXCLUSIVE", services=SERV_SALE,
                msg="Appartement libre à la vente, visites possibles le samedi.", deadline="Sous 3 mois"),
    "P15": dict(vis="MREQ_DIRECT", target="agdal", status="MREQ_AWARDED", opened_h=70 * 24, types="SIMPLE", services=SERV_RENT,
                msg=None, deadline="Au plus vite"),
    "P17": dict(vis="MREQ_OPEN_MARKET", status="MREQ_AWARDED", opened_h=30 * 24, types="EXCLUSIVE", services=SERV_SALE + ",PHOTOS",
                msg="Clientèle étrangère bienvenue, je parle anglais.", deadline="Sous 6 mois"),
    # Demandes en cours sur la bourse
    "P03": dict(vis="MREQ_OPEN_MARKET", status="MREQ_OPEN", opened_h=3 * 24, types="SIMPLE,EXCLUSIVE", services=SERV_SALE,
                msg="Villa familiale, je souhaite une estimation avant de fixer le prix définitif.", deadline="Sous 6 mois"),
    "P08": dict(vis="MREQ_OPEN_MARKET", status="MREQ_OPEN", opened_h=20, types="SIMPLE", services=SERV_SALE + ",LEGAL",
                msg="L'annonce reste en ligne en parallèle : mandat simple uniquement.", deadline="Sous 6 mois"),
    "P14": dict(vis="MREQ_OPEN_MARKET", status="MREQ_OPEN", opened_h=5 * 24, types="EXCLUSIVE", services=SERV_SALE + ",LEGAL",
                msg="Discrétion demandée : pas de photos de l'intérieur sur les réseaux sociaux.", deadline="Sous 12 mois"),
    "P19": dict(vis="MREQ_OPEN_MARKET", status="MREQ_OPEN", opened_h=2 * 24, types="SIMPLE,EXCLUSIVE", services=SERV_SALE,
                msg=None, deadline="Sous 3 mois"),
    # Demandes directes en attente
    "P06": dict(vis="MREQ_DIRECT", target="tangerimmo", status="MREQ_OPEN", opened_h=50, types="SIMPLE", services="PHOTOS,VISITS,TENANT_SELECTION",
                msg="Vous m'avez été recommandés par un voisin commerçant.", deadline="Au plus vite", idle_h=2),
    "P18": dict(vis="MREQ_DIRECT", target="palmeraie", status="MREQ_OPEN", opened_h=4 * 24, types="SIMPLE", services=SERV_RENT,
                msg="Location à l'année uniquement, pas de location saisonnière.", deadline="Au plus vite", declined_h=24),
}

w("-- Demandes d'accompagnement (bourse aux mandats et demandes directes)")
rows = []
for k, r in REQUESTS.items():
    p = P[k]
    open_h = r["opened_h"]
    rows.append(dict(owner_org_id=q(p["own"]["org"]), property_id=prop_id(k), visibility=q(r["vis"]),
                     target_agency_org_id=q(AG[r["target"]]["org"] if r.get("target") else None),
                     objective=q(p["tx"]), city=q(p["city"]), district=q(p["district"]), expected_price=q(p["price"]), currency=q("MAD"),
                     deadline=q(r["deadline"]), mandate_types=q(r["types"]), services=q(r["services"]),
                     commission_note=q("Commission à discuter" if p["tx"] == "SALE" else "Un mois de loyer maximum"),
                     availability=q("Visites le samedi matin" if int(k[1:]) % 2 else "En semaine après 18 h"),
                     languages=q("français,darija"), message=q(r["msg"]), status=q(r["status"]), max_proposals="5",
                     opened_at=ago(hours=open_h), expires_at=ago(hours=open_h - 14 * 24),
                     target_declined_at=ago(hours=r["declined_h"]) if r.get("declined_h") else "NULL",
                     created_at=ago(hours=open_h), updated_at=ago(hours=min(open_h, 24)),
                     idle_alerted_at=ago(hours=r["idle_h"]) if r.get("idle_h") else "NULL"))
insert("mandate_request", rows)

# ------------------------------------------------------------------ propositions

def u(agency, slug): return AG[agency]["u"][slug]

# (bien, agence, agent, type, durée, commission kind, valeur, payeur, estimation min, max, statut, créée il y a (h), message)
PROPOSALS = [
    ("P01", "detroit", "agent1", "EXCLUSIVE", 3, "PERCENT", 2.5, "SELLER", 1400000, 1500000, "MPROP_ACCEPTED", 38 * 24,
     "Nous suivons Malabata depuis 12 ans : 4 ventes comparables cette année entre 15 000 et 16 500 MAD/m²."),
    ("P01", "tangerimmo", "agent1", "SIMPLE", 3, "PERCENT", 2.0, "SELLER", 1350000, 1450000, "MPROP_DECLINED", 39 * 24,
     "Mandat simple sans engagement, diffusion sur nos sites partenaires."),
    ("P04", "iberia", "agent1", "SIMPLE", 6, "FLAT", 7500, "SHARED", None, None, "MPROP_ACCEPTED", 5 * 24,
     "Nous avons trois familles en recherche sur Iberia en ce moment."),
    ("P05", "detroit", "agent2", "EXCLUSIVE", 3, "PERCENT", 2.5, "SELLER", 2200000, 2400000, "MPROP_ACCEPTED", 108 * 24,
     "Photos professionnelles et visite virtuelle incluses."),
    ("P07", "casaprestige", "agent1", "SIMPLE", 3, "PERCENT", 2.0, "SELLER", 3800000, 4100000, "MPROP_ACCEPTED", 48 * 24,
     "Estimation détaillée jointe, accompagnement jusqu'à l'acte chez le notaire."),
    ("P07", "atlantic", "agent2", "SIMPLE", 3, "PERCENT", 2.5, "SELLER", 3600000, 3900000, "MPROP_DECLINED", 49 * 24, None),
    ("P09", "maarif", "agent1", "EXCLUSIVE", 3, "FLAT", 6500, "SHARED", None, None, "MPROP_ACCEPTED", 34 * 24,
     "Sélection du locataire avec dossier complet et garant, état des lieux inclus."),
    ("P11", "maarif", "agent2", "EXCLUSIVE", 3, "PERCENT", 2.5, "SELLER", 1600000, 1700000, "MPROP_ACCEPTED", 98 * 24, None),
    ("P13", "agdal", "agent1", "EXCLUSIVE", 3, "PERCENT", 2.5, "SELLER", 1850000, 1950000, "MPROP_ACCEPTED", 83 * 24,
     "Agdal est notre quartier : nous avons vendu deux appartements dans votre rue cette année."),
    ("P15", "agdal", "agent2", "SIMPLE", 3, "FLAT", 9000, "SHARED", None, None, "MPROP_ACCEPTED", 69 * 24, None),
    ("P17", "palmeraie", "agent1", "EXCLUSIVE", 6, "PERCENT", 3.0, "SELLER", 3000000, 3400000, "MPROP_ACCEPTED", 29 * 24,
     "Clientèle européenne : diffusion en français, anglais et espagnol, visites en visio."),
    # Bourse : demandes en cours
    ("P03", "detroit", "manager", "EXCLUSIVE", 3, "PERCENT", 2.5, "SELLER", 4500000, 4900000, "MPROP_SENT", 2 * 24,
     "Nous avons deux acquéreurs qualifiés pour une villa à Boubana dans ce budget."),
    ("P03", "tangerimmo", "agent2", "SIMPLE", 6, "PERCENT", 2.0, "SELLER", 4300000, 4700000, "MPROP_SHORTLISTED", 60,
     "Mandat simple de 6 mois, nous prenons en charge les photos et la visite virtuelle."),
    ("P03", "iberia", "agent2", "EXCLUSIVE", 3, "PERCENT", 2.5, "SELLER", 4600000, 5000000, "MPROP_SENT", 30,
     "Boubana est notre secteur : estimation sur place sous 48 h."),
    ("P14", "souissi", "agent1", "EXCLUSIVE", 6, "PERCENT", 2.0, "SELLER", 11500000, 12800000, "MPROP_SHORTLISTED", 4 * 24,
     "Diffusion confidentielle auprès d'une clientèle sélectionnée, sans photos publiques."),
    ("P14", "agdal", "manager", "EXCLUSIVE", 6, "PERCENT", 2.5, "SELLER", 11000000, 12000000, "MPROP_SENT", 3 * 24, None),
    ("P19", "palmeraie", "agent2", "SIMPLE", 3, "PERCENT", 2.5, "SELLER", 1200000, 1300000, "MPROP_SENT", 30,
     "Deux visites possibles dès cette semaine avec des acquéreurs en recherche à Guéliz."),
]

w("-- Propositions des agences")
rows = []
for k, ag, slug, mtype, dur, kind, val, payer, emin, emax, status, h, msg in PROPOSALS:
    usr = u(ag, slug)
    decided = status in ("MPROP_ACCEPTED", "MPROP_DECLINED")
    rows.append(dict(request_id=req_id(k), agency_org_id=q(AG[ag]["org"]), agent_user_id=q(usr["sub"]), agent_name=q(usr["name"]),
                     mandate_type=q(mtype), duration_months=str(dur), commission_kind=q(kind), commission_value=q(val),
                     commission_payer=q(payer), services=q(REQUESTS[k]["services"]), estimate_min=q(emin), estimate_max=q(emax),
                     message=q(msg), status=q(status), decided_at=ago(hours=h - 24) if decided else "NULL",
                     owner_last_read_at=ago(hours=max(h - 2, 1)) if status != "MPROP_SENT" else "NULL",
                     agency_last_read_at=ago(hours=1), owner_alerted_at=ago(hours=h),
                     created_at=ago(hours=h), updated_at=ago(hours=max(h - 24, 1))))
insert("mandate_proposal", rows)

w("-- Échanges propriétaire ↔ agence (fils des propositions retenues)")
MSGS = [
    ("P03", "tangerimmo", [("AGENCY", "agent2", "Bonjour Monsieur Benjelloun, la villa est-elle libre d'occupation ?", 58),
                           ("OWNER", None, "Bonjour, oui, libre dès la signature. Pouvez-vous passer samedi pour l'estimation ?", 50),
                           ("AGENCY", "agent2", "Samedi 10 h, c'est noté. Je viendrai avec notre photographe.", 48)]),
    ("P14", "souissi", [("OWNER", None, "Comment garantissez-vous la discrétion de la vente ?", 80),
                        ("AGENCY", "agent1", "Nous ne publions aucune photo : les acquéreurs signent un engagement de confidentialité avant toute visite.", 76)]),
    ("P01", "detroit", [("OWNER", None, "Vos honoraires incluent-ils les photos ?", 37 * 24),
                        ("AGENCY", "agent1", "Oui, photos professionnelles et visite virtuelle comprises dans les 2,5 %.", 37 * 24 - 3)]),
]
rows = []
for k, ag, items in MSGS:
    for side, slug, body, h in items:
        usr = u(ag, slug) if slug else None
        rows.append(dict(proposal_id=prop_id_of(k, ag), author_side=q(side),
                         author_user_id=q(usr["sub"] if usr else P[k]["own"]["sub"]),
                         author_name=q(usr["name"] if usr else P[k]["own"]["display"]), body=q(body), created_at=ago(hours=h)))
insert("marketplace_message", rows)

w("-- Agences recommandées et invitations (score de pertinence, § 5.1)")
INVITES = [("P03", "detroit", "MATCHED", 86), ("P03", "iberia", "INVITED", 82), ("P03", "tangerimmo", "MATCHED", 71),
           ("P08", "casaprestige", "MATCHED", 88), ("P08", "atlantic", "MATCHED", 64), ("P08", "maarif", "MATCHED", 41),
           ("P14", "souissi", "MATCHED", 90), ("P14", "agdal", "MATCHED", 58),
           ("P19", "palmeraie", "MATCHED", 84)]
rows = []
for k, ag, kind, score in INVITES:
    rows.append(dict(request_id=req_id(k), agency_org_id=q(AG[ag]["org"]), kind=q(kind), score=str(score),
                     created_at=ago(hours=REQUESTS[k]["opened_h"]), seen_at="NULL" if ag == "maarif" else ago(hours=1)))
insert("mandate_invitation", rows)

# ------------------------------------------------------------------ mandats

# (bien, agence, agent, statut, signé il y a (j), créé il y a (j), durée, fin (motif, par, il y a j), dossier status)
MANDATES = [
    dict(k="P01", ag="detroit", agent="agent1", status="MANDATE_ACTIVE", created=37, signed=35, code="CRM_OFFER_RECEIVED"),
    dict(k="P04", ag="iberia", agent="agent1", status="MANDATE_PENDING_SIGNATURE", created=2, signed=None, code="CRM_MANDATE_PENDING"),
    dict(k="P05", ag="detroit", agent="agent2", status="MANDATE_COMPLETED", created=107, signed=105, code="CRM_CLOSED_WON",
         end=("DEAL_CLOSED_AGENCY", "AGENCY", 15)),
    dict(k="P07", ag="casaprestige", agent="agent1", status="MANDATE_ACTIVE", created=47, signed=45, code="CRM_OFFER_RECEIVED"),
    dict(k="P09", ag="maarif", agent="agent1", status="MANDATE_ACTIVE", created=33, signed=31, code="CRM_VISIT_PLANNED"),
    dict(k="P11", ag="maarif", agent="agent2", status="MANDATE_TERMINATED", created=97, signed=95, code="CRM_CLOSED_LOST",
         end=("SOLD_BY_OWNER", "OWNER", 30)),
    dict(k="P13", ag="agdal", agent="agent1", status="MANDATE_ACTIVE", created=82, signed=80, code="CRM_LISTED"),
    dict(k="P15", ag="agdal", agent="agent2", status="MANDATE_COMPLETED", created=68, signed=66, code="CRM_CLOSED_WON",
         end=("DEAL_CLOSED_AGENCY", "AGENCY", 40)),
    dict(k="P17", ag="palmeraie", agent="agent1", status="MANDATE_ACTIVE", created=28, signed=27, code="CRM_OFFER_RECEIVED"),
]
PROP_BY = {(x[0], x[1]): x for x in PROPOSALS}
STATUS_ENUM = {"CRM_MANDATE_PENDING": "NEW", "CRM_MANDATE_SIGNED": "QUALIFIED", "CRM_LISTED": "QUALIFIED", "CRM_VISIT_PLANNED": "APPOINTMENT",
               "CRM_VISIT_DONE": "APPOINTMENT", "CRM_OFFER_RECEIVED": "APPOINTMENT", "CRM_NEGOTIATION": "APPOINTMENT",
               "CRM_COMPROMISE_SIGNED": "APPOINTMENT", "CRM_CLOSED_WON": "WON", "CRM_CLOSED_LOST": "LOST",
               "CRM_NEW": "NEW", "CRM_QUALIFYING": "QUALIFYING", "CRM_QUALIFIED": "QUALIFIED"}

w("-- Mandats")
rows = []
for m in MANDATES:
    pr = PROP_BY[(m["k"], m["ag"])]
    usr = u(m["ag"], m["agent"])
    dur = pr[4]
    end = m.get("end")
    # P13 : échéance dans 10 jours (alerte J-15) ; sinon durée de la proposition depuis la signature.
    ends = ago(-10) if m["k"] == "P13" else ago((m["signed"] or m["created"]) - dur * 30)
    rows.append(dict(owner_org_id=q(P[m["k"]]["own"]["org"]), agency_org_id=q(AG[m["ag"]]["org"]), property_id=prop_id(m["k"]),
                     request_id=req_id(m["k"]), proposal_id=prop_id_of(m["k"], m["ag"]), agent_user_id=q(usr["sub"]),
                     mandate_type=q(pr[3]), duration_months=str(dur), commission_kind=q(pr[5]), commission_value=q(pr[6]),
                     commission_payer=q(pr[7]), status=q(m["status"]), starts_at=ago(m["created"]), ends_at=ends,
                     signed_at=ago(m["signed"]) if m["signed"] else "NULL",
                     ended_at=ago(end[2]) if end else "NULL", end_reason=q(end[0] if end else None),
                     ended_by=q(end[1] if end else None), dossier_id="NULL",
                     expiry_alerted_at=ago(1) if m["k"] == "P13" else "NULL",
                     created_at=ago(m["created"]), updated_at=ago(end[2] if end else 1)))
insert("mandate", rows)

w("-- Annonces des agences mandatées (retirées du portail quand le mandat est terminé)")
rows = []
for m in MANDATES:
    if m["status"] == "MANDATE_PENDING_SIGNATURE": continue
    p = P[m["k"]]
    st = "PUBLISHED" if m["status"] == "MANDATE_ACTIVE" else "SUSPENDED"
    rows.append(annonce_row(AG[m["ag"]]["org"], p, st, "AGENCY", u(m["ag"], m["agent"])["sub"], m["signed"] - 1, mandate=mandate_id(m["k"])))
insert("annonce", rows)

# ------------------------------------------------------------------ dossiers

DOSSIERS = []   # dict(org, lead_name, ...)

def dossier(org, lead_name, case, code, *, phone=None, email=None, lead_source="AGENCE", source="PHONE", assignee=None,
            annonce=None, notes=None, criteria=None, created=10, loss=None, won=None, created_by=None):
    DOSSIERS.append(dict(org=org, lead_name=lead_name, case=case, code=code, phone=phone, email=email, lead_source=lead_source,
                         source=source, assignee=assignee, annonce=annonce, notes=notes, criteria=criteria, created=created,
                         loss=loss, won=won, created_by=created_by))

# Dossiers mandats (côté agence)
for m in MANDATES:
    p = P[m["k"]]; usr = u(m["ag"], m["agent"]); pr = PROP_BY[(m["k"], m["ag"])]
    ann = None if m["status"] == "MANDATE_PENDING_SIGNATURE" else (AG[m["ag"]]["org"], p["title"])
    com = (f"{pr[6]:g} %".replace(".", ",") if pr[5] == "PERCENT" else f"{int(pr[6]):,} MAD".replace(",", " "))
    dossier(AG[m["ag"]]["org"], p["own"]["display"], "CRM_MANDATE_RENT" if p["tx"] == "RENT" else "CRM_MANDATE_SALE", m["code"],
            phone=p["own"]["phone"], lead_source="BOURSE_MANDATS", source="WEB", assignee=usr, annonce=ann,
            notes=f"[Mandat démo] {p['title']}\nType : {'exclusif' if pr[3] == 'EXCLUSIVE' else 'simple'}, {pr[4]} mois\nCommission : {com}",
            created=m["created"], won="Vendu" if m["code"] == "CRM_CLOSED_WON" and p["tx"] == "SALE" else ("Loué" if m["code"] == "CRM_CLOSED_WON" else None),
            loss="Vendu par le propriétaire" if m["code"] == "CRM_CLOSED_LOST" else None)

# Acquéreurs et locataires des agences (4 par agence)
LEADS = {
    "detroit": [("Mounir Chaoui", "CRM_LEAD_BUY", "CRM_QUALIFIED", "agent1", "Mubawab", {"transactionTypes": ["SALE"], "categories": ["Villa"], "cities": ["Tanger"], "budgetMin": 4000000, "budgetMax": 5200000}, ("P01",), None),
                ("Couple Hamdouchi", "CRM_LEAD_BUY", "CRM_VISIT_PLANNED", "agent1", "PORTAIL", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Tanger"], "budgetMax": 1500000, "surfaceMin": 85}, ("P01",), None),
                ("Ahmed Rachidi", "CRM_LEAD_BUY", "CRM_NEW", "agent2", "Avito", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Tanger"], "budgetMax": 1300000}, None, None),
                ("Julie Martin", "CRM_LEAD_RENT", "CRM_CLOSED_LOST", "manager", "Recommandation", {"transactionTypes": ["RENT"], "categories": ["Appartement"], "cities": ["Tanger"], "budgetMax": 9000}, None, "A choisi un bien à Asilah")],
    "tangerimmo": [("Karima Fassi", "CRM_LEAD_BUY", "CRM_QUALIFYING", "agent1", "Mubawab", {"transactionTypes": ["SALE"], "categories": ["Villa", "Maison"], "cities": ["Tanger"], "budgetMax": 5000000}, None, None),
                   ("Société Nord Distribution", "CRM_LEAD_RENT", "CRM_QUALIFIED", "agent2", "Agence", {"transactionTypes": ["RENT"], "categories": ["Local commercial"], "cities": ["Tanger"], "budgetMax": 13000, "surfaceMin": 60}, None, None),
                   ("Omar Lahlimi", "CRM_LEAD_RENT", "CRM_NEW", "agent2", "Avito", {"transactionTypes": ["RENT"], "categories": ["Studio", "Appartement"], "cities": ["Tanger"], "budgetMax": 5000}, None, None),
                   ("Pedro Sánchez", "CRM_LEAD_BUY", "CRM_CLOSED_WON", "manager", "Recommandation", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Tanger"], "budgetMax": 1800000}, None, None)],
    "iberia": [("Famille Benali", "CRM_LEAD_RENT", "CRM_QUALIFIED", "agent1", "Agence", {"transactionTypes": ["RENT"], "categories": ["Appartement"], "cities": ["Tanger"], "budgetMax": 8000, "surfaceMin": 100}, None, None),
               ("Famille Ortega", "CRM_LEAD_RENT", "CRM_VISIT_PLANNED", "agent2", "PORTAIL", {"transactionTypes": ["RENT"], "categories": ["Appartement", "Maison"], "cities": ["Tanger"], "budgetMax": 8500}, None, None),
               ("Youssef Amrani", "CRM_LEAD_BUY", "CRM_QUALIFYING", "agent2", "Mubawab", {"transactionTypes": ["SALE"], "categories": ["Villa"], "cities": ["Tanger"], "budgetMin": 4200000, "budgetMax": 5000000}, None, None),
               ("Hajar Moussaoui", "CRM_LEAD_RENT", "CRM_NEW", "agent1", "Avito", {"transactionTypes": ["RENT"], "cities": ["Tanger"], "budgetMax": 4000}, None, None)],
    "casaprestige": [("Mehdi Kabbaj", "CRM_LEAD_BUY", "CRM_QUALIFIED", "agent1", "Recommandation", {"transactionTypes": ["SALE"], "categories": ["Villa"], "cities": ["Casablanca"], "budgetMin": 8000000, "budgetMax": 10000000}, None, None),
                     ("Sophie Laurent", "CRM_LEAD_BUY", "CRM_VISIT_PLANNED", "agent1", "PORTAIL", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Casablanca"], "budgetMax": 4000000, "surfaceMin": 140}, ("P07",), None),
                     ("Anas Benjelloun", "CRM_LEAD_BUY", "CRM_QUALIFYING", "agent2", "Mubawab", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Casablanca"], "budgetMax": 3500000}, None, None),
                     ("Groupe Atlas Invest", "CRM_LEAD_BUY", "CRM_NEW", "manager", "Agence", {"transactionTypes": ["SALE"], "categories": ["Villa", "Appartement"], "cities": ["Casablanca"], "budgetMax": 15000000}, None, None)],
    "maarif": [("Amina Rhazi", "CRM_LEAD_RENT", "CRM_VISIT_PLANNED", "agent1", "PORTAIL", {"transactionTypes": ["RENT"], "categories": ["Appartement"], "cities": ["Casablanca"], "budgetMax": 7000}, ("P09",), None),
               ("Thomas Girard", "CRM_LEAD_RENT", "CRM_QUALIFIED", "agent1", "Avito", {"transactionTypes": ["RENT"], "categories": ["Appartement", "Studio"], "cities": ["Casablanca"], "budgetMax": 7500, "furnished": True}, ("P09",), None),
               ("Startup Fintek", "CRM_LEAD_RENT", "CRM_QUALIFYING", "agent2", "Agence", {"transactionTypes": ["RENT"], "categories": ["Bureau"], "cities": ["Casablanca"], "budgetMax": 18000, "surfaceMin": 100}, None, None),
               ("Ilham Tazi", "CRM_LEAD_BUY", "CRM_CLOSED_LOST", "agent2", "Mubawab", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Casablanca"], "budgetMax": 1700000}, None, "Financement refusé")],
    "atlantic": [("Rachid Ennaji", "CRM_LEAD_BUY", "CRM_QUALIFIED", "agent1", "Avito", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Casablanca", "Mohammedia"], "budgetMax": 2000000}, None, None),
                 ("Nawal Chraïbi", "CRM_LEAD_RENT", "CRM_NEW", "agent2", "PORTAIL", {"transactionTypes": ["RENT"], "categories": ["Appartement"], "cities": ["Mohammedia"], "budgetMax": 6000}, None, None),
                 ("Karim Ouali", "CRM_LEAD_BUY", "CRM_QUALIFYING", "agent2", "Mubawab", {"transactionTypes": ["SALE"], "categories": ["Villa"], "cities": ["Casablanca"], "budgetMax": 9800000}, None, None),
                 ("Lina Berrada", "CRM_LEAD_RENT", "CRM_CLOSED_WON", "manager", "Recommandation", {"transactionTypes": ["RENT"], "cities": ["Casablanca"], "budgetMax": 9000}, None, None)],
    "agdal": [("Famille El Ouardi", "CRM_LEAD_BUY", "CRM_VISIT_PLANNED", "agent1", "PORTAIL", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Rabat"], "budgetMax": 2000000, "surfaceMin": 100}, ("P13",), None),
              ("Saïd Benhima", "CRM_LEAD_BUY", "CRM_QUALIFIED", "agent1", "Mubawab", {"transactionTypes": ["SALE"], "categories": ["Villa"], "cities": ["Rabat"], "budgetMin": 10000000, "budgetMax": 13000000}, None, None),
              ("Claire Dubois", "CRM_LEAD_RENT", "CRM_NEW", "agent2", "Avito", {"transactionTypes": ["RENT"], "categories": ["Appartement"], "cities": ["Rabat"], "budgetMax": 10000}, None, None),
              ("Hamid Zniber", "CRM_LEAD_BUY", "CRM_QUALIFYING", "manager", "Agence", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Rabat"], "budgetMax": 1900000}, ("P13",), None)],
    "souissi": [("M. et Mme Lindqvist", "CRM_LEAD_BUY", "CRM_QUALIFIED", "agent1", "Recommandation", {"transactionTypes": ["SALE"], "categories": ["Villa"], "cities": ["Rabat"], "budgetMin": 11000000, "budgetMax": 13000000}, None, None),
                ("Driss Alaoui", "CRM_LEAD_BUY", "CRM_QUALIFYING", "agent2", "Mubawab", {"transactionTypes": ["SALE"], "categories": ["Terrain"], "cities": ["Rabat"], "budgetMax": 2000000}, None, None),
                ("Famille Kettani", "CRM_LEAD_BUY", "CRM_NEW", "agent2", "Agence", {"transactionTypes": ["SALE"], "categories": ["Villa"], "cities": ["Rabat"], "budgetMax": 8000000}, None, None),
                ("Patrick Moreau", "CRM_LEAD_BUY", "CRM_CLOSED_LOST", "manager", "PORTAIL", {"transactionTypes": ["SALE"], "categories": ["Villa"], "cities": ["Rabat"], "budgetMax": 6000000}, None, "Budget insuffisant pour Souissi")],
    "palmeraie": [("James Wilson", "CRM_LEAD_BUY", "CRM_QUALIFIED", "agent1", "PORTAIL", {"transactionTypes": ["SALE"], "categories": ["Riad"], "cities": ["Marrakech"], "budgetMin": 2500000, "budgetMax": 3300000}, ("P17",), None),
                  ("Céline Petit", "CRM_LEAD_BUY", "CRM_VISIT_PLANNED", "agent2", "Mubawab", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Marrakech"], "budgetMax": 1300000}, None, None),
                  ("Famille Bouhaddou", "CRM_LEAD_RENT", "CRM_QUALIFYING", "agent2", "Agence", {"transactionTypes": ["RENT"], "categories": ["Villa"], "cities": ["Marrakech"], "budgetMax": 26000}, None, None),
                  ("Marco Rossi", "CRM_LEAD_BUY", "CRM_NEW", "manager", "Recommandation", {"transactionTypes": ["SALE"], "categories": ["Riad", "Villa"], "cities": ["Marrakech"], "budgetMax": 4000000}, ("P17",), None)],
    "kech": [("Ayoub Lamrini", "CRM_LEAD_BUY", "CRM_NEW", "agent1", "Avito", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Marrakech"], "budgetMax": 1100000}, None, None),
             ("Sanaa Fikri", "CRM_LEAD_RENT", "CRM_QUALIFYING", "agent2", "Agence", {"transactionTypes": ["RENT"], "categories": ["Appartement"], "cities": ["Marrakech"], "budgetMax": 6000}, None, None),
             ("Bilal Haddad", "CRM_LEAD_BUY", "CRM_QUALIFIED", "manager", "Mubawab", {"transactionTypes": ["SALE"], "categories": ["Appartement"], "cities": ["Marrakech"], "budgetMax": 1400000}, None, None),
             ("Leïla Amrani", "CRM_LEAD_RENT", "CRM_NEW", "agent1", "PORTAIL", {"transactionTypes": ["RENT"], "cities": ["Marrakech"], "budgetMax": 5000}, None, None)],
}
SRC_ENUM = {"PORTAIL": "WEB", "Mubawab": "WEB", "Avito": "WEB", "Recommandation": "REFERRAL", "Agence": "WALK_IN"}
phone_n = 0
LEAD_LIST = []
for ag, leads in LEADS.items():
    for i, (name, case, code, slug, src, crit, annonce_prop, loss) in enumerate(leads):
        phone_n += 1
        usr = u(ag, slug)
        ann = (AG[ag]["org"], P[annonce_prop[0]]["title"]) if annonce_prop else None
        email = name.lower().split(" — ")[0].replace(" ", ".").replace("ï", "i").replace("é", "e").replace("á", "a") + "@exemple.ma" if i % 2 == 0 else None
        notes = {"CRM_NEW": "Premier contact, à rappeler pour qualifier le projet.",
                 "CRM_QUALIFYING": "Projet en cours de qualification : financement et calendrier à confirmer.",
                 "CRM_QUALIFIED": "Projet qualifié : financement validé, recherche active.",
                 "CRM_VISIT_PLANNED": "Visite planifiée, client très motivé.",
                 "CRM_CLOSED_WON": "Transaction conclue.",
                 "CRM_CLOSED_LOST": "Projet abandonné."}[code]
        dossier(AG[ag]["org"], name, case, code, phone=f"+2126610{phone_n:05d}", email=email, lead_source=src, source=SRC_ENUM[src],
                assignee=usr, annonce=ann, notes=notes, criteria=crit, created=3 + (phone_n * 7) % 40,
                loss=loss, won="Bail signé" if code == "CRM_CLOSED_WON" and case == "CRM_LEAD_RENT" else ("Achat conclu" if code == "CRM_CLOSED_WON" else None))
        LEAD_LIST.append((ag, name, case, code, usr))

# Contacts reçus par les propriétaires sur leurs annonces (espace propriétaire)
OWNER_LEADS = [
    ("P02", "Amine Tahiri", "CRM_VISIT_PLANNED", 6, [("INBOUND", "Bonjour, le studio est-il toujours disponible pour le mois prochain ?", 6 * 24),
                                                     ("OUTBOUND", "Bonjour, oui il est disponible. Voulez-vous le visiter ?", 6 * 24 - 2),
                                                     ("INBOUND", "Oui, samedi matin si possible.", 5 * 24)]),
    ("P02", "Sofia Mansouri", "CRM_NEW", 1, [("INBOUND", "Bonjour, les charges sont-elles comprises dans le loyer ?", 20)]),
    ("P08", "Ali Benchekroun", "CRM_NEW", 2, [("INBOUND", "Bonjour, je suis intéressé par la villa. Le prix est-il négociable ?", 40)]),
    ("P20", "Emma Schneider", "CRM_QUALIFIED", 8, [("INBOUND", "Hello, is the flat available from January? I work at the Palais des congrès.", 8 * 24),
                                                   ("OUTBOUND", "Hello, yes it is available from January 1st.", 8 * 24 - 5)]),
    ("P16", "Hassan Bouziane", "CRM_NEW", 3, [("INBOUND", "Bonjour, le terrain est-il titré et viabilisé ?", 3 * 24)]),
]
for k, name, code, d, _ in OWNER_LEADS:
    p = P[k]; phone_n += 1
    dossier(p["own"]["org"], name, "CRM_LEAD_RENT" if p["tx"] == "RENT" else "CRM_LEAD_BUY", code, phone=f"+2126610{phone_n:05d}",
            lead_source="PORTAIL", source="WEB", annonce=(p["own"]["org"], p["title"]), created=d,
            notes="Contact reçu depuis l'annonce du portail.", created_by="anonymousUser")

w("-- Dossiers : mandats côté agence, acquéreurs et locataires, contacts des propriétaires")
rows = []
for d in DOSSIERS:
    a = d["assignee"]
    rows.append(dict(org_id=q(d["org"]), annonce_id=annonce_id(*d["annonce"]) if d["annonce"] else "NULL",
                     lead_phone=q(d["phone"]), lead_name=q(d["lead_name"]), lead_email=q(d["email"]), lead_source=q(d["lead_source"]),
                     source=q(d["source"]), status=q(STATUS_ENUM[d["code"]]), case_type=q(d["case"]), status_code=q(d["code"]),
                     notes=q(d["notes"]), loss_reason=q(d["loss"]), won_reason=q(d["won"]),
                     search_criteria=js(d["criteria"]) if d["criteria"] else "NULL",
                     search_criteria_updated_at=ago(d["created"]) if d["criteria"] else "NULL",
                     assigned_to=q(a["sub"] if a else None), assigned_to_name=q(a["name"] if a else None),
                     assigned_at=ago(d["created"]) if a else "NULL", locale=q("fr"),
                     created_at=ago(d["created"]), updated_at=ago(max(d["created"] - 2, 0)),
                     created_by=q(d["created_by"] or (a["sub"] if a else "system")), updated_by=q(a["sub"] if a else "system")))
insert("dossier", rows)

w("-- Liens mandat → dossier de l'agence")
for m in MANDATES:
    w(f"UPDATE mandate SET dossier_id = {dossier_id(AG[m['ag']]['org'], P[m['k']]['own']['display'])} WHERE id = {mandate_id(m['k'])};")
w()

w("-- Parties prenantes")
rows = []
for d in DOSSIERS:
    role = ("OWNER" if d["lead_source"] == "BOURSE_MANDATS" else
            "TENANT" if d["case"] == "CRM_LEAD_RENT" else "BUYER")
    parts = d["lead_name"].split(" ")
    rows.append(dict(org_id=q(d["org"]), dossier_id=dossier_id(d["org"], d["lead_name"]), role=q(role), name=q(d["lead_name"]),
                     first_name=q(parts[0]), last_name=q(" ".join(parts[1:]) or None), phone=q(d["phone"]), email=q(d["email"]),
                     created_at=ago(d["created"]), updated_at=ago(d["created"]), created_by=q("system"), updated_by=q("system")))
insert("partie_prenante", rows)

# ------------------------------------------------------------------ activités

w("-- Activités : notes internes et événements visibles du propriétaire (CLIENT_VISIBLE)")
rows = []
def act(org, lead_name, typ, content, vis, days, by, hours=0):
    rows.append(dict(org_id=q(org), dossier_id=dossier_id(org, lead_name), type=q(typ), content=q(content), visibility=q(vis),
                     created_at=ago(days, hours), updated_at=ago(days, hours), created_by=q(by), updated_by=q(by)))

VISIBLE = {
    "P01": [("STATUS_CHANGE", "Annonce publiée sur le portail Atlas, Mubawab et nos réseaux.", 33),
            ("APPOINTMENT_COMPLETED", "Visite avec un couple de Casablanca : retour très positif sur la vue et la luminosité.", 12),
            ("NOTE", "Deux acquéreurs intéressés après les visites du week-end, une offre est attendue cette semaine.", 4)],
    "P07": [("STATUS_CHANGE", "Annonce publiée, visite virtuelle en ligne.", 43),
            ("APPOINTMENT_COMPLETED", "Contre-visite avec Mme Laurent et son architecte.", 9),
            ("NOTE", "Offre acceptée : rendez-vous chez le notaire pour le compromis à fixer.", 2)],
    "P09": [("STATUS_CHANGE", "Annonce publiée, 14 demandes de visite la première semaine.", 29),
            ("NOTE", "Trois dossiers de locataires complets reçus, deux visites programmées cette semaine.", 3)],
    "P13": [("STATUS_CHANGE", "Annonce publiée avec photos professionnelles.", 78),
            ("APPOINTMENT_COMPLETED", "Visite de la famille El Ouardi, deuxième visite demandée.", 6),
            ("NOTE", "Le mandat arrive à échéance dans 10 jours : nous vous proposons de le prolonger d'un mois.", 1)],
    "P17": [("STATUS_CHANGE", "Annonce publiée en français, anglais et espagnol.", 25),
            ("APPOINTMENT_COMPLETED", "Visite en visio avec un acquéreur britannique, puis sur place.", 7),
            ("NOTE", "Offre reçue, transmise dans votre espace.", 2)],
    "P05": [("STATUS_CHANGE", "Annonce publiée.", 100), ("NOTE", "Compromis signé chez Me Bennani.", 30), ("STATUS_CHANGE", "Acte de vente signé, mandat terminé.", 15)],
    "P15": [("STATUS_CHANGE", "Annonce publiée.", 64), ("NOTE", "Bail signé avec une famille, entrée dans les lieux le 1er du mois.", 40)],
}
INTERNAL = {
    "P01": "Négociation possible jusqu'à 1,40 M d'après le propriétaire (ne pas communiquer).",
    "P07": "Mme Laurent finance sans crédit : compromis possible sous 15 jours.",
    "P13": "Proposer une baisse de prix de 3 % au propriétaire si pas d'offre avant l'échéance.",
    "P17": "L'acquéreur demande une remise des meubles : à chiffrer.",
    "P11": "Le propriétaire a vendu via une connaissance ; rester en contact pour son autre bien.",
}
for m in MANDATES:
    org = AG[m["ag"]]["org"]; lead = P[m["k"]]["own"]["display"]; by = u(m["ag"], m["agent"])["sub"]
    for typ, content, days in VISIBLE.get(m["k"], []):
        act(org, lead, typ, content, "CLIENT_VISIBLE", days, by)
    if m["k"] in INTERNAL:
        act(org, lead, "NOTE", INTERNAL[m["k"]], "INTERNAL", 5, by)
for ag, name, case, code, usr in LEAD_LIST:
    org = AG[ag]["org"]
    act(org, name, "NOTE", {"CRM_NEW": "Appel entrant, projet à qualifier.",
                            "CRM_QUALIFYING": "Rendez-vous téléphonique : budget confirmé, attend l'accord de sa banque.",
                            "CRM_QUALIFIED": "Accord de principe de la banque reçu. Envoyer une sélection de biens.",
                            "CRM_VISIT_PLANNED": "Visite confirmée par WhatsApp.",
                            "CRM_CLOSED_WON": "Signature effectuée, dossier clos.",
                            "CRM_CLOSED_LOST": "Le client a abandonné son projet chez nous."}[code], "INTERNAL", 2, usr["sub"])
insert("activity", rows)

# ------------------------------------------------------------------ messagerie des propriétaires

w("-- Conversations des propriétaires avec les contacts reçus (messagerie de la plateforme)")
insert("lead_conversation", [dict(org_id=q(P[k]["own"]["org"]), dossier_id=dossier_id(P[k]["own"]["org"], name),
                                  owner_last_read_at="NULL" if code == "CRM_NEW" else ago(hours=msgs[-1][2]),
                                  prospect_last_read_at=ago(hours=msgs[-1][2]), owner_alerted_at=ago(hours=msgs[0][2]), prospect_alerted_at="NULL",
                                  created_at=ago(d), updated_at=ago(hours=msgs[-1][2]), created_by=q("anonymousUser"), updated_by=q("anonymousUser"))
                             for k, name, code, d, msgs in OWNER_LEADS])
rows = []
for k, name, code, d, msgs in OWNER_LEADS:
    org = P[k]["own"]["org"]
    for direction, body, h in msgs:
        rows.append(dict(org_id=q(org), dossier_id=dossier_id(org, name), channel=q("IN_APP"), direction=q(direction), content=q(body),
                         timestamp=ago(hours=h), created_at=ago(hours=h), updated_at=ago(hours=h),
                         created_by=q(P[k]["own"]["sub"] if direction == "OUTBOUND" else "anonymousUser"),
                         updated_by=q(P[k]["own"]["sub"] if direction == "OUTBOUND" else "anonymousUser")))
insert("message", rows)

# ------------------------------------------------------------------ rendez-vous et tâches

w("-- Visites")
rows = []
def appt(org, lead, start, end, location, assignee, status, notes):
    rows.append(dict(org_id=q(org), dossier_id=dossier_id(org, lead), start_time=start, end_time=end, location=q(location),
                     assigned_to=q(assignee), notes=q(notes), status=q(status), reminder_sent=q(False), created_at=ago(3), updated_at=ago(1),
                     created_by=q(assignee or "system"), updated_by=q(assignee or "system")))
for ag, name, case, code, usr in LEAD_LIST:
    if code != "CRM_VISIT_PLANNED": continue
    org = AG[ag]["org"]
    zone = AG[ag]["zones"][0]
    appt(org, name, at_day(2, 10), at_day(2, 11), f"{zone[1] or zone[0]}, {zone[0]}", usr["sub"], "SCHEDULED", "Visite confirmée avec le client, prévoir les plans.")
for m in MANDATES:
    if m["k"] in ("P01", "P13", "P17", "P07"):
        org = AG[m["ag"]]["org"]; p = P[m["k"]]
        appt(org, p["own"]["display"], at_day(-6, 15), at_day(-6, 16), f"{p['address']}, {p['district']}, {p['city']}", u(m["ag"], m["agent"])["sub"],
             "COMPLETED", "Visite acquéreur effectuée.")
    if m["k"] in ("P09", "P13"):
        org = AG[m["ag"]]["org"]; p = P[m["k"]]
        appt(org, p["own"]["display"], at_day(1, 17), at_day(1, 18), f"{p['address']}, {p['district']}, {p['city']}", u(m["ag"], m["agent"])["sub"],
             "SCHEDULED", "Visite programmée avec un candidat.")
appt(P["P02"]["own"]["org"], "Amine Tahiri", at_day(3, 11), at_day(3, 12), "8 avenue Pasteur, Centre, Tanger", None, "SCHEDULED", "Visite proposée par la propriétaire.")
insert("appointment", rows)

w("-- Tâches des équipes")
rows = []
TASKS = [
    ("detroit", "agent1", "Nadia I.", "Transmettre la contre-proposition à l'acquéreur", "HIGH", "TODO", -1),
    ("detroit", "manager", None, "Répondre à la demande de la villa de Boubana", "HIGH", "IN_PROGRESS", 0),
    ("casaprestige", "agent1", "Salma E.", "Fixer le rendez-vous de compromis chez le notaire", "URGENT", "TODO", -2),
    ("maarif", "agent1", "Omar T.", "Vérifier les garants des candidats locataires", "MEDIUM", "TODO", -3),
    ("agdal", "agent1", "Leïla B.", "Proposer la prolongation du mandat", "HIGH", "TODO", -2),
    ("palmeraie", "agent1", "Fatima Zahra L.", "Chiffrer la reprise des meubles du riad", "MEDIUM", "TODO", -4),
    ("tangerimmo", "manager", None, "Répondre à la demande directe du local commercial", "URGENT", "TODO", 0),
    ("iberia", "agent1", "Karim B.", "Faire signer le mandat à M. Benjelloun", "HIGH", "TODO", -5),
    ("souissi", "agent1", None, "Préparer l'engagement de confidentialité pour la villa Souissi", "MEDIUM", "COMPLETED", 1),
    ("atlantic", "agent1", "Rachid Ennaji", "Envoyer une sélection de biens à Rachid Ennaji", "LOW", "TODO", -1),
]
for ag, slug, lead, title, prio, status, due in TASKS:
    usr = u(ag, slug); org = AG[ag]["org"]
    rows.append(dict(org_id=q(org), dossier_id=dossier_id(org, lead) if lead else "NULL", assigned_to=q(usr["sub"]), title=q(title),
                     description="NULL", due_date=at_day(-due, 18), priority=q(prio), status=q(status),
                     completed_at=ago(1) if status == "COMPLETED" else "NULL", created_at=ago(3), updated_at=ago(1),
                     created_by=q(usr["sub"]), updated_by=q(usr["sub"])))
insert("task", rows)

# ------------------------------------------------------------------ offres et avis

w("-- Offres transmises par les agences mandatées et réponses des propriétaires")
OFFERS = [
    ("P01", "detroit", 1380000, "Couple de Casablanca, prêt bancaire accordé", "Compromis sous 30 jours, sous réserve du prêt.", 7, "OFFER_PENDING", None, None, 2),
    ("P01", "detroit", 1300000, "Investisseur, achat comptant", None, None, "OFFER_COUNTERED", 1420000, "Prix ferme au-dessus de 1,42 M.", 9),
    ("P07", "casaprestige", 3850000, "Particulier, achat sans crédit", "Signature du compromis sous 15 jours.", None, "OFFER_ACCEPTED", None, "D'accord, merci pour votre réactivité.", 4),
    ("P07", "casaprestige", 3600000, "Famille expatriée", None, None, "OFFER_REFUSED", None, "Trop bas.", 12),
    ("P17", "palmeraie", 3000000, "Acquéreur britannique, fonds disponibles", "Avec les meubles, signature sous 6 semaines.", 14, "OFFER_PENDING", None, None, 2),
]
rows = []
for k, ag, amount, buyer, cond, valid, status, counter, comment, days in OFFERS:
    m = next(x for x in MANDATES if x["k"] == k)
    by = u(ag, m["agent"])["sub"]
    decided = status != "OFFER_PENDING"
    rows.append(dict(mandate_id=mandate_id(k), owner_org_id=q(P[k]["own"]["org"]), agency_org_id=q(AG[ag]["org"]), amount=q(amount),
                     currency=q("MAD"), buyer_summary=q(buyer), conditions=q(cond), valid_until=date_in(valid) if valid else "NULL",
                     status=q(status), counter_amount=q(counter), owner_comment=q(comment), created_by=q(by), created_at=ago(days),
                     decided_at=ago(days - 1) if decided else "NULL", updated_at=ago(max(days - 1, 0))))
insert("mandate_offer", rows)

w("-- Avis vérifiés (un par mandat signé puis terminé)")
REVIEWS = [("P05", "detroit", 5, "Vendu en 6 semaines au prix demandé, suivi sérieux et visites bien préparées.", 14),
           ("P15", "agdal", 4, "Locataire trouvé en trois semaines, bon suivi. Un peu lents à répondre au début.", 38),
           ("P11", "maarif", 3, "Peu de visites en deux mois, j'ai finalement vendu par moi-même.", 29)]
insert("agency_review", [dict(mandate_id=mandate_id(k), owner_org_id=q(P[k]["own"]["org"]), agency_org_id=q(AG[ag]["org"]), rating=str(r),
                              comment=q(c), created_at=ago(d)) for k, ag, r, c, d in REVIEWS])

# ------------------------------------------------------------------ notifications

w("-- Notifications non lues dans l'espace Pro")
NOTIFS = [
    ("detroit", "manager", "Nouvelle demande dans votre zone", "Un propriétaire cherche une agence pour vendre à Boubana, Tanger.", "/pro/mandats", 70),
    ("iberia", "manager", "Un propriétaire vous invite", "Un propriétaire de Boubana, Tanger vous invite à lui faire une proposition.", "/pro/mandats", 50),
    ("detroit", "agent1", "Réponse du propriétaire à une offre", "Le propriétaire répond à l'offre de 1 300 000 MAD par une contre-proposition à 1 420 000 MAD.", "/pro/mandats", 200),
    ("casaprestige", "agent1", "Réponse du propriétaire à une offre", "Le propriétaire accepte l'offre de 3 850 000 MAD.", "/pro/mandats", 90),
    ("tangerimmo", "manager", "Rappel : demande directe sans réponse", "Un propriétaire de Tanger attend votre réponse depuis 48 h.", "/pro/mandats", 2),
    ("casaprestige", "manager", "Nouvelle demande dans votre zone", "Un propriétaire cherche une agence pour vendre à Aïn Diab, Casablanca.", "/pro/mandats", 20),
]
insert("notification", [dict(org_id=q(AG[ag]["org"]), type=q("IN_APP"), status=q("SENT"), template_id=q("in_app_notification"),
                             recipient=q(u(ag, slug)["sub"]), subject=q(s), message=q(msg), action_url=q(url), retry_count="0", max_retries="0",
                             sent_at=ago(hours=h), created_at=ago(hours=h), updated_at=ago(hours=h))
                        for ag, slug, s, msg, url, h in NOTIFS])

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(L))

# Comptes démo (pour la page de connexion et la doc)
accounts = [dict(group="Plateforme", label="Super-admin Atlas", sub="demo-superadmin", name="Équipe Atlas", roles=["SUPER_ADMIN", "ADMIN"], org="DEMO-PLATFORM", email="admin@atlas.demo")]
for a in AGENCIES:
    for s, usr in a["u"].items():
        accounts.append(dict(group=a["name"], label={"directeur": "Directeur", "manager": "Manager"}.get(s, "Agent"), sub=usr["sub"], name=usr["name"],
                             roles=[usr["role"]], org=a["org"], email=usr["email"]))
for n, o in OWN.items():
    accounts.append(dict(group="Propriétaires", label=o["display"], sub=o["sub"], name=f"{o['first']} {o['last']}", roles=["OWNER"], org=o["org"], phone=o["phone"]))
def ts(v):
    if isinstance(v, list): return "[" + ", ".join(ts(x) for x in v) + "]"
    return "'" + str(v).replace("\\", "\\\\").replace("'", "\\'") + "'"

TS_HEADER = """/**
 * Comptes de démonstration (seed backend db/demo/demo-seed.sql) : même sub, rôles et organisation
 * que les données. Connexion par jeton « mock-demo-… », accepté par le backend en mode mock seulement.
 * Généré avec le seed ; à garder aligné avec lui.
 */
export interface DemoAccount {
  group: string;
  label: string;
  sub: string;
  name: string;
  roles: string[];
  orgId: string;
  email?: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
"""
rows = []
for a in accounts:
    parts = [f"group: {ts(a['group'])}", f"label: {ts(a['label'])}", f"sub: {ts(a['sub'])}", f"name: {ts(a['name'])}",
             f"roles: {ts(a['roles'])}", f"orgId: {ts(a['org'])}"]
    if a.get("email"): parts.append(f"email: {ts(a['email'])}")
    rows.append("  { " + ", ".join(parts) + " },")
with open(sys.argv[2], "w", encoding="utf-8") as f:
    f.write(TS_HEADER + "\n".join(rows) + "\n];\n")
print(len(L), "blocs SQL ;", len(accounts), "comptes")
