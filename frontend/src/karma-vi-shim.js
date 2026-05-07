/**
 * Minimal Vitest `vi` global for *.spec.ts files executed under Karma + Jasmine.
 * Loaded as the first user file so `jasmine` and `spyOn` already exist.
 */
(function initKarmaViShim() {
  if (typeof globalThis.vi !== 'undefined') {
    return;
  }

  function wrapSpy(spy) {
    spy.mockName = function mockName() {
      return spy;
    };
    spy.mockReturnValue = function mockReturnValue(value) {
      spy.and.returnValue(value);
      return spy;
    };
    spy.mockImplementation = function mockImplementation(fn) {
      spy.and.callFake(fn);
      return spy;
    };
    return spy;
  }

  globalThis.vi = {
    fn: function viFn(implementation) {
      const spy =
        typeof implementation === 'function'
          ? jasmine.createSpy('vi.fn').and.callFake(implementation)
          : jasmine.createSpy('vi.fn');
      return wrapSpy(spy);
    },
    spyOn: function viSpyOn(object, methodName) {
      return wrapSpy(spyOn(object, methodName));
    },
  };
})();
