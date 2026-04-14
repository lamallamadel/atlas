-- V901__seed_atlasia_mocks.sql
-- Seed data for Portail and Vitrine mock UI

INSERT INTO annonce (
    org_id, title, description, category, type, address, surface, city, price, currency, status, photos_json, meta_json, created_at, updated_at, created_by, updated_by
) VALUES
-- 1
('default', 'Villa moderne avec piscine', 'Magnifique villa de standing avec piscine privée, jardin paysager et finitions haut de gamme. Située dans un quartier résidentiel calme à 5 minutes de la plage.', 'VILLA', 'SALE', 'Aïn Diab', 320, 'Casablanca', 4200000, 'MAD', 'PUBLISHED', 
'["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"]', 
'{"slug": "villa-moderne-ain-diab", "pieces": 5, "agent": {"name": "Karim A.", "agency": "Prestige Immo", "initials": "KA"}, "verified": true}', 
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),

-- 2
('default', 'Appartement 3 pièces vue mer', 'Bel appartement lumineux avec grande terrasse et vue dégagée. Cuisine équipée, parking inclus. Copropriété sécurisée avec gardien.', 'APPARTEMENT', 'SALE', 'Maârif', 95, 'Casablanca', 1150000, 'MAD', 'PUBLISHED', 
'["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80"]', 
'{"slug": "appartement-maarif", "pieces": 3, "agent": {"name": "Sara F.", "agency": "ImmoPlus", "initials": "SF"}, "verified": true}', 
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),

-- 3
('default', 'Villa en palmeraie — Marrakech', 'Villa d''exception nichée dans la Palmeraie de Marrakech. Riad intérieur, piscine à débordement, espace détente. Un vrai havre de paix à quelques minutes du centre.', 'VILLA', 'SALE', 'Palmeraie', 480, 'Marrakech', 6800000, 'MAD', 'PUBLISHED', 
'["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80"]', 
'{"slug": "villa-palmeraie-marrakech", "pieces": 6, "agent": {"name": "Ahmed B.", "agency": "Maroc Luxury", "initials": "AB"}, "verified": true}', 
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),

-- 4
('default', 'Appt 2 pièces face mer — Tanger', 'Appartement meublé avec vue imprenable sur le détroit de Gibraltar. Idéal pour un professionnel ou expatrié. Disponible immédiatement.', 'APPARTEMENT', 'RENT', 'Malabata', 68, 'Tanger', 7500, 'MAD', 'PUBLISHED', 
'["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80"]', 
'{"slug": "appartement-tanger-malabata", "pieces": 2, "agent": {"name": "Mehdi O.", "agency": "ImmoTanger", "initials": "MO"}, "verified": true}', 
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),

-- 5
('default', 'Studio meublé — centre Agadir', 'Studio entièrement rénové et meublé. Proche commerces, plage à 10 min à pied. Convient pour un séjour longue durée ou résidence principale.', 'STUDIO', 'RENT', 'Centre Ville', 38, 'Agadir', 4200, 'MAD', 'PUBLISHED', 
'["https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800&q=80"]', 
'{"slug": "studio-agadir-centre", "pieces": 1, "agent": {"name": "Youssef K.", "agency": "Immo Sud", "initials": "YK"}, "verified": true}', 
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system'),

-- 6
('default', 'Appartement F4 — Hamria Meknès', 'Appartement spacieux dans immeuble sécurisé. Cuisine équipée, 3 chambres, salon-salle à manger séparés.', 'APPARTEMENT', 'SALE', 'Hamria', 110, 'Meknès', 920000, 'MAD', 'PUBLISHED', 
'["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"]', 
'{"slug": "appartement-meknes-hamria", "pieces": 4, "agent": {"name": "Amina T.", "agency": "Meknès Immo", "initials": "AT"}, "verified": true}', 
CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'system', 'system');
