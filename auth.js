const script=document.createElement("script");
script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
script.onload=()=>start(); document.head.appendChild(script);

async function start(){
 const {createClient}=supabase;
 const sb=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
 const path=location.pathname;

 if(document.getElementById("register")){
  document.getElementById("register").onsubmit=async e=>{
   e.preventDefault(); const msg=document.getElementById("msg"); msg.textContent="Checking invite...";
   const username=document.getElementById("username").value.trim();
   const email=document.getElementById("email").value.trim();
   const password=document.getElementById("password").value;
   const invite=document.getElementById("invite").value.trim().toUpperCase();
   const {data:code,error:ce}=await sb.from("clan_invites").select("code,uses,max_uses,active").eq("code",invite).eq("active",true).maybeSingle();
   if(ce||!code){msg.textContent="Invalid or inactive clan invite code.";return}
   if(code.uses>=code.max_uses){msg.textContent="That invite code has reached its limit.";return}
   const {data,error}=await sb.auth.signUp({email,password,options:{data:{username,invite_code:invite}}});
   if(error){msg.textContent=error.message;return}
   await sb.from("clan_invites").update({uses:code.uses+1}).eq("code",invite);
   msg.textContent="Account created. Check your email if confirmation is enabled, then log in.";
  };
 }
 if(document.getElementById("login")){
  document.getElementById("login").onsubmit=async e=>{
   e.preventDefault(); const msg=document.getElementById("msg");
   const {error}=await sb.auth.signInWithPassword({email:email.value,password:password.value});
   if(error){msg.textContent=error.message;return} location.href="dashboard.html";
  };
 }
 if(document.getElementById("logout")){
  document.getElementById("logout").onclick=async()=>{await sb.auth.signOut();location.href="index.html"};
  const {data}=await sb.auth.getUser();
  if(!data.user){location.href="login.html";return}
  const username=data.user.user_metadata?.username || data.user.email;
  document.getElementById("member").textContent="Logged in as "+username+". You are a SHARDNOTE clan member.";
 }
}