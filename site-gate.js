(() => {
  document.documentElement.style.visibility = "hidden";

  const path = location.pathname.replace(/\/+/g, "/");
  const page = (() => {
    const parts = path.split("/").filter(Boolean);
    return (parts[parts.length - 1] || "index").replace(/\.html$/i, "").toLowerCase();
  })();

  const exempt = page === "maintenance" || page === "status" || page === "banned";

  const serviceForPage = {
    index: "website",
    dashboard: "dashboard",
    login: "login",
    register: "registration",
    profile: "profiles",
    teammates: "teams",
    support: "support",
    "report-cheater": "cheater_reports"
  };

  const reveal = () => {
    document.documentElement.style.visibility = "visible";
  };

  const waitForSupabase = async () => {
    for (let i = 0; i < 200; i++) {
      if (
        window.supabase &&
        typeof window.supabase.createClient === "function" &&
        window.SUPABASE_URL &&
        window.SUPABASE_ANON_KEY
      ) return true;
      await new Promise(r => setTimeout(r, 25));
    }
    return false;
  };

  const getClient = () =>
    window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  const roleOf = async (sb) => {
    const { data: { user } = {} } = await sb.auth.getUser().catch(() => ({ data: { user: null } }));
    if (!user) return { user: null, role: null };
    const { data: role } = await sb.rpc("current_user_role").catch(() => ({ data: null }));
    return { user, role: role || null };
  };

  const redirectToMaintenance = () => {
    location.replace("/maintenance/");
    return true;
  };

  const run = async () => {
    if (exempt) {
      reveal();
      return;
    }

    if (!(await waitForSupabase())) {
      console.error("SHARDNOTE: Supabase failed to initialize.");
      reveal();
      return;
    }

    const sb = getClient();
    const { user, role } = await roleOf(sb);

    // Only the site Owner and Co-owner may bypass a full Website shutdown.
    const privileged = role === "owner" || role === "co_owner";

    // Bans always win over normal site access.
    if (user) {
      const { data: banned } = await sb.rpc("is_current_user_banned").catch(() => ({ data: false }));
      if (banned === true) {
        location.replace("/banned/");
        return;
      }
    }

    const { data: services, error } = await sb.rpc("get_service_statuses");

    // Do not silently treat a failed status read as "online" on protected pages.
    if (error) {
      console.error("SHARDNOTE: Could not read service status:", error);
      reveal();
      return;
    }

    const list = Array.isArray(services) ? services : [];
    const website = list.find(x => x.service_key === "website");

    if (website?.manually_disabled && !privileged) {
      // Login remains available as the controlled authentication escape hatch;
      // the login Edge Function separately rejects non-staff users in maintenance.
      if (page !== "login") {
        redirectToMaintenance();
        return;
      }
    }

    const serviceKey = serviceForPage[page];
    if (serviceKey && serviceKey !== "website" && !privileged) {
      const service = list.find(x => x.service_key === serviceKey);
      if (service?.manually_disabled) {
        document.documentElement.style.visibility = "visible";
        const overlay = document.createElement("div");
        overlay.id = "service-down-screen";
        overlay.innerHTML =
          '<div class="maintenance-card">' +
          '<small>SHARDNOTE / SERVICE</small>' +
          '<h1>' + escapeHtml(service.display_name || "SERVICE").toUpperCase() + ' IS OFFLINE</h1>' +
          '<p>' + escapeHtml(service.maintenance_message || "This service is temporarily unavailable.") + '</p>' +
          '<a class="button orange" href="/status/">VIEW STATUS</a>' +
          '</div>';
        document.body.appendChild(overlay);
        return;
      }
    }

    reveal();
  };

  const escapeHtml = v =>
    String(v ?? "").replace(/[&<>"]/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[c]));

  run().catch(error => {
    console.error("SHARDNOTE gate error:", error);
    reveal();
  });

  window.addEventListener("pageshow", () => {
    if (!exempt && document.documentElement.style.visibility !== "hidden") {
      run().catch(() => reveal());
    }
  });
})();