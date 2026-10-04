(() => {
  document.documentElement.style.visibility = "hidden";

  const parts = location.pathname.split("/").filter(Boolean);
  const page = (parts[parts.length - 1] || "index").replace(/\.html$/i, "").toLowerCase();

  // These pages must remain reachable while the rest of SHARDNOTE is disabled.
  if (page === "maintenance" || page === "status" || page === "banned") {
    document.documentElement.style.visibility = "visible";
    return;
  }

  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_KEY = window.SUPABASE_ANON_KEY;

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

  const maintenance = () => location.replace("/maintenance/");

  const rpc = async (name, body = {}) => {
    const response = await fetch(
      SUPABASE_URL + "/rest/v1/rpc/" + encodeURIComponent(name),
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify(body)
      }
    );
    if (!response.ok) throw new Error("RPC " + name + " returned HTTP " + response.status);
    return response.json();
  };

  const currentRole = async () => {
    try {
      // Use the Supabase client only for identifying the signed-in user/role.
      if (!window.supabase?.createClient) return null;
      const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data: { user } = {} } = await sb.auth.getUser();
      if (!user) return null;
      const { data: role } = await sb.rpc("current_user_role");
      return role || null;
    } catch (error) {
      console.error("SHARDNOTE role lookup failed:", error);
      return null;
    }
  };

  const run = async () => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("SHARDNOTE: Supabase configuration missing.");
      return;
    }

    let services;
    try {
      services = await rpc("get_service_statuses");
    } catch (error) {
      console.error("SHARDNOTE: Status service unavailable:", error);

      // Fail closed for all protected pages. Login is the only controlled
      // escape route when status data itself cannot be read.
      if (page !== "login") maintenance();
      return;
    }

    const list = Array.isArray(services) ? services : [];
    const website = list.find(x => x.service_key === "website");
    const role = await currentRole();
    const privileged = role === "owner" || role === "co_owner";

    if (website?.manually_disabled && !privileged && page !== "login") {
      maintenance();
      return;
    }

    // Login itself is allowed to load so staff can authenticate, but the
    // login Edge Function rejects non-staff users while Website is disabled.
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
          '<h1>' + String(service.display_name || "SERVICE").replace(/[&<>"]/g, "") + ' IS OFFLINE</h1>' +
          '<p>' + String(service.maintenance_message || "This service is temporarily unavailable.").replace(/[&<>"]/g, "") + '</p>' +
          '<a class="button orange" href="/status/">VIEW STATUS</a>' +
          '</div>';
        document.documentElement.appendChild(overlay);
        return;
      }
    }

    document.documentElement.style.visibility = "visible";
  };

  run().catch(error => {
    console.error("SHARDNOTE site gate failed:", error);
    if (page !== "login") maintenance();
    else document.documentElement.style.visibility = "visible";
  });
})();