-- Security hardening: pin search_path for helper functions used in RLS and triggers.

alter function public.update_updated_at_column()
  set search_path = public;

alter function public.is_admin(uuid)
  set search_path = public;

alter function public.coach_has_client_interaction(uuid, uuid)
  set search_path = public;
