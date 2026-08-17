import { SensorReading } from '../types';
import ModelConfig from './modelConfig';

export function validateSensorReading(reading: SensorReading): SensorReading {
    return {
        ...reading,
        temperature: Math.min(Math.max(reading.temperature, -30), 50),
        humidity: Math.min(Math.max(reading.humidity, 0), 100),
        mq135: Math.min(Math.max(reading.mq135, 0), 1000),
        h2s: Math.min(Math.max(reading.h2s, 0), 500),
        methane: Math.min(Math.max(reading.methane, 0), 1000),
        waste_level: Math.min(Math.max(reading.waste_level, 0), 100),
        time_since_cleaning: Math.max(reading.time_since_cleaning, 0)
    };
}

export function normalizeFeaturesWithParams(featureArray: number[], params: typeof ModelConfig.normalizationParams): number[] {
    return featureArray.map((value, index) => {
        if (index < 7) {
            const param = Object.values(params)[index];
            return (value - param.mean) / param.std;
        }
        return value; // already in -1 to 1 range
    });
}

export function interpolateMissingValues(readings: SensorReading[]): SensorReading[] {
    const result = [...readings];
    for (let i = 1; i < readings.length; i++) {
        if (readings[i].h2s === null) {
            result[i].h2s = result[i - 1].h2s + (result[i + 1]?.h2s - result[i - 1].h2s) / 2;
        }
    }
    return result;
}

export function cleanCSVData(rawRows: Record<string, string>[]): SensorReading[] {
    return rawRows.map(row => ({
        timestamp: row.timestamp,
        temperature: parseFloat(row.temperature),
        humidity: parseFloat(row.humidity),
        mq135: parseFloat(row.mq135),
        h2s: parseFloat(row.h2s),
        methane: parseFloat(row.methane),
        waste_level: parseFloat(row.waste_level),
        location: row.location as any, // cast to LocationType
        time_since_cleaning: parseFloat(row.time_since_cleaning)
    }));
}

export function detectOutliers(readings: SensorReading[]): boolean[] {
    const h2sValues = readings.map(reading => reading.h2s);
    const q1 = h2sValues.sort((a, b) => a - b)[Math.floor(h2sValues.length / 4)];
    const q3 = h2sValues.sort((a, b) => a - b)[Math.floor((h2sValues.length * 3) / 4)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return h2sValues.map(value => value < lowerBound || value > upperBound);
}
