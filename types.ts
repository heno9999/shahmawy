
export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export enum AppMode {
  ESTIMATION = 'estimation',
  CONTRACTS = 'contracts',
  CODE_CHAT = 'code_chat',
  WRITER = 'writer',
  GAME = 'game',
  LIVE_VOICE = 'live_voice',
  GLOBAL_SEARCH = 'global_search',
}

export enum View {
  DASHBOARD = 'dashboard',
  TOOL = 'tool',
}

export type Language = 'ar' | 'en';

// --- Grounding Types ---
export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

// --- Structured Data Types ---

export interface EstimateData {
  item_name: string;
  sbc_code: string; 
  unit: string;
  price_range: { min: number; max: number; currency: string };
  specs: string[];
  hazards: string[];
}

export interface ContractAnalysisData {
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  flagged_clauses: Array<{
    clause: string;
    issue: string;
    recommendation: string;
    severity?: 'High' | 'Medium' | 'Low';
  }>;
}

export interface CodeChatData {
  topic: string;
  answer_summary: string;
  references: Array<{
    code_source: 'SBC' | 'MOSTADAM' | 'GENERAL'; 
    section_number: string;
    text: string;
  }>;
  compliance_check: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';
}

export interface WriterData {
  type: 'Email' | 'Letter' | 'Request' | 'Other';
  subject: string;
  content: string;
  tone: string;
}

export interface GameData {
  shahmawi_mood: 'HAPPY' | 'ANGRY' | 'SARCASTIC' | 'IMPRESSED';
  message: string;
  current_rank: 'Trainee' | 'Site Engineer' | 'Project Manager' | 'CEO' | 'Legend';
  total_score: number;
  streak_count: number;
  question?: string;
  options?: string[];
  correct_answer?: string; 
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  is_rank_up?: boolean;
}

// Added AnalyticsData interface to satisfy import in Widgets.tsx
export interface AnalyticsData {
  report_title: string;
  kpis: {
    total_spend_or_value: string;
    efficiency_score: number;
    main_alert?: string;
  };
  chart_type: 'PIE' | 'BAR';
  chart_data: Array<{
    name: string;
    value: number;
  }>;
  ai_insights: string[];
}

export interface ChatMessage {
  id: string;
  role: Role;
  text?: string;
  image?: string;
  isError?: boolean;
  timestamp: number;
  groundingMetadata?: GroundingMetadata;
  data?: EstimateData | ContractAnalysisData | CodeChatData | WriterData | GameData | AnalyticsData;
  dataType?: 'estimate' | 'contract' | 'code_chat' | 'writer' | 'game' | 'analytics';
}
