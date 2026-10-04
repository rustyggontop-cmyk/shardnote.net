(() => {
document.documentElement.style.visibility="hidden";
const page=()=>{const p=location.pathname.split("/").filter(Boolean);return(p[p.length-1]||"index").replace(/\.html$/i,"").toLowerCase()};
let currentState={banner_text:"We've released!! 🥳"};
const setBanner=text=>{const v=String(text??"").trim();document.querySelectorAll(".release-banner").forEach(el=>{if(!v){el.style.display="none";return}el.style.display="";let target=el.querySelector("strong");if(!target){target=document.createElement("strong");el.replaceChildren(target)}target.textContent=v})};
const isBannedPage=()=>page()==="banned";
const redirectIfBanned=async sb=>{
 if(isBannedPage())return true;
 const {data:userData}=await sb.auth.getUser().catch(()=>({data:{user:null}}));
 if(!userData?.user)return false;
 const {data:banned,error}=await sb.rpc("is_current_user_banned").catch(()=>({data:false,error:null}));
 if(!error&&banned===true){location.replace("/banned");return true}
 return false;
};
const serviceForPage=()=>({index:"website",login:"login",register:"registration",profile:"profiles",teammates:"teams",dashboard:"dashboard",support:"support","report-cheater":"cheater_reports"})[page()]||null;
const showServiceDown=(n,m)=>{if(document.getElementById("service-down-screen"))return;const o=document.createElement("div");o.id="service-down-screen";o.innerHTML='<div class="maintenance-card"><small>SHARDNOTE / SERVICE</small><h1>'+String(n||"SERVICE").toUpperCase()+' IS OFFLINE</h1><p>'+String(m||"This service is temporarily unavailable.")+'</p><p class="support-note">Staff can still access SHARDNOTE.</p><a class="button orange" href="/status/">VIEW STATUS</a></div>';document.body.appendChild(o)};
const applySettings=async(sb,s)=>{currentState=s||currentState;if(await redirectIfBanned(sb)){document.documentElement.style.visibility="visible";return}setBanner(currentState.banner_text);const {data:{user}={}}=await sb.auth.getUser().catch(()=>({data:{user:null}}));let staff=false;if(user){const {data,error}=await sb.rpc("current_user_role");staff=!error&&["owner","co_owner","admin"].includes(data)}const k=serviceForPage();if(k&&!staff){const {data:sv}=await sb.rpc("get_service_statuses").catch(()=>({data:null}));const x=Array.isArray(sv)?sv.find(v=>v.service_key===k):null;if(x?.manually_disabled){showServiceDown(x.display_name,x.maintenance_message);document.documentElement.style.visibility="visible";return}}document.getElementById("service-down-screen")?.remove();document.documentElement.style.visibility="visible"};
const load=async sb=>{if(await redirectIfBanned(sb)){document.documentElement.style.visibility="visible";return}const {data,error}=await sb.rpc("get_site_settings");if(!error){const s=Array.isArray(data)?data[0]:data;if(s)await applySettings(sb,s)}else{setBanner(currentState.banner_text);document.documentElement.style.visibility="visible"}};
(async()=>{for(let i=0;i<100;i++){if(window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY)break;await new Promise(r=>setTimeout(r,50))}if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY){document.documentElement.style.visibility="visible";return}const sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);window.__shardnoteApplySiteSettings=s=>applySettings(sb,s);await load(sb);try{sb.channel("shardnote-site-settings").on("postgres_changes",{event:"*",schema:"public",table:"site_settings"},p=>{const n=p.new;if(n)window.__shardnoteApplySiteSettings(n);else load(sb)}).subscribe()}catch(e){}setInterval(()=>{if(document.visibilityState==="visible")load(sb)},5000)})();
})();