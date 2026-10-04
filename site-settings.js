(() => {
  document.documentElement.style.visibility = "hidden";

  const getPage = () => {
    const parts = location.pathname.split("/").filter(Boolean);
    return (parts[parts.length - 1] || "index").replace(/\.html$/i, "").toLowerCase();
  };

  const page = getPage();
  const maintenancePage = page === "maintenance";
  const statusPage = page === "status";
  const bannedPage = page === "banned";

  const serviceForPage = () => ({
    index: "website",
    login: "login",
    register: "registration",
    profile: "profiles",
    teammates: "teams",
    dashboard: "dashboard",
    support: "support",
    "report-cheater": "cheater_reports",
    socials: null,
    settings: null,
    admin: null,
    reset: null
  })[page] || null;

  const reveal = () => {
    document.documentElement.style.visibility = "visible";
  };

  const getClient = () => window.supabase?.createClient?.(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

  const getRole = async (sb, user) => {
    if (!user) return null;
    const { data, error } = await sb.rpc("current_user_role");
    if (error) {
      console.error("SHARDNOTE role check failed:", error);
      return null;
    }
    return data || null;
  };

  const redirectIfBanned = async sb => {
    if (bannedPage) return false;

    const { data: { user } = {} } = await sb.auth.getUser().catch(() => ({ data: { user: null } }));
    if (!user) return false;

    const { data, error } = await sb.rpc("is_current_user_banned").catch(() => ({ data: false, error: null }));
    if (!error && data === true) {
      location.replace("/banned/");
      return true;
    }
    return false;
  };

  const redirectIfWebsiteDown = async sb => {
    if (maintenancePage || statusPage) return false;

    const { data: { user } = {} } = await sb.auth.getUser().catch(() => ({ data: { user: null } }));
    const role = await getRole(sb, user);

    // Only Owner and Co-owner can bypass a full Website shutdown.
    if (role === "owner" || role === "co_owner") return false;

    const { data: services, error } = await sb.rpc("get_service_statuses");
    if (error) {
      console.error("SHARDNOTE website status check failed:", error);
      return false;
    }

    const website = Array.isArray(services)
      ? services.find(x => x.service_key === "website")
      : null;

    if (website?.manually_disabled) {
      location.replace("/maintenance/");
      return true;
    }

    return false;
  };

  const showServiceDown = (name, message) => {
    if (document.getElementById("service-down-screen")) return;

    const overlay = document.createElement("div");
    overlay.id = "service-down-screen";
    overlay.innerHTML =
      '<div class="maintenance-card">' +
        '<small>SHARDNOTE / SERVICE</small>' +
        '<h1>' + escapeHtml(name || "SERVICE").toUpperCase() + ' IS OFFLINE</h1>' +
        '<p>' + escapeHtml(message || "This service is temporarily unavailable.") + '</p>' +
        '<p class="support-note">Staff can still access SHARDNOTE.</p>' +
        '<a class="button orange" href="/status/">VIEW STATUS</a>' +
      '</div>';

    document.body.appendChild(overlay);
  };

  const escapeHtml = value =>
    String(value ?? "").replace(/[&<>"]/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    }[char]));

  const enforceServiceShutdown = async sb => {
    if (maintenancePage || statusPage || bannedPage) return false;

    const key = serviceForPage();
    if (!key || key === "website") return false;

    const { data: { user } = {} } = await sb.auth.getUser().catch(() => ({ data: { user: null } }));
    const role = await getRole(sb, user);

    // Owner and Co-owner can access disabled services.
    if (role === "owner" || role === "co_owner") return false;

    const { data: services, error } = await sb.rpc("get_service_statuses");
    if (error) return false;

    const service = Array.isArray(services)
      ? services.find(x => x.service_key === key)
      : null;

    if (service?.manually_disabled) {
      showServiceDown(service.display_name, service.maintenance_message);
      return true;
    }

    return false;
  };

  const load = async sb => {
    if (await redirectIfBanned(sb)) {
      reveal();
      return;
    }

    if (await redirectIfWebsiteDown(sb)) {
      reveal();
      return;
    }

    if (await enforceServiceShutdown(sb)) {
      reveal();
      return;
    }

    reveal();
  };

  (async () => {
    try {
      for (let i = 0; i < 120; i++) {
        if (
          window.supabase &&
          typeof window.supabase.createClient === "function" &&
          window.SUPABASE_URL &&
          window.SUPABASE_ANON_KEY
        ) break;
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const sb = getClient();

      if (!sb) {
        reveal();
        return;
      }

      await load(sb);

      // Keep ban and service shutdown state live without requiring a refresh.
      setInterval(async () => {
        if (document.visibilityState !== "visible") return;
        if (maintenancePage || statusPage || bannedPage) return;
        await load(sb);
      }, 2000);
    } catch (error) {
      console.error("SHARDNOTE site settings error:", error);
      reveal();
    }
  })();
})();