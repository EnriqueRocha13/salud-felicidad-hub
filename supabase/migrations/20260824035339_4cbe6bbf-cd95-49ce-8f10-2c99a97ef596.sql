CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, service_role;

DO $do$
DECLARE
  r record;
  new_qual text;
  new_check text;
  roles_txt text;
  cmd_txt text;
  stmt text;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
    FROM pg_policies
    WHERE (qual LIKE '%is_admin()%' OR with_check LIKE '%is_admin()%')
  LOOP
    new_qual := replace(replace(coalesce(r.qual, ''), 'public.is_admin()', 'private.is_admin()'), 'is_admin()', 'private.is_admin()');
    new_qual := replace(new_qual, 'private.private.is_admin()', 'private.is_admin()');
    new_check := replace(replace(coalesce(r.with_check, ''), 'public.is_admin()', 'private.is_admin()'), 'is_admin()', 'private.is_admin()');
    new_check := replace(new_check, 'private.private.is_admin()', 'private.is_admin()');

    roles_txt := array_to_string(ARRAY(SELECT quote_ident(x) FROM unnest(r.roles) AS x), ', ');
    cmd_txt := CASE r.cmd WHEN 'ALL' THEN 'ALL' ELSE r.cmd END;

    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);

    stmt := format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      r.policyname, r.schemaname, r.tablename,
      CASE WHEN r.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      cmd_txt, roles_txt);

    IF r.qual IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', new_qual);
    END IF;
    IF r.with_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', new_check);
    END IF;

    EXECUTE stmt;
  END LOOP;
END
$do$;

DROP FUNCTION IF EXISTS public.is_admin();