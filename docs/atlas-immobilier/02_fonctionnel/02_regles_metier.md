# Règles métier (extraits)

## 1) Consentement et communications
- Un message **sortant** via un canal (EMAIL/SMS/PHONE/WHATSAPP) est interdit si la partie prenante est **opt-out** pour ce canal.
- Un message **entrant** est autorisé, mais peut déclencher une proposition de capture de consentement si non présent.
- Le consentement est **horodaté** et **audité**.

## 2) Workflow Dossier (pipeline)
Statuts recommandés :
- NEW → QUALIFYING → QUALIFIED → APPOINTMENT → WON | LOST

Règles (exemples) :
- NEW → QUALIFYING : autorisé si au moins un moyen de contact est présent.
- QUALIFIED → APPOINTMENT : autorisé si un RDV est planifié (ou au minimum une date cible).
- APPOINTMENT → WON/LOST : autorisé si un résultat est saisi (raison de perte si LOST).

## 3) Multi-tenancy
- Toute ressource est liée à un `org_id`.
- Un utilisateur ne peut lire/écrire que les lignes correspondant à son `org_id`.

