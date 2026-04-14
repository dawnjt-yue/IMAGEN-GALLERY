export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ImageSettings {
  size: string;
  quality: string;
  style: string;
  n: number;
  responseFormat: 'url' | 'b64_json';
}

export interface PromptPreset {
  id: string;
  name: string;
  content: string;
}

export interface PrefixTemplate {
  id: string;
  name: string;
  content: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  model: string;
  settings: ImageSettings;
}

export const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'grok-imagine-image-lite',
};

export const DEFAULT_SETTINGS: ImageSettings = {
  size: '1024x1024',
  quality: 'standard',
  style: 'vivid',
  n: 1,
  responseFormat: 'url',
};

export const IMAGE_SIZES = [
  '256x256',
  '512x512',
  '1024x1024',
  '1024x1792',
  '1792x1024',
];

export const IMAGE_QUALITIES = ['standard', 'hd'];
export const IMAGE_STYLES = ['vivid', 'natural'];
