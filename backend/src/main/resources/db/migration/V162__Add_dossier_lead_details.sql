-- Informations de qualification saisies par le prospect (ex. formulaire de démo de la vitrine :
-- ville, profil, taille d'équipe, besoins). Lecture seule côté Pro.
ALTER TABLE dossier ADD COLUMN lead_details ${json_type};
