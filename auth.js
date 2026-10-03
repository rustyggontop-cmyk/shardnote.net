const startWhenReady=()=>start();
if(window.supabase){startWhenReady();}
else{
  const script=document.createElement("script");
  script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.onload=startWhenReady;
  document.head.appendChild(script);
}

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
      msg.textContent="Creating account...";
      try{
        const response=await fetch(window.SUPABASE_URL+"/functions/v1/register-user",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,email,password})});
        const result=await response.json();
        if(!response.ok){msg.textContent=result.error||"Account creation failed.";return;}
        if(result.session){
          const {error:setError}=await sb.auth.setSession({access_token:result.session.access_token,refresh_token:result.session.refresh_token});
          if(setError){msg.textContent="Account created. Log in with your username and password.";return;}
          msg.textContent="Account created. You can now create your own team.";
          setTimeout(()=>location.href="/dashboard/",500);
          return;
        }
        msg.textContent="Account created. Log in with your username and password.";
        register.reset();
      }catch(err){msg.textContent="Account creation failed. Please try again.";console.error(err);}
    };
  }

  const login=document.getElementById("login");
  if(login){
    login.onsubmit=async e=>{
      e.preventDefault();
      const msg=document.getElementById("msg");
      const username=document.getElementById("username").value.trim();
      const password=document.getElementById("password").value;
      if(!username||!password){msg.textContent="Enter your username and password.";return;}
      msg.textContent="Signing in...";
      try{
        const response=await fetch(window.SUPABASE_URL+"/functions/v1/login-with-username",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});
        const result=await response.json();
        if(response.status===423){location.href="/maintenance/";return;}
        if(!response.ok||!result.session){msg.textContent=result.error||"Incorrect username or password.";return;}
        const {error:setError}=await sb.auth.setSession({access_token:result.session.access_token,refresh_token:result.session.refresh_token});
        if(setError){msg.textContent="Login failed: "+setError.message;return;}
        msg.textContent="Login successful. Opening dashboard...";
        location.href="/dashboard/";
      }catch(err){msg.textContent="Login failed. Please try again.";console.error(err);}
    };
  }

  const logout=document.getElementById("logout");
  if(logout){
    logout.onclick=async()=>{await sb.auth.signOut();location.href="/"};
    const {data}=await sb.auth.getUser();
    if(!data.user){location.href="/login/";return}
    const memberEl=document.getElementById("member");
    if(memberEl){
      memberEl.textContent="Logged in as "+(data.user.user_metadata?.username || data.user.email)+". You are a SHARDNOTE clan member.";
    }
    if(window.__shardnote_auth_required){document.documentElement.style.visibility="visible";}
  }
}