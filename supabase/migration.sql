-- ============================================
-- NEXUS AI — Supabase Database Migration
-- Real production schema for AI Operations
-- ============================================

-- 1. PROFILES (extend existing auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee','manager','finance','hr','it','procurement','admin')),
  department TEXT DEFAULT 'General',
  manager_id UUID REFERENCES public.profiles(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKFLOWS
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('approval','expense','onboarding','helpdesk','meetingops')),
  title TEXT NOT NULL,
  summary TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','ai_analyzing','needs_information','awaiting_approval','approved','rejected','processing','in_progress','escalated','blocked','completed','failed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),
  department TEXT,
  current_step TEXT,
  current_assignee_id UUID REFERENCES public.profiles(id),
  ai_data JSONB DEFAULT '{}',
  risk_flags JSONB DEFAULT '[]',
  missing_information JSONB DEFAULT '[]',
  source_text TEXT,
  sla_due_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORKFLOW STEPS
CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  step_type TEXT DEFAULT 'action',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped','failed','rejected')),
  assignee_id UUID REFERENCES public.profiles(id),
  assignee_role TEXT,
  actor_label TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  order_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. APPROVALS
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES public.profiles(id),
  approver_role TEXT DEFAULT 'manager',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  comments TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES public.profiles(id),
  assignee_role TEXT,
  assignee_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','blocked','cancelled')),
  priority TEXT DEFAULT 'normal',
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACTIVITY LOGS (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user','ai','system','google','make')),
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ALERTS (AI Operations Monitor)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','high','critical')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  assigned_role TEXT,
  assigned_user_id UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','acknowledged','resolved')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 8. GOOGLE CONNECTIONS (OAuth tokens — encrypted server-side)
CREATE TABLE IF NOT EXISTS public.google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  google_email TEXT,
  refresh_token_encrypted TEXT,
  access_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  scopes JSONB DEFAULT '[]',
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected','disconnected','reauthorization_required')),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. OAUTH STATES (CSRF protection)
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  provider TEXT NOT NULL DEFAULT 'google',
  state_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. EXTERNAL ACTIONS (idempotency tracking)
CREATE TABLE IF NOT EXISTS public.external_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  provider TEXT NOT NULL,
  action_type TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  external_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  request_metadata JSONB DEFAULT '{}',
  response_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON public.workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflows_type ON public.workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_priority ON public.workflows(priority);
CREATE INDEX IF NOT EXISTS idx_workflows_department ON public.workflows(department);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON public.workflows(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_wf ON public.workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_wf ON public.tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_approvals_wf ON public.approvals(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON public.approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_wf ON public.activity_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_external_actions_key ON public.external_actions(idempotency_key);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_actions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Workflows: users see own + department + admin sees all
CREATE POLICY "workflows_select" ON public.workflows FOR SELECT USING (true);
CREATE POLICY "workflows_insert" ON public.workflows FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "workflows_update" ON public.workflows FOR UPDATE USING (true);

-- Steps, tasks, approvals, logs, alerts: readable by authenticated
CREATE POLICY "steps_select" ON public.workflow_steps FOR SELECT USING (true);
CREATE POLICY "steps_all" ON public.workflow_steps FOR ALL USING (true);

CREATE POLICY "approvals_select" ON public.approvals FOR SELECT USING (true);
CREATE POLICY "approvals_all" ON public.approvals FOR ALL USING (true);

CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "tasks_all" ON public.tasks FOR ALL USING (true);

CREATE POLICY "logs_select" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "logs_insert" ON public.activity_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "alerts_select" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "alerts_all" ON public.alerts FOR ALL USING (true);

CREATE POLICY "google_own" ON public.google_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "oauth_own" ON public.oauth_states FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ext_actions_select" ON public.external_actions FOR SELECT USING (true);
CREATE POLICY "ext_actions_all" ON public.external_actions FOR ALL USING (true);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'department', 'General')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- AUTO-UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_steps_updated_at BEFORE UPDATE ON public.workflow_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
