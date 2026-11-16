export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  plan_id: string;
  credits: number;
  avatar_url?: string | null;
  created_at?: string;
}

export interface DetectedObject {
  id: string;
  label: string;
  category?: string;
  confidence: number;
  box: [number, number, number, number]; // [left%, top%, width%, height%]
}

export interface DesignResult {
  id: string;
  user_id?: string;
  project_id?: string | null;
  feature_type: string;
  category: string;
  room_type: string;
  style: string;
  intervention_level: string;
  prompt: string;
  settings: Record<string, any>;
  original_image_url: string;
  generated_image_url: string;
  variations: string[];
  detected_objects: DetectedObject[];
  credits_used: number;
  is_saved: boolean;
  is_demo_mode: boolean;
  provider: string;
  prompt_used?: string;
  inspiration_analysis?: {
    palette: string[];
    lighting: string;
    material_direction: string;
  } | null;
  warning?: string;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  credits_per_month: number;
  features: string[];
  is_active: boolean;
}

export interface DesignCategory {
  id: string;
  name: string;
  slug: string;
  group_name: string;
  description: string;
  cover_image: string;
  is_active: boolean;
  sort_order: number;
}

export interface ProjectFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  folder_id?: string | null;
  title: string;
  category: string;
  style: string;
  cover_image?: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_email?: string;
}

export interface FloorPlanResult {
  id: string;
  title: string;
  source_plan_url: string;
  furnished_2d_url: string;
  render_3d_url: string;
  layout_style: string;
  furniture_arrangement: string;
  rooms: Array<{
    name: string;
    area_sqft: number;
    zone: string;
    suggested_pieces: string[];
  }>;
  is_demo_mode: boolean;
  created_at: string;
}

export interface VideoProject {
  id: string;
  title: string;
  source_image_url: string;
  camera_movement: string;
  duration_seconds: number;
  angles: string[];
  transition_style?: string;
  status: string;
  requires_external_provider: boolean;
  provider_notice?: string;
  created_at: string;
}

export interface FurnitureProduct {
  product_id: string;
  product_name: string;
  category: string;
  brand?: string;
  style: string;
  material: string;
  approx_price: number;
  image_url: string;
  product_url: string;
  is_demo_product: boolean;
  match_score?: number;
  alternatives?: string[];
}

export interface BudgetBreakdown {
  material_cost: number;
  furniture_cost: number;
  furniture_only: number;
  lighting_cost: number;
  labour_cost: number;
  installation_cost: number;
  additional_expenses: number;
}

export interface ItemizedBudgetItem {
  id: string;
  name: string;
  category: string;
  type: string;
  material: string;
  price: number;
  image_url: string;
  is_purchasable: boolean;
  brand?: string;
  product_url?: string;
}

export interface BudgetEstimateResult {
  id: string;
  title: string;
  area_sqft?: number;
  wall_sqft?: number;
  breakdown: BudgetBreakdown;
  itemized_items?: ItemizedBudgetItem[];
  estimated_total: number;
  disclaimer?: string;
  inputs?: Record<string, any>;
  created_at: string;
}

