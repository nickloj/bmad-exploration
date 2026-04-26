'use strict';
// Predefine $$jest-matchers-object as configurable:true so both
// Playwright (expectBundleImpl) and @vitest/expect can coexist.
// The initial value matches Playwright's expected shape exactly.
const sym = Symbol.for('$$jest-matchers-object');
if (!Object.prototype.hasOwnProperty.call(globalThis, sym)) {
  Object.defineProperty(globalThis, sym, {
    configurable: true,
    writable: true,
    value: {
      customEqualityTesters: [],
      matchers: Object.create(null),
      state: {
        assertionCalls: 0,
        expectedAssertionsNumber: null,
        isExpectingAssertions: false,
        numPassingAsserts: 0,
        suppressedErrors: [],
      },
    },
  });
}
