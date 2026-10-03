SHARDNOTE — CURRENT SETUP

Frontend: GitHub Pages
Repository: rustyggontop-cmyk/shardnote.net
Backend: Supabase
Email: Brevo

Important:
- supabase-config.js contains only the public Supabase browser key.
- Never put a Supabase service-role key or Brevo secret in GitHub.
- Supabase Auth SMTP is configured separately from the Brevo email-sending Edge Function.
- The admin panel checks the logged-in user's role in Supabase.
- Team invite codes are generated per member, five at a time, single-use, and expire weekly.
- Each user can create one custom tag with a custom color.
