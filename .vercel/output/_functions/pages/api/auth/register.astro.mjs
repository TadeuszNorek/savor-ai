import { c as createSupabaseServerInstance } from '../../../chunks/supabase.client_Dmi2Rupz.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers
    });
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) {
      console.error("Supabase registration error:", error);
      let message = "Registration failed";
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        message = "Email already registered";
      } else if (error.message.includes("Password should be")) {
        message = "Password does not meet requirements";
      } else if (error.message.includes("Invalid email")) {
        message = "Invalid email address";
      } else if (error.message.includes("rate")) {
        message = "Too many attempts. Please try again later";
      } else {
        message = `Registration failed: ${error.message}`;
      }
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(
      JSON.stringify({
        user: {
          id: data.user?.id,
          email: data.user?.email
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Registration error:", err);
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
