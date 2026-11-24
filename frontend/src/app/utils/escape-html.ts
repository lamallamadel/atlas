/**
 * Échappe le HTML d'un texte venu des données (nom de lead, titre…), avant de l'insérer dans du
 * balisage rendu par [innerHTML] avec bypassSecurityTrustHtml. Sans cela, une valeur comme
 * `<img src=x onerror=…>` s'exécute dans le navigateur de l'agent (XSS stockée).
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
