export type Difficulty = 'easy' | 'medium' | 'hard';
export type ReportReason = 'spam' | 'inappropriate' | 'misinformation' | 'offensive' | 'other';
export type ReportStatus = 'open' | 'reviewed' | 'dismissed' | 'actioned';

export interface Ingredient {
  amount: number | null;
  unit: string;
  name: string;
}

export interface RecipeStep {
  order: number;
  text: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export interface Recipe {
  id: string;
  author_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  tags: string[];
  main_image_url: string;
  additional_image_urls: string[];
  video_url: string | null;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  calories: number | null;
  protein_g: number | null;
  carbohydrates_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  servings: number;
  prep_time_minutes: number | null;
  difficulty: Difficulty | null;
  like_count: number;
  comment_count: number;
  status: 'published' | 'removed';
  created_at: string;
  updated_at: string;
}

export type RecipeWithAuthor = Recipe & {
  author: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
  category: Pick<Category, 'id' | 'slug' | 'name'> | null;
  is_liked?: boolean;
  is_saved?: boolean;
};

export interface Comment {
  id: string;
  recipe_id: string;
  user_id: string;
  text: string;
  status: 'visible' | 'removed';
  created_at: string;
}

export type CommentWithAuthor = Comment & {
  author: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
};

export interface Report {
  id: string;
  reporter_id: string;
  recipe_id: string | null;
  comment_id: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
}
