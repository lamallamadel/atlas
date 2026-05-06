/** Config boutons / liens pour états vides (ds-empty-state et legacy empty-state). */
export interface ActionButtonConfig {
  label: string;
  icon?: string;
  handler: () => void;
}

export interface HelpLinkConfig {
  label: string;
  url: string;
}
