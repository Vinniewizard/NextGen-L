import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000/',
  pretendToBeVisual: true
});

Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
  writable: true
});
Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true, writable: true });
Object.defineProperty(globalThis, 'document', { value: dom.window.document, configurable: true, writable: true });
Object.defineProperty(globalThis, 'location', { value: dom.window.location, configurable: true, writable: true });
Object.defineProperty(globalThis, 'localStorage', { value: dom.window.localStorage, configurable: true, writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: dom.window.sessionStorage, configurable: true, writable: true });
const nativeFetch = globalThis.fetch;
globalThis.fetch = (input: any, init?: any) => {
  let url = input;
  if (typeof input === 'string' && input.startsWith('/')) {
    url = `http://localhost:3000${input}`;
  } else if (input instanceof URL && input.pathname.startsWith('/')) {
    url = `http://localhost:3000${input.pathname}${input.search}`;
  }
  return nativeFetch(url, init);
};
(global as any).ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
dom.window.matchMedia = (global as any).matchMedia = () => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
});
let rafCount = 0;
(global as any).requestAnimationFrame = (cb: any) => {
  if (rafCount++ < 5) return setTimeout(cb, 16);
  return 0;
};
(global as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
(dom.window as any).HTMLCanvasElement.prototype.getContext = () => ({
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: [] }),
  putImageData: () => {},
  createImageData: () => ({ data: [] }),
  setTransform: () => {},
  scale: () => {},
  setLineDash: () => {},
  roundRect: () => {},
  createLinearGradient: () => ({ addColorStop: () => {} }),
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  measureText: () => ({ width: 0 }),
});

dom.window.addEventListener('error', (event: any) => {
  console.error('*** CAPTURED WINDOW ERROR:', event.error || event.message);
});

const originalError = console.error;
console.error = (...args) => {
  originalError(...args);
  const msg = args.map(a => typeof a === 'object' ? (a?.stack || a?.message || JSON.stringify(a)) : String(a)).join(' ');
  if (msg.includes('Maximum update depth exceeded')) {
    console.log('*** FOUND REPRODUCIBLE BUG: Maximum update depth exceeded! ***');
    process.exit(1);
  }
};

async function run() {
  dom.window.localStorage.clear();

  const React = await import('react');
  const ReactDOM = await import('react-dom/client');
  const App = (await import('../src/App')).default;

  const root = ReactDOM.createRoot(dom.window.document.getElementById('root')!);
  try {
    root.render(React.createElement(App));
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Guest user render phase complete.');
    process.exit(0);
  } catch (err) {
    console.error('CAUGHT ERROR DURING RENDER:', err);
    process.exit(1);
  }
}

run();
