-- 1. Profiles Table (Extends Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  person_id UUID, -- Links to their own record in the 'persons' table
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Persons Table (Core Family Member Data)
CREATE TABLE persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  birth_date DATE,
  death_date DATE,
  is_deceased BOOLEAN DEFAULT FALSE,
  invitation_code TEXT UNIQUE,
  claimed_by_uid UUID REFERENCES auth.users(id),
  creator_uid UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Couples Table (Relationship Links)
CREATE TABLE couples (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person1_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  person2_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT DEFAULT 'marriage',
  marriage_date DATE,
  divorce_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (person1_id < person2_id) -- Prevent duplicate reciprocal pairs
);

-- 4. Parent-Child Links (Junction Table)
CREATE TABLE lineage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Connections (User-to-User Networking)
CREATE TABLE connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_uid UUID REFERENCES auth.users(id) NOT NULL,
  recipient_uid UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_uid, recipient_uid)
);

-- 6. Events Table (Family Timeline)
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineage ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- POLICIES (Basic Example: Users can read data they created or are connected to)
-- More complex recursive policies will be added for the tree view.
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 7. Posts Table (Family Feed)
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_uid UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Reactions Table (Likes, Loves, etc.)
CREATE TABLE reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_uid UUID REFERENCES auth.users(id) NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'love', 'haha')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_uid)
);

-- 9. Comments Table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_uid UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- POLICIES for Wall
CREATE POLICY "Users can view posts from their network" ON posts FOR SELECT USING (true); -- Simplified for now
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_uid);
CREATE POLICY "Users can update their own posts" ON posts FOR UPDATE USING (auth.uid() = author_uid);
CREATE POLICY "Users can delete their own posts" ON posts FOR DELETE USING (auth.uid() = author_uid);

CREATE POLICY "Anyone can view reactions" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can react to posts" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_uid);
CREATE POLICY "Users can change their reaction" ON reactions FOR UPDATE USING (auth.uid() = user_uid);
CREATE POLICY "Users can remove their reaction" ON reactions FOR DELETE USING (auth.uid() = user_uid);

CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can post comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_uid);
