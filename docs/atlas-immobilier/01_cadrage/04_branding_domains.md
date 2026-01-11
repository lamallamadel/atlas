# Branding & Domaines — Conventions (phase dev)

## Objectif
Figer des conventions *non-techniques* pour éviter les ambiguïtés dans la documentation, tout en gardant la liberté de rebranding plus tard.

> **Décision**: la marque **Atlasia** est conservée pendant la phase de développement (MVP).

---

## 1) 3 sites — convention de nommage (MVP)
Atlasia est structuré en **trois sites** (même produit, audiences différentes) :

- **Portail public (annonces B2C)** : `atlasia.<tld>`
- **Espace Pro / CRM (B2B)** : `pro.atlasia.<tld>`
- **Site vitrine corporate (B2B acquisition)** : `biz.atlasia.<tld>`

Alias recommandé :
- `www.atlasia.<tld>` → redirection **301** vers `atlasia.<tld>`

> `<tld>` est volontairement laissé ouvert (ex: `.ma`, `.immo`, `.com`).  
> Dans certains documents, un exemple en `.ma` peut être utilisé : il doit être interprété comme un *exemple*, pas une contrainte.

---

## 2) Règles SEO minimales (portail)
- **Un seul domaine “primary”** pour le portail (canonical).
- `www.*` ne doit pas être indexé : redirection 301 systématique vers le primary.
- URLs stables (ex: `/annonce/{slug}-{id}`) + redirection 301 si slug change.

---

## 3) Sessions, cookies, et isolation
- **Portail public** : sessions/cookies minimalistes (tracking + consentement).
- **Pro/CRM** : cookies/session **séparés** (subdomain `pro.`).
- **Biz** : idéalement stateless (formulaire démo), sans dépendance aux sessions pro.

> Un SSO (portail ↔ pro) peut être ajouté plus tard, mais n’est pas requis en MVP.

---

## 4) Convention d’environnements (recommandée)
Exemple de mapping (à adapter) :

- **Dev local** : `localhost` (ports séparés)
- **Staging** : `staging.atlasia.<tld>`, `pro.staging.atlasia.<tld>`, `biz.staging.atlasia.<tld>`
- **Prod** : `atlasia.<tld>`, `pro.atlasia.<tld>`, `biz.atlasia.<tld>`

---

## 5) Rebranding futur (sans casser le produit)
Le rebranding doit rester un changement “couche marque” :
- domaines, logo, wording UI, assets
- sans modification des référentiels métier (`*_code`), workflows, ni contrats API.

Cela garantit un “rename” propre sans refonte fonctionnelle.
