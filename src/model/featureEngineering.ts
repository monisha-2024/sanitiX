import { SensorReading, FeatureVector } from '../types';

export function computeMovingAverage(values: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
        const start = Math.max(0, i - window + 1);
        const subset = values.slice(start, i + 1);
        const average = subset.reduce((acc, val) => acc + val, 0) / subset.length;
        result.push(average);
    }
    return result;
}

export function computeRateOfChange(values: number[]): number[] {
    return values.map((value, index) => index === 0 ? 0 : (value - values[index - 1]) / values[index - 1]);
}

export function computeRollingStd(values: number[], window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
        const start = Math.max(0, i - window + 1);
        const subset = values.slice(start, i + 1);
        const mean = subset.reduce((acc, val) => acc + val, 0) / subset.length;
        const std = Math.sqrt(subset.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / subset.length);
        result.push(std);
    }
    return result;
}

export function computeLagValues(values: number[], lag: number): number[] {
    return values.map((value, index) => index < lag ? 0 : values[index - lag]);
}

export function extractFeatureVector(readings: SensorReading[], currentIndex: number): FeatureVector {
    const lastReadings = readings.slice(Math.max(0, currentIndex - 9), currentIndex + 1);
    const h2sValues = lastReadings.map(r => r.h2s);
    const mq135Values = lastReadings.map(r => r.mq135);
    const humidityValues = lastReadings.map(r => r.humidity);
    const temperatureValues = lastReadings.map(r => r.temperature);
    const methaneValues = lastReadings.map(r => r.methane);
    const wasteValues = lastReadings.map(r => r.waste_level);
    
    return {
        h2s_current: h2sValues[h2sValues.length - 1],
        h2s_ma5: computeMovingAverage(h2sValues, 5)[currentIndex % 10],
        h2s_ma10: computeMovingAverage(h2sValues, 10)[currentIndex % 10],
        h2s_roc: computeRateOfChange(h2sValues)[currentIndex],
        h2s_lag1: computeLagValues(h2sValues, 1)[currentIndex],
        h2s_lag3: computeLagValues(h2sValues, 3)[currentIndex],
        
        mq135_current: mq135Values[mq135Values.length - 1],
        mq135_ma5: computeMovingAverage(mq135Values, 5)[currentIndex % 10],
        mq135_roc: computeRateOfChange(mq135Values)[currentIndex],
        
        humidity_current: humidityValues[humidityValues.length - 1],
        humidity_trend: computeRateOfChange(humidityValues)[currentIndex],
        humidity_ma5: computeMovingAverage(humidityValues, 5)[currentIndex % 10],
        
        temperature_current: temperatureValues[temperatureValues.length - 1],
        temperature_trend: computeRateOfChange(temperatureValues)[currentIndex],
        
        methane_current: methaneValues[methaneValues.length - 1],
        methane_roc: computeRateOfChange(methaneValues)[currentIndex],
        
        waste_current: wasteValues[wasteValues.length - 1],
        waste_trend: computeRateOfChange(wasteValues)[currentIndex],
        
        time_since_cleaning: lastReadings[0].time_since_cleaning,
        
        hour_sin: Math.sin((new Date(lastReadings[lastReadings.length - 1].timestamp).getHours() / 24) * 2 * Math.PI),
        hour_cos: Math.cos((new Date(lastReadings[lastReadings.length - 1].timestamp).getHours() / 24) * 2 * Math.PI),
        day_sin: Math.sin((new Date(lastReadings[lastReadings.length - 1].timestamp).getDay() / 7) * 2 * Math.PI),
        day_cos: Math.cos((new Date(lastReadings[lastReadings.length - 1].timestamp).getDay() / 7) * 2 * Math.PI),
        
        location_encoded: lastReadings[lastReadings.length - 1].location,
        combined_gas_index: (h2sValues[h2sValues.length - 1] * 0.5 + mq135Values[mq135Values.length - 1] * 0.3 + methaneValues[methaneValues.length - 1] * 0.2) / 300
    };
}

export function featureVectorToArray(fv: FeatureVector): number[] {
    return [
        fv.h2s_current,
        fv.h2s_ma5,
        fv.h2s_ma10,
        fv.h2s_roc,
        fv.h2s_lag1,
        fv.h2s_lag3,
        fv.mq135_current,
        fv.mq135_ma5,
        fv.mq135_roc,
        fv.humidity_current,
        fv.humidity_trend,
        fv.humidity_ma5,
        fv.temperature_current,
        fv.temperature_trend,
        fv.methane_current,
        fv.methane_roc,
        fv.waste_current,
        fv.waste_trend,
        fv.time_since_cleaning,
        fv.hour_sin,
        fv.hour_cos,
        fv.day_sin,
        fv.day_cos,
        fv.location_encoded,
        fv.combined_gas_index
    ];
}

export function computeFeatureImportance(featureVector: FeatureVector, weights: number[][]): Record<string, number> {
    const result: Record<string, number> = {};
    const featureArray = featureVectorToArray(featureVector);
    weights[0].forEach((row, i) => {
        result[ModelConfig.featureNames[i]] = row.reduce((sum, weight, j) => sum + weight * featureArray[j], 0);
    });
    return result;
}
