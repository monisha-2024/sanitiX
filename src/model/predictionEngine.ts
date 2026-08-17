import { 
    ModelConfig 
} from './modelConfig';
import { SensorReading, PredictionResult, RiskCategory, ModelMetrics } from '../types';
import { cleanCSVData } from './preprocessing';
import { extractFeatureVector, computeFeatureImportance, featureVectorToArray } from './featureEngineering';

export class PredictionEngine {
    private static instance: PredictionEngine;

    private constructor() {}

    public static getInstance(): PredictionEngine {
        if (!PredictionEngine.instance) {
            PredictionEngine.instance = new PredictionEngine();
        }
        return PredictionEngine.instance;
    }

    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    private relu(x: number): number {
        return Math.max(0, x);
    }

    private forwardPass(inputVector: number[]): [number, number, number] {
        const hiddenLayer = ModelConfig.weights[0].map((weights, i) => {
            return this.relu(weights.reduce((sum, weight, j) => sum + weight * inputVector[j], ModelConfig.biases[0][i]));
        });

        const outputLayer = ModelConfig.weights[1].map((weights, i) => {
            return this.sigmoid(weights.reduce((sum, weight, j) => sum + weight * hiddenLayer[j], ModelConfig.biases[1][i]));
        });

        return [outputLayer[0], outputLayer[1], outputLayer[2]];
    }

    public predict(readings: SensorReading[]): PredictionResult {
        const currentIndex = readings.length - 1;
        const featureVector = extractFeatureVector(readings, currentIndex);
        const inputArray = featureVectorToArray(featureVector);
        const [risk15min, risk30min, risk60min] = this.forwardPass(inputArray);

        const locationWeight = ModelConfig.locationWeights[readings[currentIndex].location];
        const overallRisk = Math.min(1.0, risk30min * locationWeight);

        const riskCategory = overallRisk <= 0.25 ? RiskCategory.LOW :
                             overallRisk <= 0.5 ? RiskCategory.MODERATE :
                             overallRisk <= 0.75 ? RiskCategory.HIGH : RiskCategory.CRITICAL;

        const mainFactors = Object.keys(computeFeatureImportance(featureVector, ModelConfig.weights));

        return {
            risk15min,
            risk30min,
            risk60min,
            overallRisk,
            riskCategory,
            expectedOdourMinutes: risk30min * 30,
            confidence: risk30min,
            mainFactors,
            recommendation: `Monitor the area. Risk level: ${riskCategory}`,
            featureImportance: computeFeatureImportance(featureVector, ModelConfig.weights)
        };
    }

    public evaluateOnDataset(dataset: SensorReading[], labels: { odour_15min: number, odour_30min: number, odour_60min: number }[]): ModelMetrics {
        let TP = 0, FP = 0, TN = 0, FN = 0;

        dataset.forEach((reading, index) => {
            const prediction = this.predict([reading]);
            const actualLabel = labels[index];

            if (prediction.riskCategory !== RiskCategory.LOW && actualLabel.odour_30min) {
                TP++;
            } else if (prediction.riskCategory !== RiskCategory.LOW && !actualLabel.odour_30min) {
                FP++;
            } else if (prediction.riskCategory === RiskCategory.LOW && actualLabel.odour_30min) {
                FN++;
            } else {
                TN++;
            }
        });

        const accuracy = (TP + TN) / (TP + FP + TN + FN);
        const precision = TP / (TP + FP);
        const recall = TP / (TP + FN);
        const f1 = 2 * (precision * recall) / (precision + recall);
        const rocAuc = (TP / (TP + FN) + TN / (TN + FP)) / 2; // Approximation

        return { accuracy, precision, recall, f1, rocAuc, confusionMatrix: [[TP, FP], [FN, TN]] };
    }
}
