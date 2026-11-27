/**
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
  { group: 'Plateforme', label: 'Super-admin Atlas', sub: 'demo-superadmin', name: 'Équipe Atlas', roles: ['SUPER_ADMIN', 'ADMIN'], orgId: 'DEMO-PLATFORM', email: 'admin@atlas.demo' },
  { group: 'Agence du Détroit', label: 'Directeur', sub: 'demo-detroit-directeur', name: 'Hassan Amrani', roles: ['ADMIN'], orgId: 'DEMO-DETROIT', email: 'hassan.amrani@detroit.demo' },
  { group: 'Agence du Détroit', label: 'Manager', sub: 'demo-detroit-manager', name: 'Samira Bennis', roles: ['MANAGER'], orgId: 'DEMO-DETROIT', email: 'samira.bennis@detroit.demo' },
  { group: 'Agence du Détroit', label: 'Agent', sub: 'demo-detroit-agent1', name: 'Yassine Alaoui', roles: ['AGENT'], orgId: 'DEMO-DETROIT', email: 'yassine.alaoui@detroit.demo' },
  { group: 'Agence du Détroit', label: 'Agent', sub: 'demo-detroit-agent2', name: 'Imane Zerouali', roles: ['AGENT'], orgId: 'DEMO-DETROIT', email: 'imane.zerouali@detroit.demo' },
  { group: 'Tanger Immo Conseil', label: 'Directeur', sub: 'demo-tangerimmo-directeur', name: 'Mustapha El Khattabi', roles: ['ADMIN'], orgId: 'DEMO-TANGERIMMO', email: 'mustapha.elkhattabi@tangerimmo.demo' },
  { group: 'Tanger Immo Conseil', label: 'Manager', sub: 'demo-tangerimmo-manager', name: 'Khadija Ouazzani', roles: ['MANAGER'], orgId: 'DEMO-TANGERIMMO', email: 'khadija.ouazzani@tangerimmo.demo' },
  { group: 'Tanger Immo Conseil', label: 'Agent', sub: 'demo-tangerimmo-agent1', name: 'Anas Bakkali', roles: ['AGENT'], orgId: 'DEMO-TANGERIMMO', email: 'anas.bakkali@tangerimmo.demo' },
  { group: 'Tanger Immo Conseil', label: 'Agent', sub: 'demo-tangerimmo-agent2', name: 'Houda Rifi', roles: ['AGENT'], orgId: 'DEMO-TANGERIMMO', email: 'houda.rifi@tangerimmo.demo' },
  { group: 'Iberia Habitat', label: 'Directeur', sub: 'demo-iberia-directeur', name: 'Driss Benmoussa', roles: ['ADMIN'], orgId: 'DEMO-IBERIA', email: 'driss.benmoussa@iberia.demo' },
  { group: 'Iberia Habitat', label: 'Manager', sub: 'demo-iberia-manager', name: 'Najat El Amrani', roles: ['MANAGER'], orgId: 'DEMO-IBERIA', email: 'najat.elamrani@iberia.demo' },
  { group: 'Iberia Habitat', label: 'Agent', sub: 'demo-iberia-agent1', name: 'Mehdi Ouahbi', roles: ['AGENT'], orgId: 'DEMO-IBERIA', email: 'mehdi.ouahbi@iberia.demo' },
  { group: 'Iberia Habitat', label: 'Agent', sub: 'demo-iberia-agent2', name: 'Sara Tahiri', roles: ['AGENT'], orgId: 'DEMO-IBERIA', email: 'sara.tahiri@iberia.demo' },
  { group: 'Casa Prestige Immobilier', label: 'Directeur', sub: 'demo-casaprestige-directeur', name: 'Kamal Lazrak', roles: ['ADMIN'], orgId: 'DEMO-CASAPRESTIGE', email: 'kamal.lazrak@casaprestige.demo' },
  { group: 'Casa Prestige Immobilier', label: 'Manager', sub: 'demo-casaprestige-manager', name: 'Ghita Benkirane', roles: ['MANAGER'], orgId: 'DEMO-CASAPRESTIGE', email: 'ghita.benkirane@casaprestige.demo' },
  { group: 'Casa Prestige Immobilier', label: 'Agent', sub: 'demo-casaprestige-agent1', name: 'Adil Sqalli', roles: ['AGENT'], orgId: 'DEMO-CASAPRESTIGE', email: 'adil.sqalli@casaprestige.demo' },
  { group: 'Casa Prestige Immobilier', label: 'Agent', sub: 'demo-casaprestige-agent2', name: 'Nour Berrada', roles: ['AGENT'], orgId: 'DEMO-CASAPRESTIGE', email: 'nour.berrada@casaprestige.demo' },
  { group: 'Maârif Immo', label: 'Directeur', sub: 'demo-maarif-directeur', name: 'Abdelaziz Hajji', roles: ['ADMIN'], orgId: 'DEMO-MAARIF', email: 'abdelaziz.hajji@maarif.demo' },
  { group: 'Maârif Immo', label: 'Manager', sub: 'demo-maarif-manager', name: 'Siham Mernissi', roles: ['MANAGER'], orgId: 'DEMO-MAARIF', email: 'siham.mernissi@maarif.demo' },
  { group: 'Maârif Immo', label: 'Agent', sub: 'demo-maarif-agent1', name: 'Reda Chami', roles: ['AGENT'], orgId: 'DEMO-MAARIF', email: 'reda.chami@maarif.demo' },
  { group: 'Maârif Immo', label: 'Agent', sub: 'demo-maarif-agent2', name: 'Loubna Kettani', roles: ['AGENT'], orgId: 'DEMO-MAARIF', email: 'loubna.kettani@maarif.demo' },
  { group: 'Atlantic Habitat', label: 'Directeur', sub: 'demo-atlantic-directeur', name: 'Jamal Bouzid', roles: ['ADMIN'], orgId: 'DEMO-ATLANTIC', email: 'jamal.bouzid@atlantic.demo' },
  { group: 'Atlantic Habitat', label: 'Manager', sub: 'demo-atlantic-manager', name: 'Asmae Filali', roles: ['MANAGER'], orgId: 'DEMO-ATLANTIC', email: 'asmae.filali@atlantic.demo' },
  { group: 'Atlantic Habitat', label: 'Agent', sub: 'demo-atlantic-agent1', name: 'Othmane Naciri', roles: ['AGENT'], orgId: 'DEMO-ATLANTIC', email: 'othmane.naciri@atlantic.demo' },
  { group: 'Atlantic Habitat', label: 'Agent', sub: 'demo-atlantic-agent2', name: 'Kenza Belhaj', roles: ['AGENT'], orgId: 'DEMO-ATLANTIC', email: 'kenza.belhaj@atlantic.demo' },
  { group: 'Rabat Agdal Immobilier', label: 'Directeur', sub: 'demo-agdal-directeur', name: 'Noureddine Squalli', roles: ['ADMIN'], orgId: 'DEMO-AGDAL', email: 'noureddine.squalli@agdal.demo' },
  { group: 'Rabat Agdal Immobilier', label: 'Manager', sub: 'demo-agdal-manager', name: 'Hanane Benabdellah', roles: ['MANAGER'], orgId: 'DEMO-AGDAL', email: 'hanane.benabdellah@agdal.demo' },
  { group: 'Rabat Agdal Immobilier', label: 'Agent', sub: 'demo-agdal-agent1', name: 'Ilyas Guessous', roles: ['AGENT'], orgId: 'DEMO-AGDAL', email: 'ilyas.guessous@agdal.demo' },
  { group: 'Rabat Agdal Immobilier', label: 'Agent', sub: 'demo-agdal-agent2', name: 'Zineb Ammor', roles: ['AGENT'], orgId: 'DEMO-AGDAL', email: 'zineb.ammor@agdal.demo' },
  { group: 'Souissi Prestige', label: 'Directeur', sub: 'demo-souissi-directeur', name: 'Mohamed Bennouna', roles: ['ADMIN'], orgId: 'DEMO-SOUISSI', email: 'mohamed.bennouna@souissi.demo' },
  { group: 'Souissi Prestige', label: 'Manager', sub: 'demo-souissi-manager', name: 'Rim Lamrani', roles: ['MANAGER'], orgId: 'DEMO-SOUISSI', email: 'rim.lamrani@souissi.demo' },
  { group: 'Souissi Prestige', label: 'Agent', sub: 'demo-souissi-agent1', name: 'Hamza Skalli', roles: ['AGENT'], orgId: 'DEMO-SOUISSI', email: 'hamza.skalli@souissi.demo' },
  { group: 'Souissi Prestige', label: 'Agent', sub: 'demo-souissi-agent2', name: 'Aya Cherkaoui', roles: ['AGENT'], orgId: 'DEMO-SOUISSI', email: 'aya.cherkaoui@souissi.demo' },
  { group: 'Marrakech Palmeraie Immo', label: 'Directeur', sub: 'demo-palmeraie-directeur', name: 'Abdellah Ouarzazi', roles: ['ADMIN'], orgId: 'DEMO-PALMERAIE', email: 'abdellah.ouarzazi@palmeraie.demo' },
  { group: 'Marrakech Palmeraie Immo', label: 'Manager', sub: 'demo-palmeraie-manager', name: 'Fadwa Tounsi', roles: ['MANAGER'], orgId: 'DEMO-PALMERAIE', email: 'fadwa.tounsi@palmeraie.demo' },
  { group: 'Marrakech Palmeraie Immo', label: 'Agent', sub: 'demo-palmeraie-agent1', name: 'Ismail Marrakchi', roles: ['AGENT'], orgId: 'DEMO-PALMERAIE', email: 'ismail.marrakchi@palmeraie.demo' },
  { group: 'Marrakech Palmeraie Immo', label: 'Agent', sub: 'demo-palmeraie-agent2', name: 'Salma Haddaoui', roles: ['AGENT'], orgId: 'DEMO-PALMERAIE', email: 'salma.haddaoui@palmeraie.demo' },
  { group: 'Kech Immo Nouvelle', label: 'Directeur', sub: 'demo-kech-directeur', name: 'Youness Ait Lahcen', roles: ['ADMIN'], orgId: 'DEMO-KECH', email: 'youness.aitlahcen@kech.demo' },
  { group: 'Kech Immo Nouvelle', label: 'Manager', sub: 'demo-kech-manager', name: 'Wiam Chafik', roles: ['MANAGER'], orgId: 'DEMO-KECH', email: 'wiam.chafik@kech.demo' },
  { group: 'Kech Immo Nouvelle', label: 'Agent', sub: 'demo-kech-agent1', name: 'Saad Amzil', roles: ['AGENT'], orgId: 'DEMO-KECH', email: 'saad.amzil@kech.demo' },
  { group: 'Kech Immo Nouvelle', label: 'Agent', sub: 'demo-kech-agent2', name: 'Oumaima Ennaji', roles: ['AGENT'], orgId: 'DEMO-KECH', email: 'oumaima.ennaji@kech.demo' },
  { group: 'Propriétaires', label: 'Nadia I.', sub: 'demo-owner-01', name: 'Nadia Idrissi', roles: ['OWNER'], orgId: 'OWN-DEMO01' },
  { group: 'Propriétaires', label: 'Karim B.', sub: 'demo-owner-02', name: 'Karim Benjelloun', roles: ['OWNER'], orgId: 'OWN-DEMO02' },
  { group: 'Propriétaires', label: 'Salma E.', sub: 'demo-owner-03', name: 'Salma El Fassi', roles: ['OWNER'], orgId: 'OWN-DEMO03' },
  { group: 'Propriétaires', label: 'Omar T.', sub: 'demo-owner-04', name: 'Omar Tazi', roles: ['OWNER'], orgId: 'OWN-DEMO04' },
  { group: 'Propriétaires', label: 'Leïla B.', sub: 'demo-owner-05', name: 'Leïla Berrada', roles: ['OWNER'], orgId: 'OWN-DEMO05' },
  { group: 'Propriétaires', label: 'Hicham C.', sub: 'demo-owner-06', name: 'Hicham Chraïbi', roles: ['OWNER'], orgId: 'OWN-DEMO06' },
  { group: 'Propriétaires', label: 'Fatima Zahra L.', sub: 'demo-owner-07', name: 'Fatima Zahra Lahlou', roles: ['OWNER'], orgId: 'OWN-DEMO07' },
  { group: 'Propriétaires', label: 'Youssef B.', sub: 'demo-owner-08', name: 'Youssef Bennani', roles: ['OWNER'], orgId: 'OWN-DEMO08' },
  { group: 'Propriétaires', label: 'Meryem A.', sub: 'demo-owner-09', name: 'Meryem Alami', roles: ['OWNER'], orgId: 'OWN-DEMO09' },
  { group: 'Propriétaires', label: 'Rachid S.', sub: 'demo-owner-10', name: 'Rachid Sefrioui', roles: ['OWNER'], orgId: 'OWN-DEMO10' },
];
