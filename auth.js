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
      if(ve){ msg.textContent="Could not verify the invite code. Please try again."; return; } if(!valid){msg.textContent="Invalid or exhausted clan invite code.";return}

      msg.textContent="Creating account...";
      const {data,error}=await sb.auth.signUp({
        email,password,options:{data:{username}}
      });
      if(error){
        // If the invite was consumed but account creation failed, do not reveal
        // backend details. The user can request another invite from an admin.
        const m=String(error.message||error);
        if(/already registered|already exists/i.test(m)) msg.textContent="That email is already registered. Try logging in instead.";
        else if(/invalid.*email|email.*invalid/i.test(m)) msg.textContent="Please enter a valid email address.";
        else if(/password/i.test(m)) msg.textContent="Password must be at least 8 characters and meet the account requirements.";
        else if(/rate limit|too many/i.test(m)) msg.textContent="Too many signup attempts. Please wait a few minutes and try again.";
        else if(/smtp|email|sending|provider/i.test(m)) msg.textContent="Account creation worked, but the confirmation email could not be sent. Check the email service settings.";
        else msg.textContent="Account creation failed: "+m;
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
    let codeSent=false;
    login.onsubmit=async e=>{
      e.preventDefault();
      const msg=document.getElementById("msg");
      const email=document.getElementById("email").value.trim();
      if(!codeSent){
        msg.textContent="Sending your login code...";
        const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:false}});
        if(error){
          console.error("SHARDNOTE OTP error:", error);
          const m=String(error.message||error);
          if(/rate limit|too many/i.test(m)) msg.textContent="Too many login-code requests. Please wait a few minutes and try again.";
          else if(/smtp|email|sending|provider/i.test(m)) msg.textContent="Email service error: the login email could not be sent. Check the SHARDNOTE email/SMTP setup.";
          else if(/not found|sign up|user/i.test(m)) msg.textContent="No SHARDNOTE account was found for this email.";
          else msg.textContent="Login code could not be sent: "+m;
          return;
        }
        codeSent=true;
        document.getElementById("password-wrap").style.display="none";
        document.getElementById("otp-wrap").style.display="block";
        document.getElementById("otp").required=true;
        document.getElementById("login-btn").textContent="VERIFY CODE";
        msg.textContent="Check your email for the 6-digit login code.";
        return;
      }
      const token=document.getElementById("otp").value.trim();
      const {error}=await sb.auth.verifyOtp({email,token,type:"email"});
      if(error){
        console.error("SHARDNOTE OTP verification error:", error);
        const m=String(error.message||error);
        if(/expired|invalid/i.test(m)) msg.textContent="That code is invalid or expired. Request a new code.";
        else msg.textContent="Login code verification failed: "+m;
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
    document.getElementById("member").textContent=
      "Logged in as "+(data.user.user_metadata?.username || data.user.email)+". You are a SHARDNOTE clan member.";
    if(window.__shardnote_auth_required){document.documentElement.style.visibility="visible";}
  }
}