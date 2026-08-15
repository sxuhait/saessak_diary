-- Found by `supabase db advisors --type security` during a pre-launch audit.
--
-- 1) function_search_path_mutable: current_mentor_role/current_mentor_blocked/
--    set_updated_at didn't pin search_path. They already fully-qualify every
--    identifier they touch (public.mentors, public.is_volunteer_expired), so
--    this isn't currently exploitable, but pinning it is a cheap, standard
--    hardening step recommended by Supabase's linter.
--
-- 2) anon/authenticated_security_definer_function_executable: is_volunteer_expired
--    and mentor_last_activity are SECURITY DEFINER (they bypass RLS on purpose,
--    to check *any* mentor's activity/expiry from within RLS policies -- see
--    20260806120000). That migration already ran
--    `revoke execute ... from public; grant execute ... to authenticated;`,
--    but Supabase auto-grants EXECUTE on every new `public` schema function to
--    anon/authenticated/service_role at creation time via default privileges --
--    revoking from the PUBLIC pseudo-role does NOT undo grants already made
--    directly to those roles. Net effect: both functions were still callable
--    by anon (unauthenticated) via `/rest/v1/rpc/...`, letting anyone probe any
--    mentor's last-activity timestamp or volunteer-expiry status by UUID with
--    zero auth. This explicitly revokes from anon while keeping the documented
--    authenticated-only access intact.
--
--    handle_new_mentor() is a trigger function (`returns trigger`) never meant
--    to be called directly -- doing so via RPC would just error since `NEW`
--    isn't bound outside trigger context, but it was still exposed to both
--    anon and authenticated through the same default-privilege gap. Revoked
--    from both; the trigger itself is unaffected since triggers run under the
--    function owner's privileges, not the caller's.

alter function public.current_mentor_role() set search_path = public;
alter function public.current_mentor_blocked() set search_path = public;
alter function public.set_updated_at() set search_path = public;

revoke execute on function public.handle_new_mentor() from anon, authenticated;

revoke execute on function public.is_volunteer_expired(uuid) from anon;
revoke execute on function public.mentor_last_activity(uuid) from anon;

grant execute on function public.is_volunteer_expired(uuid) to authenticated;
grant execute on function public.mentor_last_activity(uuid) to authenticated;
