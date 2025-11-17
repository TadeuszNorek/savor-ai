import { e as createComponent, f as createAstro, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../../chunks/astro/server_VvUFyhd8.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../../chunks/Layout_CEGH4ugq.mjs';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro();
const $$id = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  if (!id) {
    return Astro2.redirect("/app");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Recipe Details - SavorAI" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-4 h-[calc(100vh-4rem)]"> ${renderComponent($$result2, "AppPage", null, { "client:only": "react", "selectedRecipeId": id, "client:component-hydration": "only", "client:component-path": "D:/projects/savor-ai/src/components/app/AppPage", "client:component-export": "AppPage" })} </main> ` })}`;
}, "D:/projects/savor-ai/src/pages/app/recipes/[id].astro", void 0);

const $$file = "D:/projects/savor-ai/src/pages/app/recipes/[id].astro";
const $$url = "/app/recipes/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
