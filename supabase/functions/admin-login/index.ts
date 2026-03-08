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
    const { password } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: "Invalid admin password" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try to find existing admin user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let adminUser = users.find((u) => u.email === ADMIN_EMAIL);

    if (adminUser) {
      // Confirm email if not confirmed
      if (!adminUser.email_confirmed_at) {
        await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
          email_confirm: true,
        });
      }
    } else {
      // Create admin user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: "Admin" },
      });
      if (error) throw error;
      adminUser = data.user;
    }

    // Generate a session for the admin
    const { data: signInData, error: signInError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: ADMIN_EMAIL,
      });

    // Sign in with password (now confirmed)
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
    );
    
    const { data: session, error: sessionError } = await supabaseAnon.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (sessionError) {
      // Password might be different - update it
      await supabaseAdmin.auth.admin.updateUserById(adminUser!.id, {
        password: ADMIN_PASSWORD,
      });
      
      // Retry sign in
      const { data: retrySession, error: retryError } = await supabaseAnon.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
      
      if (retryError) throw retryError;
      
      return new Response(JSON.stringify({ session: retrySession.session }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
