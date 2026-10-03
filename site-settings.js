(() => {
  const PUBLIC_KEY = () => ({ url: window.SUPABASE_URL, key: window.SUPABASE_ANON_KEY });
  let currentState = { banner_text: "We've released!! 🥳", maintenance_mode: false };

  const page = () => (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const escape = v => String(v ?? "").replace(/[&<>"]/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;" }[ch]));

  const waitForSupabase = async () => {
    for (let i = 0; i < 100; i++) {
      if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) return true;
      await new Promise(r => setTimeout(r, 50));
    }
    return false;
  };

  const setBanner = text => {
    const value = String(text || "").trim() || "We've released!! 🥳";
    document.querySelectorAll(".release-banner").forEach(el => {
      const header=document.querySelector("header");
      if(header && el.parentElement!==header) header.appendChild(el);
      el.textContent = value;
    });
  };

  const showMaintenance = () => {
    if (document.getElementById("maintenance-screen")) return;
    const overlay = document.createElement("div");
    overlay.id = "maintenance-screen";
    overlay.innerHTML = `
      <div class="maintenance-card">
        <small>SHARDNOTE / MAINTENANCE</small>
        <h1>WE'LL BE RIGHT BACK</h1>
        <p>SHARDNOTE is currently undergoing maintenance.</p>
        <p class="support-note">Only the Site Owner and Co-owner can access the site while maintenance mode is enabled.</p>
        <a class="button orange" href="login.html">STAFF LOGIN</a>
      </div>`;
    document.body.appendChild(overlay);
  };

  const hideMaintenance = () => document.getElementById("maintenance-screen")?.remove();

  const applySettings = async (sb, settings) => {
    currentState = settings || currentState;
    setBanner(currentState.banner_text);
    if (!currentState.maintenance_mode || page() === "login.html") {
      hideMaintenance();
      document.documentElement.style.visibility = "visible";
      return;
    }

    const { data: { user } = {} } = await sb.auth.getUser().catch(() => ({ data: { user: null } }));
    let role = null;
    if (user) {
      const { data } = await sb.rpc("current_user_role").catch(() => ({ data: null }));
      role = data || null;
    }

    if (role === "owner" || role === "co_owner") {
      hideMaintenance();
    } else {
      showMaintenance();
    }
    document.documentElement.style.visibility = "visible";
  };

  const load = async sb => {
    const { data, error } = await sb.rpc("get_site_settings");
    if (!error) {
      const settings = Array.isArray(data) ? data[0] : data;
      if (settings) await applySettings(sb, settings);
    } else {
      setBanner(currentState.banner_text);
      document.documentElement.style.visibility = "visible";
    }
  };

  (async () => {
    if (!(await waitForSupabase())) return;
    const { createClient } = window.supabase;
    const { url, key } = PUBLIC_KEY();
    const sb = createClient(url, key);

    await load(sb);

    try {
      sb.channel("shardnote-site-settings")
        .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, () => load(sb))
        .subscribe();
    } catch (e) {
      console.error("SHARDNOTE site settings realtime failed", e);
    }

    setInterval(() => {
      if (document.visibilityState === "visible") load(sb);
    }, 5000);
  })();
})();