import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_ETP6cykF.mjs';
import { manifest } from './manifest_D6mkc7VT.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/auth/login.astro.mjs');
const _page2 = () => import('./pages/api/auth/logout.astro.mjs');
const _page3 = () => import('./pages/api/auth/register.astro.mjs');
const _page4 = () => import('./pages/api/events.astro.mjs');
const _page5 = () => import('./pages/api/profile.astro.mjs');
const _page6 = () => import('./pages/api/recipes/generate.astro.mjs');
const _page7 = () => import('./pages/api/recipes/_id_.astro.mjs');
const _page8 = () => import('./pages/api/recipes.astro.mjs');
const _page9 = () => import('./pages/app/recipes/_id_.astro.mjs');
const _page10 = () => import('./pages/app.astro.mjs');
const _page11 = () => import('./pages/auth/forgot.astro.mjs');
const _page12 = () => import('./pages/auth/reset.astro.mjs');
const _page13 = () => import('./pages/login.astro.mjs');
const _page14 = () => import('./pages/profile.astro.mjs');
const _page15 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/auth/login.ts", _page1],
    ["src/pages/api/auth/logout.ts", _page2],
    ["src/pages/api/auth/register.ts", _page3],
    ["src/pages/api/events.ts", _page4],
    ["src/pages/api/profile/index.ts", _page5],
    ["src/pages/api/recipes/generate.ts", _page6],
    ["src/pages/api/recipes/[id].ts", _page7],
    ["src/pages/api/recipes/index.ts", _page8],
    ["src/pages/app/recipes/[id].astro", _page9],
    ["src/pages/app.astro", _page10],
    ["src/pages/auth/forgot.astro", _page11],
    ["src/pages/auth/reset.astro", _page12],
    ["src/pages/login.astro", _page13],
    ["src/pages/profile.astro", _page14],
    ["src/pages/index.astro", _page15]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "39dccd8c-fc4d-40f7-84f4-81a27cd1bf8b",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
