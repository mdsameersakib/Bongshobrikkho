-- 1. CLEANUP (Drop old tables to avoid conflicts)
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS lineage CASCADE;
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS couples CASCADE;
DROP TABLE IF EXISTS persons CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- 3. CORE TABLES

-- Profiles Table (Extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  person_id UUID, -- Links to their own record in the 'persons' table
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Persons Table (Core Family Member Data)
CREATE TABLE public.persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  birth_date DATE,
  death_date DATE,
  is_deceased BOOLEAN DEFAULT FALSE,
  country_of_residence TEXT,
  address TEXT,
  phone_number TEXT,
  email TEXT,
  invite_code TEXT UNIQUE,
  owner_uid UUID REFERENCES auth.users(id) NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the circular reference back to profiles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id) ON DELETE SET NULL;

-- 4. RELATIONSHIP TABLES

-- Parent-Child Junction (Handles single parents, step-children, etc.)
CREATE TABLE public.parent_child (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- Marriages / Unions (Relationship Links)
CREATE TABLE public.marriages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person1_id UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  person2_id UUID REFERENCES public.persons(id) ON DELETE CASCADE NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'married',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (person1_id < person2_id) -- Prevent duplicate reciprocal pairs
);

-- 5. NETWORKING & PRIVACY

-- Network Connections (User-to-User Networking)
CREATE TABLE public.network_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_uid UUID REFERENCES auth.users(id) NOT NULL,
  recipient_uid UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_uid, recipient_uid)
);

-- Privacy Settings (Granular control for the user's branch)
CREATE TABLE public.privacy_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  share_parents BOOLEAN DEFAULT TRUE,
  share_siblings BOOLEAN DEFAULT TRUE,
  share_children BOOLEAN DEFAULT TRUE,
  share_contact_info BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MERGE STAGING (Sub-Tree Reconciliation)

-- Tree Merge Sessions
CREATE TABLE public.tree_merge_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  initiator_uid UUID REFERENCES auth.users(id) NOT NULL,
  target_uid UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Merge Conflicts
CREATE TABLE public.merge_conflicts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.tree_merge_sessions(id) ON DELETE CASCADE NOT NULL,
  node_a_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  node_b_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved_keep_a', 'resolved_keep_b', 'resolved_mixed', 'keep_both_as_separate')),
  resolved_data JSONB, -- Stores field-level resolution (blended fields)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WALL & EVENTS

-- Events Table (Family Timeline)
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
  marriage_id UUID REFERENCES public.marriages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts Table (Family Feed)
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_uid UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reactions Table (Likes, Loves, etc.)
CREATE TABLE public.reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_uid UUID REFERENCES auth.users(id) NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'love', 'haha')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_uid)
);

-- Comments Table
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_uid UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INDEXES (Performance Best Practice)
CREATE INDEX idx_persons_owner_uid ON public.persons(owner_uid);
CREATE INDEX idx_parent_child_parent ON public.parent_child(parent_id);
CREATE INDEX idx_parent_child_child ON public.parent_child(child_id);
CREATE INDEX idx_marriages_person1 ON public.marriages(person1_id);
CREATE INDEX idx_marriages_person2 ON public.marriages(person2_id);
CREATE INDEX idx_network_requester ON public.network_connections(requester_uid);
CREATE INDEX idx_network_recipient ON public.network_connections(recipient_uid);
CREATE INDEX idx_posts_author ON public.posts(author_uid);
CREATE INDEX idx_comments_post ON public.comments(post_id);

-- 9. TRIGGERS (Auto-update updated_at)
CREATE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at_persons BEFORE UPDATE ON public.persons FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at_privacy BEFORE UPDATE ON public.privacy_settings FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at_posts BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at_comments BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- 10. ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_child ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marriages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tree_merge_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merge_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 11. POLICIES

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Persons
CREATE POLICY "Owners have full access to persons" ON public.persons FOR ALL USING (auth.uid() = owner_uid);
CREATE POLICY "Connected users can view public persons" ON public.persons FOR SELECT USING (
  is_private = FALSE AND 
  EXISTS (
    SELECT 1 FROM public.network_connections 
    WHERE status = 'accepted' AND 
    ((requester_uid = auth.uid() AND recipient_uid = owner_uid) OR 
     (requester_uid = owner_uid AND recipient_uid = auth.uid()))
  )
);

-- Relationships
CREATE POLICY "Users can view parent_child links" ON public.parent_child FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.persons WHERE id = parent_id) AND
  EXISTS (SELECT 1 FROM public.persons WHERE id = child_id)
);
CREATE POLICY "Users can manage their owned parent_child links" ON public.parent_child FOR ALL USING (
  EXISTS (SELECT 1 FROM public.persons WHERE id = parent_id AND owner_uid = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.persons WHERE id = child_id AND owner_uid = auth.uid())
);

CREATE POLICY "Users can view marriage links" ON public.marriages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.persons WHERE id = person1_id) AND
  EXISTS (SELECT 1 FROM public.persons WHERE id = person2_id)
);
CREATE POLICY "Users can manage their owned marriage links" ON public.marriages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.persons WHERE id = person1_id AND owner_uid = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.persons WHERE id = person2_id AND owner_uid = auth.uid())
);

-- Connections
CREATE POLICY "Users can view their connections" ON public.network_connections FOR SELECT USING (auth.uid() = requester_uid OR auth.uid() = recipient_uid);
CREATE POLICY "Users can create connection requests" ON public.network_connections FOR INSERT WITH CHECK (auth.uid() = requester_uid);
CREATE POLICY "Recipient can update connection status" ON public.network_connections FOR UPDATE USING (auth.uid() = recipient_uid);

