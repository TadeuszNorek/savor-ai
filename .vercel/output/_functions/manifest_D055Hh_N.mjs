import 'kleur/colors';
import { o as decodeKey } from './chunks/astro/server_VvUFyhd8.mjs';
import 'clsx';
import 'cookie';
import './chunks/astro-designed-error-pages_DPQ1si_P.mjs';
import 'es-module-lexer';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/noop-middleware_Bgczr26q.mjs';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///D:/projects/savor-ai/","cacheDir":"file:///D:/projects/savor-ai/node_modules/.astro/","outDir":"file:///D:/projects/savor-ai/dist/","srcDir":"file:///D:/projects/savor-ai/src/","publicDir":"file:///D:/projects/savor-ai/public/","buildClientDir":"file:///D:/projects/savor-ai/dist/client/","buildServerDir":"file:///D:/projects/savor-ai/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/auth/login","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/auth\\/login\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}],[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/auth/login.ts","pathname":"/api/auth/login","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/auth/logout","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/auth\\/logout\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}],[{"content":"logout","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/auth/logout.ts","pathname":"/api/auth/logout","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/auth/register","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/auth\\/register\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}],[{"content":"register","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/auth/register.ts","pathname":"/api/auth/register","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/events","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/events\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"events","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/events.ts","pathname":"/api/events","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/profile","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/profile\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"profile","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/profile/index.ts","pathname":"/api/profile","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/recipes/generate","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/recipes\\/generate\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"recipes","dynamic":false,"spread":false}],[{"content":"generate","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/recipes/generate.ts","pathname":"/api/recipes/generate","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/recipes/[id]","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/recipes\\/([^/]+?)\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"recipes","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/api/recipes/[id].ts","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/recipes","isIndex":true,"type":"endpoint","pattern":"^\\/api\\/recipes\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"recipes","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/recipes/index.ts","pathname":"/api/recipes","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/app.BTT4DGKy.css"}],"routeData":{"route":"/app/recipes/[id]","isIndex":false,"type":"page","pattern":"^\\/app\\/recipes\\/([^/]+?)\\/?$","segments":[[{"content":"app","dynamic":false,"spread":false}],[{"content":"recipes","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/app/recipes/[id].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/app.BTT4DGKy.css"}],"routeData":{"route":"/app","isIndex":false,"type":"page","pattern":"^\\/app\\/?$","segments":[[{"content":"app","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/app.astro","pathname":"/app","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/app.BTT4DGKy.css"}],"routeData":{"route":"/auth/forgot","isIndex":false,"type":"page","pattern":"^\\/auth\\/forgot\\/?$","segments":[[{"content":"auth","dynamic":false,"spread":false}],[{"content":"forgot","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/auth/forgot.astro","pathname":"/auth/forgot","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/app.BTT4DGKy.css"}],"routeData":{"route":"/auth/reset","isIndex":false,"type":"page","pattern":"^\\/auth\\/reset\\/?$","segments":[[{"content":"auth","dynamic":false,"spread":false}],[{"content":"reset","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/auth/reset.astro","pathname":"/auth/reset","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/app.BTT4DGKy.css"}],"routeData":{"route":"/login","isIndex":false,"type":"page","pattern":"^\\/login\\/?$","segments":[[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/login.astro","pathname":"/login","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/app.BTT4DGKy.css"}],"routeData":{"route":"/profile","isIndex":false,"type":"page","pattern":"^\\/profile\\/?$","segments":[[{"content":"profile","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/profile.astro","pathname":"/profile","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["D:/projects/savor-ai/src/pages/app.astro",{"propagation":"none","containsHead":true}],["D:/projects/savor-ai/src/pages/app/recipes/[id].astro",{"propagation":"none","containsHead":true}],["D:/projects/savor-ai/src/pages/auth/forgot.astro",{"propagation":"none","containsHead":true}],["D:/projects/savor-ai/src/pages/auth/reset.astro",{"propagation":"none","containsHead":true}],["D:/projects/savor-ai/src/pages/login.astro",{"propagation":"none","containsHead":true}],["D:/projects/savor-ai/src/pages/profile.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000astro-internal:middleware":"_astro-internal_middleware.mjs","\u0000noop-actions":"_noop-actions.mjs","\u0000@astro-page:src/pages/api/auth/login@_@ts":"pages/api/auth/login.astro.mjs","\u0000@astro-page:src/pages/api/auth/logout@_@ts":"pages/api/auth/logout.astro.mjs","\u0000@astro-page:src/pages/api/auth/register@_@ts":"pages/api/auth/register.astro.mjs","\u0000@astro-page:src/pages/api/events@_@ts":"pages/api/events.astro.mjs","\u0000@astro-page:src/pages/api/profile/index@_@ts":"pages/api/profile.astro.mjs","\u0000@astro-page:src/pages/api/recipes/generate@_@ts":"pages/api/recipes/generate.astro.mjs","\u0000@astro-page:src/pages/api/recipes/[id]@_@ts":"pages/api/recipes/_id_.astro.mjs","\u0000@astro-page:src/pages/api/recipes/index@_@ts":"pages/api/recipes.astro.mjs","\u0000@astro-page:src/pages/app/recipes/[id]@_@astro":"pages/app/recipes/_id_.astro.mjs","\u0000@astro-page:src/pages/app@_@astro":"pages/app.astro.mjs","\u0000@astro-page:src/pages/auth/forgot@_@astro":"pages/auth/forgot.astro.mjs","\u0000@astro-page:src/pages/auth/reset@_@astro":"pages/auth/reset.astro.mjs","\u0000@astro-page:src/pages/login@_@astro":"pages/login.astro.mjs","\u0000@astro-page:src/pages/profile@_@astro":"pages/profile.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_D055Hh_N.mjs","D:/projects/savor-ai/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_B-4KDcPX.mjs","D:/projects/savor-ai/src/components/auth/ResetPasswordForm":"_astro/ResetPasswordForm.Cvyjpx-x.js","D:/projects/savor-ai/src/components/auth/ForgotPasswordForm":"_astro/ForgotPasswordForm.m-xHUNom.js","D:/projects/savor-ai/src/components/auth/AuthForm":"_astro/AuthForm.OgP34uNc.js","D:/projects/savor-ai/src/components/app/AppPage":"_astro/AppPage.DN8KUeLj.js","D:/projects/savor-ai/src/components/LoginThemeToggle":"_astro/LoginThemeToggle.repJibcl.js","D:/projects/savor-ai/src/components/ProfilePage":"_astro/ProfilePage.DVi_05Ie.js","D:/projects/savor-ai/src/components/AppShell":"_astro/AppShell.d20xWsOo.js","@astrojs/react/client.js":"_astro/client.vG5bEfRi.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/app.BTT4DGKy.css","/favicon.svg","/icon-sa.svg","/mask-icon.svg","/_astro/AppPage.DN8KUeLj.js","/_astro/AppShell.d20xWsOo.js","/_astro/AuthForm.OgP34uNc.js","/_astro/circle-check-big.Dlp_mO0o.js","/_astro/client.vG5bEfRi.js","/_astro/Combination.X7r7J2UN.js","/_astro/createLucideIcon.Dkxjm4wi.js","/_astro/DarkModeToggle.BEg8hsAg.js","/_astro/EmailInput.BWulBbGa.js","/_astro/ForgotPasswordForm.m-xHUNom.js","/_astro/index.BkdHoFEG.js","/_astro/index.D3EqsrrG.js","/_astro/index.yjdR7O-I.js","/_astro/label.Di0WFfjI.js","/_astro/LoginThemeToggle.repJibcl.js","/_astro/PasswordInput.p3a-TrsH.js","/_astro/ProfilePage.DVi_05Ie.js","/_astro/ResetPasswordForm.Cvyjpx-x.js","/_astro/sonner.hCFXhOXH.js","/_astro/supabase.client.D2OLuBHL.js","/_astro/telemetry.C471PJLg.js","/_astro/validation.BULmku4W.js"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"nLrUlEckp/rA9I+T5XZwCjroyI5DZxcdbnSeW76cYGk="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
