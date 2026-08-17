import { SensorReading } from '../types';

export const SAMPLE_READINGS: SensorReading[] = [
  {
    timestamp: '2026-08-12T10:00:00Z',
    temperature: 25,
    humidity: 60,
    mq135: 200,
    h2s: 20,
    methane: 5,
    waste_level: 15,
    location: "PublicToilet",
    time_since_cleaning: 30
  },
  // More sample readings...
];

export const generateDemoScenario = (condition: string) => {
  switch(condition) {
    case 'Normal Conditions':
      return {
        timestamp: new Date().toISOString(),
        temperature: 25,
        humidity: 70,
        mq135: 250,
        h2s: 12,
        methane: 3,
        waste_level: 10,
        location: "PublicToilet",
        time_since_cleaning: 30
      };
    default:
      return {
        timestamp: new Date().toISOString(),
        temperature: 30,
        humidity: 80,
        mq135: 350,
        h2s: 30,
        methane: 10,
        waste_level: 70,
        location: "PublicToilet",
        time_since_cleaning: 5
      };
  }
}