-- Privacy
CREATE POLICY "Users can view their own privacy settings" ON public.privacy_settings FOR SELECT USING (auth.uid() = user_uid);
CREATE POLICY "Users can update their own privacy settings" ON public.privacy_settings FOR UPDATE USING (auth.uid() = user_uid);
CREATE POLICY "Users can create their own privacy settings" ON public.privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_uid);

-- Merge Staging
CREATE POLICY "Users can view their merge sessions" ON public.tree_merge_sessions FOR SELECT USING (auth.uid() = initiator_uid OR auth.uid() = target_uid);
CREATE POLICY "Users can view their merge conflicts" ON public.merge_conflicts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tree_merge_sessions WHERE id = session_id AND (initiator_uid = auth.uid() OR target_uid = auth.uid()))
);

-- Events
CREATE POLICY "Users can view events for people they can see" ON public.events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.persons WHERE id = person_id) OR
  EXISTS (SELECT 1 FROM public.marriages WHERE id = marriage_id)
);
CREATE POLICY "Users can manage events for people they own" ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.persons WHERE id = person_id AND owner_uid = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.marriages WHERE id = marriage_id AND (
    EXISTS (SELECT 1 FROM public.persons WHERE id = person1_id AND owner_uid = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.persons WHERE id = person2_id AND owner_uid = auth.uid())
  ))
);

-- Wall
CREATE POLICY "Users can view posts" ON public.posts FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage their own posts" ON public.posts FOR ALL USING (auth.uid() = author_uid);
CREATE POLICY "Anyone can view reactions" ON public.reactions FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage their own reactions" ON public.reactions FOR ALL USING (auth.uid() = user_uid);
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage their own comments" ON public.comments FOR ALL USING (auth.uid() = author_uid);

-- 12. MERGE RPC FUNCTION
CREATE OR REPLACE FUNCTION public.execute_tree_merge(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r_conflict RECORD;
    initiator_id UUID;
    target_id UUID;
BEGIN
    SELECT initiator_uid, target_uid INTO initiator_id, target_id
    FROM tree_merge_sessions
    WHERE id = p_session_id AND status = 'in_progress';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Merge session not found or already completed.';
    END IF;

    IF auth.uid() != target_id THEN
        RAISE EXCEPTION 'Unauthorized: Only the target user can finalize the merge.';
    END IF;

    FOR r_conflict IN SELECT * FROM merge_conflicts WHERE session_id = p_session_id LOOP
        IF r_conflict.resolution_status = 'keep_both_as_separate' THEN
            CONTINUE;
        END IF;

        IF r_conflict.resolution_status = 'resolved_mixed' AND r_conflict.resolved_data IS NOT NULL THEN
            UPDATE persons 
            SET 
                first_name = COALESCE((r_conflict.resolved_data->>'first_name'), first_name),
                middle_name = COALESCE((r_conflict.resolved_data->>'middle_name'), middle_name),
                last_name = COALESCE((r_conflict.resolved_data->>'last_name'), last_name),
                gender = COALESCE((r_conflict.resolved_data->>'gender'), gender),
                birth_date = CASE WHEN (r_conflict.resolved_data->>'birth_date') IS NOT NULL THEN (r_conflict.resolved_data->>'birth_date')::DATE ELSE birth_date END,
                country_of_residence = COALESCE((r_conflict.resolved_data->>'country_of_residence'), country_of_residence)
            WHERE id = r_conflict.node_b_id;
        END IF;

        DELETE FROM parent_child pc_a USING parent_child pc_b
        WHERE pc_a.child_id = r_conflict.node_a_id AND pc_b.child_id = r_conflict.node_b_id AND pc_a.parent_id = pc_b.parent_id;
        UPDATE parent_child SET child_id = r_conflict.node_b_id WHERE child_id = r_conflict.node_a_id;
        
        DELETE FROM parent_child pc_a USING parent_child pc_b
        WHERE pc_a.parent_id = r_conflict.node_a_id AND pc_b.parent_id = r_conflict.node_b_id AND pc_a.child_id = pc_b.child_id;
        UPDATE parent_child SET parent_id = r_conflict.node_b_id WHERE parent_id = r_conflict.node_a_id;

        DELETE FROM marriages m_a USING marriages m_b
        WHERE (m_a.person1_id = r_conflict.node_a_id OR m_a.person2_id = r_conflict.node_a_id)
          AND (m_b.person1_id = r_conflict.node_b_id OR m_b.person2_id = r_conflict.node_b_id)
          AND ((m_a.person1_id = m_b.person1_id AND m_a.person2_id = m_b.person2_id) OR (m_a.person1_id = m_b.person2_id AND m_a.person2_id = m_b.person1_id));

        UPDATE marriages 
        SET person1_id = CASE WHEN person1_id = r_conflict.node_a_id THEN LEAST(r_conflict.node_b_id, person2_id) ELSE person1_id END,
            person2_id = CASE WHEN person2_id = r_conflict.node_a_id THEN GREATEST(person1_id, r_conflict.node_b_id) ELSE person2_id END
        WHERE person1_id = r_conflict.node_a_id OR person2_id = r_conflict.node_a_id;

        UPDATE marriages SET person1_id = LEAST(person1_id, person2_id), person2_id = GREATEST(person1_id, person2_id) WHERE person1_id > person2_id;

        UPDATE events SET person_id = r_conflict.node_b_id WHERE person_id = r_conflict.node_a_id;
        DELETE FROM persons WHERE id = r_conflict.node_a_id;
    END LOOP;

    UPDATE tree_merge_sessions SET status = 'completed' WHERE id = p_session_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.execute_tree_merge(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.execute_tree_merge(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.execute_tree_merge(UUID) TO authenticated;
