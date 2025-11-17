import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_VvUFyhd8.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CEGH4ugq.mjs';
export { renderers } from '../renderers.mjs';

const $$Profile = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "My Profile - SavorAI" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="container mx-auto px-4 py-8 max-w-2xl"> <div class="mb-8"> <h1 class="text-3xl font-bold mb-2">My Dietary Preferences</h1> <p class="text-muted-foreground">
Customize your dietary preferences to receive personalized recipe recommendations.
</p> </div> ${renderComponent($$result2, "ProfilePage", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "D:/projects/savor-ai/src/components/ProfilePage", "client:component-export": "default" })} </main> ` })}`;
}, "D:/projects/savor-ai/src/pages/profile.astro", void 0);

const $$file = "D:/projects/savor-ai/src/pages/profile.astro";
const $$url = "/profile";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Profile,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
