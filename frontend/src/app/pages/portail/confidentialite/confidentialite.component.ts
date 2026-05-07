import { Component } from '@angular/core';
@Component({
    selector: 'app-confidentialite', template: `
  <div class="at-container" style="padding-block:var(--ds-space-12);max-width:800px;">
    <h1 style="font-family:var(--ds-font-display);font-size:var(--ds-text-2xl);margin-bottom:var(--ds-space-6);">Politique de confidentialité</h1>
    <p style="color:var(--ds-text-muted);font-size:var(--ds-text-sm);line-height:1.8;">Atlasia Technologies SARL s'engage à protéger vos données personnelles conformément à la loi 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel et aux régulations en vigueur au Maroc. Les données collectées sont utilisées uniquement dans le cadre de l'amélioration de nos services et ne sont jamais cédées à des tiers sans votre consentement explicite.</p>
  </div>
`
})
export class ConfidentialiteComponent {}
