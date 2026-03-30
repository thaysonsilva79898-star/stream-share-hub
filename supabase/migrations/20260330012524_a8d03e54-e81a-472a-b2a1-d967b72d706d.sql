-- IPTV credentials table
CREATE TABLE IF NOT EXISTS public.iptv_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  host TEXT NOT NULL DEFAULT 'http://cdnflash.top:80',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  bot_source TEXT DEFAULT 'seven_tv'
);

ALTER TABLE public.iptv_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active credentials" ON public.iptv_credentials
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- App users table (linked to Google auth)
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  account_expires_at timestamp with time zone,
  is_permanent boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  ban_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_login timestamp with time zone DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.app_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service can manage all users" ON public.app_users
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- App settings table (admin-controlled)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.app_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Service can manage settings" ON public.app_settings
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

INSERT INTO public.app_settings (key, value) VALUES
  ('maintenance_mode', '{"enabled": false, "message": "Em manutenção"}'::jsonb),
  ('default_host', '"http://cdnflash.top:80"'::jsonb),
  ('admin_emails', '[]'::jsonb),
  ('app_link', '"/"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Trigger to auto-create app_user on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_users (user_id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Share tokens table
CREATE TABLE IF NOT EXISTS public.share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  stream_id integer NOT NULL,
  stream_type text NOT NULL CHECK (stream_type IN ('live', 'movie', 'series')),
  stream_title text NOT NULL,
  stream_url text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  extension text DEFAULT 'ts',
  episode_id integer,
  season_num integer,
  episode_num integer
);

ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read valid tokens" ON public.share_tokens
  FOR SELECT TO anon, authenticated
  USING (expires_at > now());

CREATE POLICY "Authenticated can create tokens" ON public.share_tokens
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE INDEX IF NOT EXISTS idx_share_tokens_token ON public.share_tokens(token);
CREATE INDEX IF NOT EXISTS idx_share_tokens_expires ON public.share_tokens(expires_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.iptv_credentials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;