import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "admin@rjsportz.com";
const ADMIN_PASSWORD = "Admin@2026";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { password } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Invalid admin password" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Try to find existing admin user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let adminUser = users.find((u) => u.email === ADMIN_EMAIL);

    if (adminUser) {
      // Confirm email + reset password
      await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
        email_confirm: true,
        password: ADMIN_PASSWORD,
      });
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: "Admin" },
      });
      if (error) throw error;
      adminUser = data.user;
    }

    // Sign in with the anon key to get a proper session
    const supabaseAnon = createClient(supabaseUrl, anonKey);
    const { data: session, error: sessionError } = await supabaseAnon.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (sessionError) throw sessionError;

    return new Response(JSON.stringify({ session: session.session }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
