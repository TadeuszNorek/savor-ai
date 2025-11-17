import { d as defineMiddleware, s as sequence } from './chunks/index_BJTcjAc7.mjs';
import { s as supabaseClient, c as createSupabaseServerInstance } from './chunks/supabase.client_Dmi2Rupz.mjs';
import 'es-module-lexer';
import './chunks/astro-designed-error-pages_DPQ1si_P.mjs';
import 'kleur/colors';
import './chunks/astro/server_VvUFyhd8.mjs';
import 'clsx';
import 'cookie';

const PUBLIC_PATHS = [
  "/",
  // Homepage (temporary redirect to /login, future: landing page)
  "/login",
  "/auth/forgot",
  "/auth/reset",
  "/profile",
  // Client-side auth guard (401 from API → redirect)
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout"
];
const onRequest$1 = defineMiddleware(async (context, next) => {
  const { locals, cookies, url, request, redirect } = context;
  locals.supabase = supabaseClient;
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }
  if (url.pathname.startsWith("/app")) {
    return next();
  }
  if (url.pathname.startsWith("/api/")) {
    return next();
  }
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers
  });
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email
    };
  } else {
    return redirect("/login");
  }
  return next();
});

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
