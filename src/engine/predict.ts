import { PredictionResult } from "../types/index";

function sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
}

export function predict(h2s: number, mq135: number, humidity: number, waste: number): PredictionResult {
    const combined = ((h2s - 200) / 150) * 0.4 + ((mq135 - 450) / 200) * 0.25 + ((humidity - 65) / 18) * 0.15 + ((waste - 65) / 20) * 0.2;

    let r15 = sigmoid(combined * 1.2 - 0.5);
    let r30 = sigmoid(combined * 1.5);
    let r60 = sigmoid(combined * 1.8 + 0.3);

    r15 = Math.max(0.01, Math.min(0.99, r15));
    r30 = Math.max(0.01, Math.min(0.99, r30));
    r60 = Math.max(0.01, Math.min(0.99, r60));

    const overall = (r15 + r30 + r60) / 3;

    let cat: string;
    if (overall < 0.25) {
        cat = "LOW";
    } else if (overall < 0.5) {
        cat = "MODERATE";
    } else if (overall < 0.75) {
        cat = "HIGH";
    } else {
        cat = "CRITICAL";
    }

    const eta = Math.round((1 - r30) * 60);
    const conf = Math.round(overall * 100);

    return { r15, r30, r60, overall, cat, eta, conf };
}

export function riskColor(cat: string): string {
    if (cat === "LOW") return "#22c55e";
    if (cat === "MODERATE") return "#facc15";
    if (cat === "HIGH") return "#f97316";
    return "#ef4444"; // CRITICAL
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Radius of the Earth in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c); // distance in meters
}