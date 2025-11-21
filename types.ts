export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface GenerationConfig {
  prompt: string;
  sourceImage?: File | null;
}