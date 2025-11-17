import { e as createComponent, f as createAstro, r as renderTemplate, l as renderSlot, k as renderComponent, n as renderHead, h as addAttribute } from './astro/server_VvUFyhd8.mjs';
import 'kleur/colors';
/* empty css                       */

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title = "SavorAI", showHeader = true } = Astro2.props;
  return renderTemplate(_a || (_a = __template(['<html lang="en" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="alternate icon" href="/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="/icon-192.png"><link rel="mask-icon" href="/mask-icon.svg" color="#0F172A"><meta name="generator"', "><title>", '</title><script>\n      // Prevent FOUC (Flash of Unstyled Content) for dark mode\n      // This runs before hydration to apply theme class immediately\n      // Minified to avoid being reformatted by formatters\n      try {const theme=localStorage.getItem("theme")||"system";const resolved=theme==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):theme;document.documentElement.classList.add(resolved)}catch{/* Silently ignore storage errors */}\n    <\/script>', "</head> <body data-astro-cid-sckkx6r4> ", " ", " </body></html>"])), addAttribute(Astro2.generator, "content"), title, renderHead(), showHeader && renderTemplate`${renderComponent($$result, "AppShell", null, { "client:only": "react", "client:component-hydration": "only", "data-astro-cid-sckkx6r4": true, "client:component-path": "D:/projects/savor-ai/src/components/AppShell", "client:component-export": "AppShell" })}`, renderSlot($$result, $$slots["default"]));
}, "D:/projects/savor-ai/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
