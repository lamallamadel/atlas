import { Component } from '@angular/core';
@Component({
    selector: 'app-mentions-legales', template: `
  <div class="at-container" style="padding-block:var(--ds-space-12);max-width:800px;">
    <h1 style="font-family:var(--ds-font-display);font-size:var(--ds-text-2xl);margin-bottom:var(--ds-space-6);">Mentions légales</h1>
    <p style="color:var(--ds-text-muted);font-size:var(--ds-text-sm);line-height:1.8;margin-bottom:var(--ds-space-5);">
      <strong>Raison sociale :</strong> Atlasia Technologies SARL<br>
      <strong>Siège social :</strong> Casablanca, Maroc<br>
      <strong>ICE :</strong> 000000000000000<br>
      <strong>Directeur de publication :</strong> Direction Atlasia<br>
      <strong>Hébergemont :</strong> Atlasia Technologies — Casablanca, Maroc
    </p>
    <p style="color:var(--ds-text-muted);font-size:var(--ds-text-sm);line-height:1.8;">Ce site est édité par Atlasia Technologies SARL conformément aux régulations marocaines en vigueur. Toute reproduction partielle ou totale du contenu est interdite sans accord préalable écrit.</p>
  </div>
`
})
export class MentionsLegalesComponent {}
