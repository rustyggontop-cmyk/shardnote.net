REAL CLAN LOGIN SETUP

This version uses Supabase Auth. Passwords are handled by Supabase Auth,
not stored in the website or Google Drive.

1. Create a Supabase project.
2. In SQL Editor, run DATABASE.sql.
3. Put your project URL and anon/publishable key into supabase-config.js.
4. Upload all files to your hosting (GitHub Pages works for the front end).
5. In Supabase Auth settings, configure your site URL as https://shardnote.net
   and add your redirect URLs as needed.
6. Change the example invite code in DATABASE.sql before sharing it.

IMPORTANT:
- Never put a Supabase service_role/secret key in the website.
- The invite-code counter in this simple example should be moved to a
  server-side atomic function for strict production enforcement.
