import { AlarmSettings } from "../types/index";

let alarmLoopId: any = null;
let alarmNodes: any[] = [];

export function startAlarmLoop(settings: AlarmSettings): void {
    stopAlarmLoop();
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const patternMap: { [key: string]: number[] } = {
        single: [0],
        double: [0, 0.3],
        triple: [0, 0.25, 0.5],
        continuous: [0, 0.2, 0.4, 0.6, 0.8]
    };

    const beep = function(time: number) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.type = settings.waveType;
        oscillator.frequency.setValueAtTime(settings.frequency, time);
        gainNode.gain.setValueAtTime(settings.volume, time);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(time);
        oscillator.stop(time + 0.2);
        alarmNodes.push(oscillator);
    };

    const pattern = patternMap[settings.pattern];
    const intervalTime = settings.pattern === "continuous" ? 1500 : 3000;

    pattern.forEach(function(timeOffset) {
        setTimeout(function() {
            beep(audioContext.currentTime + timeOffset);
        }, timeOffset * 1000);
    });

    alarmLoopId = setInterval(function() {
        pattern.forEach(function(timeOffset) {
            beep(audioContext.currentTime + timeOffset);
        });
    }, intervalTime);
}

export function stopAlarmLoop(): void {
    if (alarmLoopId) {
        clearInterval(alarmLoopId);
        alarmLoopId = null;
    }
    alarmNodes.forEach(function(node) {
        node.stop();
    });
    alarmNodes = [];
}

export function vibrateOnce(enabled: boolean): void {
    if (enabled && navigator.vibrate) {
        navigator.vibrate([400, 150, 400, 150, 400]);
    }
}

export function stopVibration(): void {
    if (navigator.vibrate) {
        navigator.vibrate(0);
    }
}

export function pushNotif(title: string, body: string): void {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function(permission) {
            if (permission === "granted") {
                new Notification(title, { body });
            }
        });
    }
}