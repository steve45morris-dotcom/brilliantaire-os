export interface Brand {
  name: string;
  category: string;
  thesis: string;
}

export interface Project {
  id: string;
  name: string;
  lane: string;
  status: "concept" | "draft" | "building" | "shipped";
  priority: "low" | "medium" | "high";
  next_action: string;
  output: string;
}

export interface Module {
  id: string;
  name: string;
  purpose: string;
  outputs: string[];
}

export interface WeeklyData {
  week_of: string;
  outcomes: string[];
  completed_outcomes?: number[];
  metrics: {
    system_improvements: number;
    public_proof_posts: number;
    music_or_media_assets: number;
    business_actions: number;
    learning_notes: number;
  };
}
