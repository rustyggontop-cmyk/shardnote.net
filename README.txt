SHARDNOTE — CURRENT SETUP

Frontend
- Static frontend hosted through GitHub Pages.
- Shared dark purple/black UI across dashboard, admin, support, settings, teammate finder, and moderation.

Authentication
- Supabase Auth handles accounts.
- Registration requires a username, email, password, and beta access code.
- Email confirmation is completed server-side; users do not need to click a confirmation email.
- Login uses username and password.

Teams
- Every team has its own team record and owner.
- A user can belong to one team at a time.
- Team members use the roles: member, admin, co_owner, owner.
- Only the owner can appoint another co-owner.
- Owners and co-owners can manage team roles; admins can handle moderation tasks.

Teammate Finder
- The Find Teammates page searches across SHARDNOTE teams.
- Results expose only public profile information: username, team name, avatar, bio, Steam profile, and custom tag.

Profiles
- Settings supports profile pictures, bios, and Steam profile URLs.
- Avatar files are stored in the Supabase avatars bucket.
- Profile information is shown in team lists and teammate search.

Tags
- Each user can create one custom tag with a custom color.
- Users cannot delete their own tags through the table API.
- Owner/co-owner/admin users can remove a member's tag through the protected admin operation.

Moderation
- Users can submit cheater reports with player details and evidence.
- Admin roles can review reports for their team.

Security
- Do not put service-role keys or Brevo secrets in the public repository.
- Authorization is determined server-side from the team_members role.
- Sensitive admin operations are protected by authenticated checks and team scoping.
