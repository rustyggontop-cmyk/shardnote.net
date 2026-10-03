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

      const {data:code,error:ce}=await sb.from("clan_invites")
        .select("code,uses,max_uses,active")
        .eq("code",invite).eq("active",true).maybeSingle();

      if(ce){msg.textContent="Could not validate the invite. Try again.";return}
      if(!code || code.uses>=code.max_uses){msg.textContent="Invalid or exhausted clan invite code.";return}

      msg.textContent="Creating account...";
      const {data,error}=await sb.auth.signUp({
        email,password,
        options:{data:{username,invite_code:invite}}
      });

      if(error){msg.textContent=error.message;return}
      msg.textContent=data.session
        ? "Account created. Welcome to SHARDNOTE!"
        : "Account created. Check your email to confirm, then log in.";
      register.reset();
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
  }
}