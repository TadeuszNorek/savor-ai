import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_VvUFyhd8.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CEGH4ugq.mjs';
export { renderers } from '../renderers.mjs';

const $$App = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "SavorAI - Recipe Generator & Catalog" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-4 h-[calc(100vh-4rem)]"> ${renderComponent($$result2, "AppPage", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "D:/projects/savor-ai/src/components/app/AppPage", "client:component-export": "AppPage" })} </main> ` })}`;
}, "D:/projects/savor-ai/src/pages/app.astro", void 0);

const $$file = "D:/projects/savor-ai/src/pages/app.astro";
const $$url = "/app";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$App,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
