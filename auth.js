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
      const betaCode=document.getElementById("beta-code").value.trim().toUpperCase();
      const teamInvite=document.getElementById("team-invite").value.trim().toUpperCase();

      if(!betaCode){
        msg.textContent="A beta access code is required while SHARDNOTE is in beta.";
        return;
      }

      msg.textContent="Checking beta access...";
      const {data:betaValid,error:be}=await sb.rpc("check_beta_access_code",{p_code:betaCode});
      if(be){msg.textContent="Could not verify the beta access code. Please try again.";return;}
      if(!betaValid){msg.textContent="Invalid or already used beta access code.";return;}

      if(teamInvite){
        msg.textContent="Checking team invite...";
        const {data:teamValid,error:te}=await sb.rpc("check_clan_invite",{invite_code:teamInvite});
        if(te){msg.textContent="Could not verify the team invite code. Please try again.";return;}
        if(!teamValid){msg.textContent="Invalid or already used team invite code.";return;}
      }

      const options={data:{username,beta_code:betaCode}};
      if(teamInvite) options.data.team_invite_code=teamInvite;
      const {data,error}=await sb.auth.signUp({email,password,options});
      if(error){
        const m=String(error.message||error);
        if(/already registered|already exists/i.test(m)) msg.textContent="That email is already registered. Try logging in instead.";
        else if(/invalid.*email|email.*invalid/i.test(m)) msg.textContent="Please enter a valid email address.";
        else if(/password/i.test(m)) msg.textContent="Password must be at least 8 characters and meet the account requirements.";
        else if(/rate limit|too many/i.test(m)) msg.textContent="Too many signup attempts. Please wait a few minutes and try again.";
        else if(/smtp|email|sending|provider/i.test(m)) msg.textContent="Account creation failed because the confirmation email could not be sent. Check the Supabase Auth SMTP settings.";
        else msg.textContent="Account creation failed: "+m;
        return;
      }

      msg.textContent = data.session
        ? "Account created successfully! Redirecting to your team dashboard..."
        : (teamInvite ? "Account created successfully! Check your email to confirm your account, then log in." : "Account created successfully! Check your email to confirm your account, then log in and create your team.");
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
      if(!email||!password){msg.textContent="Enter your email and password.";return;}
      msg.textContent="Signing in...";
      const {error}=await sb.auth.signInWithPassword({email,password});
      if(error){
        console.error("SHARDNOTE password login error:",error);
        const m=String(error.message||error);
        if(/invalid login credentials/i.test(m)) msg.textContent="Incorrect email or password.";
        else if(/email not confirmed/i.test(m)) msg.textContent="Please confirm your email before logging in.";
        else msg.textContent="Login failed: "+m;
        return;
      }
      msg.textContent="Login successful. Opening dashboard...";
      location.href="dashboard.html";
    };
  }

  const logout=document.getElementById("logout");
  if(logout){
    logout.onclick=async()=>{await sb.auth.signOut();location.href="index.html"};
    const {data}=await sb.auth.getUser();
    if(!data.user){location.href="login.html";return}
    const memberEl=document.getElementById("member");
    if(memberEl){
      memberEl.textContent="Logged in as "+(data.user.user_metadata?.username || data.user.email)+". You are a SHARDNOTE clan member.";
    }
    if(window.__shardnote_auth_required){document.documentElement.style.visibility="visible";}
  }
}