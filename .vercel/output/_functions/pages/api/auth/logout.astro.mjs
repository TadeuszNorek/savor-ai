import { c as createSupabaseServerInstance } from '../../../chunks/supabase.client_Dmi2Rupz.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers
    });
    const { error } = await supabase.auth.signOut();
    if (error) {
      return new Response(JSON.stringify({ error: "Logout failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("Logout error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
