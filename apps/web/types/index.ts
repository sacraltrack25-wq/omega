// ─── User & Auth ─────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  current_plan: PlanName;
  plan_expires: string | null;
  query_count: number;
  created_at: string;
}

// ─── Plans & Subscriptions ────────────────────────────────────────────────────
export type PlanName = "free" | "pro" | "pro_unlimited";

export interface Plan {
  id: string;
  name: PlanName;
  display_name: string;
  description: string;
  price_usd: number;
  queries_per_day: number;    // -1 = unlimited
  queries_per_month: number;  // -1 = unlimited
  networks: NetworkType[];
  features: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "expired" | "trial" | "paused";
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  payment_provider: string | null;
  payment_ref: string | null;
  created_at: string;
  plans?: Plan;
}

export interface RateLimitInfo {
  allowed: boolean;
  plan: PlanName;
  queries_today: number;
  limit_day: number;
  queries_month: number;
  limit_month: number;
}

// ─── Conversations ────────────────────────────────────────────────────────────
export interface Conversation {
  id: string;
  user_id: string;
  network_type: NetworkType;
  title: string;
  message_count: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

// ─── AI Queries ──────────────────────────────────────────────────────────────
export type NetworkType = "text" | "image" | "video" | "audio" | "game";

export interface KnowledgeMatch {
  key: string;
  score: number;
  resonanceScore: number;
  source: string;
  raw?: string;
  liId: string;
}

export interface OmegaQuery {
  id: string;
  user_id: string;
  conversation_id: string | null;
  network_type: NetworkType;
  input: string;
  answer: string;
  confidence: number;
  converged: boolean;
  iterations: number;
  participating_li: string[];
  mirror_agreement: number;
  processing_ms: number;
  recall_used: boolean;
  recall_score: number;
  recall_top_source: string | null;
  knowledge_recall: KnowledgeMatch[] | null;
  is_admin_query: boolean;
  tokens_estimate: number;
  created_at: string;
}

// ─── gX Neurons ──────────────────────────────────────────────────────────────
export interface GxNeuron {
  id: string;
  name: string;
  gx1_state: 0 | 1;
  gx2_state: 0 | 1;
  layer_index: number;
  position: number;
  activations: number;
  resonance_score: number;
  network_id: string;
  created_at: string;
}

// ─── Li Centers ──────────────────────────────────────────────────────────────
export interface LiCenter {
  id: string;
  name: string;
  network_type: NetworkType;
  mirror_id: string | null;
  layer_count: number;
  neuron_count: number;
  knowledge_size: number;
  avg_resonance: number;
  processing_count: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Networks ────────────────────────────────────────────────────────────────
export interface Network {
  id: string;
  type: NetworkType;
  cluster_count: number;
  total_neurons: number;
  total_knowledge: number;
  status: "active" | "training" | "idle" | "error";
  created_at: string;
  updated_at: string;
}

// ─── Training ────────────────────────────────────────────────────────────────
export interface TrainingSession {
  id: string;
  network_type: NetworkType;
  parameters: Record<string, number | boolean>;
  status: "running" | "completed" | "failed" | "paused";
  items_processed: number;
  started_at: string;
  completed_at: string | null;
  metrics: {
    avgConfidence: number;
    convergeRate: number;
    avgIterations: number;
    knowledgeAdded: number;
  } | null;
}

// ─── Harvesters ──────────────────────────────────────────────────────────────
export interface HarvesterJob {
  id: string;
  type: NetworkType | "web";
  source_url: string;
  status: "queued" | "running" | "completed" | "failed";
  items_collected: number;
  error: string | null;
  started_at: string;
  completed_at: string | null;
}

// ─── API ─────────────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface OmegaResponse {
  answer: string;
  answerVector: number[];
  confidence: number;
  converged: boolean;
  iterations: number;
  participatingLi: string[];
  mirrorAgreement: number;
  networkType: NetworkType;
  timestamp: number;
  processingMs: number;
  knowledgeRecall: KnowledgeMatch[];
  recallUsed: boolean;
  conversation_id?: string;
}
