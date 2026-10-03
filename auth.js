const script=document.createElement("script");
script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
script.onload=()=>start();
document.head.appendChild(script);

async function start(){
  const {createClient}=supabase;
  const sb=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);

  const register=document.getElementById("register");
  if(register){
    register.onsubmit=async e=>{
      e.preventDefault();
      const msg=document.getElementById("msg");
      const username=document.getElementById("username").value.trim();
      const email=document.getElementById("email").value.trim();
      const password=document.getElementById("password").value;
      const invite=document.getElementById("invite").value.trim().toUpperCase();
      msg.textContent="Checking invite...";

      const {data:valid,error:ve}=await sb.rpc("consume_clan_invite",{invite_code:invite});
      if(ve || !valid){msg.textContent="Invalid or exhausted clan invite code.";return}

      msg.textContent="Creating account...";
      const {data,error}=await sb.auth.signUp({
        email,password,options:{data:{username}}
      });
      if(error){
        // If the invite was consumed but account creation failed, do not reveal
        // backend details. The user can request another invite from an admin.
        msg.textContent=error.message;
        return;
      }

      msg.textContent = data.session
        ? "Account created successfully! Redirecting to your team dashboard..."
        : "Account created successfully! Check your email to confirm your account, then log in.";
      register.reset();
      if(data.session) setTimeout(()=>location.href="dashboard.html",700);
    };
  }

  const login=document.getElementById("login");
  if(login){
    login.onsubmit=async e=>{
      e.preventDefault();
      const msg=document.getElementById("msg");
      const email=document.getElementById("email").value.trim();
      const password=document.getElementById("password").value;
      const {error}=await sb.auth.signInWithPassword({email,password});
      if(error){msg.textContent=error.message;return}
      location.href="dashboard.html";
    };
  }

  const logout=document.getElementById("logout");
  if(logout){
    logout.onclick=async()=>{await sb.auth.signOut();location.href="index.html"};
    const {data}=await sb.auth.getUser();
    if(!data.user){location.href="login.html";return}
    document.getElementById("member").textContent=
      "Logged in as "+(data.user.user_metadata?.username || data.user.email)+". You are a SHARDNOTE clan member.";
    if(window.__shardnote_auth_required){document.documentElement.style.visibility="visible";}
  }
}