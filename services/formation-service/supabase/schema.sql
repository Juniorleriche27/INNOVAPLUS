-- ============================================================
-- KORYXA FORMATION — DATABASE SCHEMA
-- Supabase PostgreSQL
-- Ce fichier est la source unique de vérité pour la base de données.
-- Pour modifier le schéma : mettre à jour ce fichier et le rejouer.
-- ============================================================


-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    avatar_url  TEXT,
    role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Apprenant'),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- MODULES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title         TEXT NOT NULL,
    description   TEXT NOT NULL,
    order_index   INT  NOT NULL UNIQUE,
    duration      TEXT,
    notebook_path TEXT,
    is_published  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER modules_updated_at
    BEFORE UPDATE ON public.modules
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules(order_index);

INSERT INTO public.modules (title, description, order_index, duration, notebook_path, is_published) VALUES
('Introduction & Installation',        'Mise en place de l''environnement Python, Anaconda et Jupyter Notebook.',          0, '1h00', NULL,                                          TRUE),
('Les Bases de Python pour la Data',   'Variables, types, boucles et fonctions expliqués pas à pas.',                       1, '3h00', 'MODULE_1_Bases_Python_Data.ipynb',           TRUE),
('NumPy : Calcul Numérique',           'Arrays, opérations vectorisées, indexation et slicing.',                            2, '2h30', 'MODULE_2_NumPy_Calcul_Numerique.ipynb',      TRUE),
('Pandas : Manipulation de Données',   'DataFrames, lecture CSV, filtres, tris et groupby.',                                3, '3h00', 'MODULE_3_Pandas_Manipulation_Donnees.ipynb', TRUE),
('Nettoyage de Données',               'Valeurs manquantes, doublons, formats incorrects et outliers.',                     4, '2h30', 'MODULE_4_Nettoyage_Donnees.ipynb',           TRUE),
('Visualisation de Données',           'Graphiques professionnels avec Matplotlib et Seaborn.',                             5, '2h30', 'MODULE_5_Visualisation_Donnees.ipynb',       TRUE),
('Analyse Exploratoire (EDA)',          'Méthodologie complète d''exploration d''un dataset.',                               6, '3h00', 'MODULE_6_Analyse_Exploratoire_EDA.ipynb',    TRUE),
('Projet Final Professionnel',         'Analyse complète des ventes KORYXA de A à Z — ton premier projet portfolio.',       7, '4h00', 'MODULE_7_Projet_Final_Professionnel.ipynb',  TRUE)
ON CONFLICT (order_index) DO NOTHING;


-- ============================================================
-- RESOURCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.resources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id   UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    url         TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('video', 'notebook', 'article', 'dataset')),
    description TEXT,
    order_index INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_module ON public.resources(module_id);


-- ============================================================
-- PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.progress (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_id    UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user   ON public.progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_module ON public.progress(module_id);

CREATE OR REPLACE FUNCTION public.get_user_completion(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_total     INT;
    v_completed INT;
BEGIN
    v_total     := (SELECT COUNT(*) FROM public.modules  WHERE is_published = TRUE);
    v_completed := (SELECT COUNT(*) FROM public.progress WHERE user_id = p_user_id AND completed = TRUE);
    IF v_total = 0 THEN RETURN 0; END IF;
    RETURN ROUND((v_completed::NUMERIC / v_total) * 100, 1);
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    certificate_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.certificates(user_id);

CREATE OR REPLACE FUNCTION public.check_and_issue_certificate()
RETURNS TRIGGER AS $$
DECLARE
    v_completion NUMERIC;
BEGIN
    v_completion := public.get_user_completion(NEW.user_id);
    IF v_completion = 100 THEN
        INSERT INTO public.certificates (user_id)
        VALUES (NEW.user_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_progress_updated
    AFTER INSERT OR UPDATE ON public.progress
    FOR EACH ROW EXECUTE FUNCTION public.check_and_issue_certificate();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profil visible par son propriétaire"
    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profil modifiable par son propriétaire"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Modules
CREATE POLICY "Modules visibles par tous les connectés"
    ON public.modules FOR SELECT
    USING (auth.role() = 'authenticated' AND is_published = TRUE);
CREATE POLICY "Admin gère les modules"
    ON public.modules FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Resources
CREATE POLICY "Ressources visibles par tous les connectés"
    ON public.resources FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin gère les ressources"
    ON public.resources FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Progress
CREATE POLICY "Progression visible par son propriétaire"
    ON public.progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Progression créée par son propriétaire"
    ON public.progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Progression modifiable par son propriétaire"
    ON public.progress FOR UPDATE USING (auth.uid() = user_id);

-- Certificates
CREATE POLICY "Certificat visible par son propriétaire"
    ON public.certificates FOR SELECT USING (auth.uid() = user_id);
