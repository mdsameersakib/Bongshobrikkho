export interface Person {
  id: string;
  first_name: string;
  last_name: string | null;
  gender: 'male' | 'female' | 'other' | null;
  birth_date: string | null;
  death_date: string | null;
  is_deceased: boolean;
  invitation_code: string | null;
  claimed_by_uid: string | null;
  creator_uid: string;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: string;
  person1_id: string;
  person2_id: string;
  relationship_type: string;
  marriage_date: string | null;
  divorce_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Lineage {
  id: string;
  child_id: string;
  couple_id: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  person_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  requester_uid: string;
  recipient_uid: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface FamilyEvent {
  id: string;
  person_id: string | null;
  couple_id: string | null;
  event_type: string;
  event_date: string | null;
  location: string | null;
  description: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  author_uid: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  reactions?: Reaction[];
  comments_count?: number;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_uid: string;
  reaction_type: 'like' | 'love' | 'haha';
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_uid: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
}
