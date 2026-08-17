export interface Personnel {
  id: string;
  name: string;
  role: string;
  lat: number;
  lng: number;
  tier: number;
  distance?: number;
  status: "idle" | "alerted" | "acknowledged" | "completed";
  alertedAt?: string;
  respondedAt?: string;
  completedAt?: string;
}

export interface AlertEvent {
  id: string;
  time: string;
  category: string;
  risk: number;
  escalationLevel: number;
  completedBy?: string;
  completedAt?: string;
  active: boolean;
}

export interface AlarmSettings {
  frequency: number;
  waveType: "sine" | "square" | "sawtooth" | "triangle";
  volume: number;
  pattern: "single" | "double" | "triple" | "continuous";
  vibrationEnabled: boolean;
}

export interface SensorValues {
  h2s: number;
  mq135: number;
  humidity: number;
  waste: number;
}

export interface PredictionResult {
  r15: number;
  r30: number;
  r60: number;
  overall: number;
  cat: string;
  eta: number;
  conf: number;
}