// Global window type extensions for third-party integrations

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId?: string | Date | object,
      config?: object
    ) => void;
  }
}

export {};
