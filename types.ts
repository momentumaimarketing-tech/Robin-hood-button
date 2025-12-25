
export type FeatureId =
  | 'dashboard'
  | 'socialStrategist'
  | 'podFactory'
  | 'affiliateStudio'
  | 'chatbot'
  | 'imageGenerator'
  | 'videoGenerator'
  | 'researcher'
  | 'liveAssistant'
  | 'speechGenerator'
  | 'vault';

export interface Feature {
  id: FeatureId;
  name: string;
  description: string;
  icon: string;
  category: 'Strategic' | 'Creative' | 'Operational' | 'Control';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            uri: string,
            snippet: string
        }[]
    }[]
  };
}

export interface ApiKeyStore {
  provider: string;
  key: string;
  category: 'payment' | 'social' | 'ecommerce' | 'other';
}
