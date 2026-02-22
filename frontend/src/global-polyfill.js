/**
 * Polyfill for Node-style `global` in browser (Karma/Jasmine).
 * Required by sockjs-client and other libs that expect `global` to exist.
 * Must run before the application bundle (list this script first in angular.json test options).
 */
var global = (typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this);
if (typeof window !== 'undefined') {
  window.global = global;
}
