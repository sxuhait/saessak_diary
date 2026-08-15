-- Follow-up to 20260811090000: re-ran `supabase db advisors` after that
-- migration and handle_new_mentor() was still flagged as anon/authenticated
-- callable. Root cause: its EXECUTE grant was made to the PUBLIC pseudo-role
-- (Postgres's default "every role" target), not to anon/authenticated
-- individually -- `revoke ... from anon, authenticated` never touches a
-- PUBLIC-level grant, only `revoke ... from public` does. Confirmed via
-- information_schema.routine_privileges before writing this.
--
-- Also tightening current_mentor_role()/current_mentor_blocked(): they're
-- SECURITY INVOKER (not DEFINER) so anon calling them isn't a data leak on
-- its own, but there's no legitimate reason for anon to call them either --
-- every RLS policy that uses them is already scoped `to authenticated`, so
-- anon never hits them through normal table access. Revoking is just closing
-- an unused door.

revoke execute on function public.handle_new_mentor() from public;

revoke execute on function public.current_mentor_role() from anon;
revoke execute on function public.current_mentor_blocked() from anon;
