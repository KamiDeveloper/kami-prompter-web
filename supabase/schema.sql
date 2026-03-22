-- 1. Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla: profiles (extiende auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla: user_settings
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_model TEXT DEFAULT 'flash'
    CHECK (default_model IN ('flash', 'pro')),
  default_thinking_level TEXT DEFAULT 'MEDIUM'
    CHECK (default_thinking_level IN ('LOW', 'MEDIUM', 'HIGH')),
  use_paid_key_for_all BOOLEAN DEFAULT FALSE,
  show_nsfw BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'dark'
    CHECK (theme IN ('dark', 'light', 'system')),
  default_export_format TEXT DEFAULT 'markdown',
  prd_default_detail TEXT DEFAULT 'standard'
    CHECK (prd_default_detail IN ('basic', 'standard', 'exhaustive')),
  prd_default_language TEXT DEFAULT 'auto',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla: user_api_keys (referencias a Supabase Vault)
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL CHECK (key_type IN ('flash_free', 'pro_paid')),
  vault_secret_id UUID NOT NULL,
  is_valid BOOLEAN DEFAULT NULL,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key_type)
);

-- 5. Tabla: prompt_history
CREATE TABLE public.prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL
    CHECK (module IN ('improver', 'builder', 'prd')),
  input_prompt TEXT NOT NULL,
  output_prompt TEXT,
  model_used TEXT NOT NULL,
  thinking_level TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabla: template_categories
CREATE TABLE public.template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📁',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabla: prompt_templates
CREATE TABLE public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.template_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_nsfw BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabla: template_tags
CREATE TABLE public.template_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL
    REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_by TEXT DEFAULT 'user' CHECK (created_by IN ('user', 'ai')),
  UNIQUE(template_id, tag)
);

-- 9. Tabla: template_branches
CREATE TABLE public.template_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL
    REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'main',
  content TEXT NOT NULL,
  is_main BOOLEAN DEFAULT FALSE,
  parent_branch_id UUID
    REFERENCES public.template_branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, name)
);

-- 10. Tabla: branch_history
CREATE TABLE public.branch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL
    REFERENCES public.template_branches(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_prompt_history_user_created
  ON public.prompt_history(user_id, created_at DESC);
CREATE INDEX idx_prompt_templates_user
  ON public.prompt_templates(user_id);
CREATE INDEX idx_prompt_templates_category
  ON public.prompt_templates(category_id);
CREATE INDEX idx_template_branches_template
  ON public.template_branches(template_id);
CREATE INDEX idx_template_tags_template
  ON public.template_tags(template_id);
CREATE INDEX idx_template_categories_user
  ON public.template_categories(user_id, sort_order);

-- Full-text search
CREATE INDEX idx_templates_fts
  ON public.prompt_templates
  USING GIN (
    to_tsvector('english',
      name || ' ' || COALESCE(description, '')
    )
  );

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_history ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuario solo accede a sus propios datos
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "settings_own" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "api_keys_own" ON public.user_api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "history_own" ON public.prompt_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "categories_own" ON public.template_categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "templates_own" ON public.prompt_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "tags_via_template" ON public.template_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.prompt_templates t
      WHERE t.id = template_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "branches_via_template" ON public.template_branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.prompt_templates t
      WHERE t.id = template_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "branch_history_via_branch" ON public.branch_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.template_branches b
      JOIN public.prompt_templates t ON t.id = b.template_id
      WHERE b.id = branch_id AND t.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: crear perfil y settings automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);

  -- Categorías predeterminadas
  INSERT INTO public.template_categories (user_id, name, emoji, sort_order)
  VALUES
    (NEW.id, 'Código',     '💻', 0),
    (NEW.id, 'Escritura',  '✍️', 1),
    (NEW.id, 'Análisis',   '📊', 2),
    (NEW.id, 'Imágenes',   '🖼️', 3),
    (NEW.id, 'Agentes',    '🤖', 4);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: updated_at automático para tablas con esa columna
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER set_branches_updated_at
  BEFORE UPDATE ON public.template_branches
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
