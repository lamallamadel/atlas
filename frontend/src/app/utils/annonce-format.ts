/** Affichage des annonces côté Pro : libellés de statut en français et prix en devise locale. */

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'En ligne',
  SUSPENDED: 'Suspendue',
  ARCHIVED: 'Archivée',
  // Anciens noms (avant la migration V158)
  ACTIVE: 'En ligne',
  PAUSED: 'Suspendue',
};

export function annonceStatusLabel(status: string | null | undefined): string {
  return (status && STATUS_LABELS[status]) || status || '';
}

/** « 1 450 000 MAD » : devise de l'annonce, dirham par défaut (marché marocain). */
export function formatAnnoncePrice(a: { price?: number | null; currency?: string | null } | null | undefined): string {
  if (!a || a.price === null || a.price === undefined) return '';
  const currency = (a.currency || 'MAD').toUpperCase();
  const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(a.price);
  return `${amount} ${currency === 'EUR' ? '€' : currency}`;
}
