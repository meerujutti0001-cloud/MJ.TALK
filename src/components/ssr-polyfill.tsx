"use client";

// Must run at module evaluation — before Next.js HMR initializes
if (typeof window !== "undefined") {
  const _orig = window.matchMedia?.bind(window);

  if (!_orig) {
    // No matchMedia at all — full stub
    (window as unknown as Record<string, unknown>).matchMedia = (query: string): MediaQueryList => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList);
  } else {
    (window as unknown as Record<string, unknown>).matchMedia = (query: string): MediaQueryList => {
      let mql: MediaQueryList;
      try { mql = _orig(query); } catch { return { matches: false, media: query, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false } as MediaQueryList; }
      if (!mql) return mql;

      if (typeof mql.addListener !== "function") {
        try {
          Object.defineProperty(mql, "addListener",    { configurable: true, writable: true, value: (cb: EventListenerOrEventListenerObject) => mql.addEventListener("change", cb) });
          Object.defineProperty(mql, "removeListener", { configurable: true, writable: true, value: (cb: EventListenerOrEventListenerObject) => mql.removeEventListener("change", cb) });
        } catch { /* already defined, non-configurable */ }
      }
      return mql;
    };
  }

  // Suppress the specific HMR TypeError so it doesn't flood the console
  const _consoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (msg.includes("addListener") || (args[0] instanceof TypeError && String(args[0]).includes("addListener"))) return;
    _consoleError(...args);
  };
}

export function SSRPolyfill() {
  return null;
}
