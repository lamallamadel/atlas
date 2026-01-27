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

// JSON module declarations
declare module '*.json' {
  const value: any;
  export default value;
}

declare module '*.animation.json' {
  const value: any;
  export default value;
}

// Lottie-web module declaration
declare module 'lottie-web/build/player/lottie_light' {
  const lottie: any;
  export default lottie;
}

export {};
