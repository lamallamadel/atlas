-- Étape 4 du backlog : un seul cycle de vie pour les annonces.
-- ACTIVE et PUBLISHED voulaient dire « en ligne » (le portail ne montrait que PUBLISHED) ;
-- PAUSED devient SUSPENDED, avec la raison « pause demandée par l'agence ».
UPDATE annonce SET status = 'PUBLISHED' WHERE status = 'ACTIVE';
UPDATE annonce SET status = 'SUSPENDED' WHERE status = 'PAUSED';
