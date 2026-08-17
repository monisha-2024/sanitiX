import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// ===== TYPES =====
interface Personnel {
  id: string; name: string; role: string;
  lat: number; lng: number; tier: number; distance?: number;
  status: 'idle' | 'alerted' | 'acknowledged' | 'completed';
  alertedAt?: string; respondedAt?: string; completedAt?: string;
}
interface AlertEvent {
  id: string; time: string; category: string; risk: number;
  escalationLevel: number; completedBy?: string; completedAt?: string; active: boolean;
}
interface AlarmSettings {
  frequency: number; waveType: 'sine' | 'square' | 'sawtooth' | 'triangle';
  volume: number; pattern: 'single' | 'double' | 'triple' | 'continuous';
  vibrationEnabled: boolean;
}

// ===== PERSONNEL =====
const BASE_PERSONNEL: Personnel[] = [
  { id: 'w1', name: 'Worker Ahmad',     role: 'Sanitation Worker', lat: 0, lng: 0, tier: 1, status: 'idle' },
  { id: 'w2', name: 'Worker Ravi',      role: 'Sanitation Worker', lat: 0, lng: 0, tier: 1, status: 'idle' },
  { id: 'w3', name: 'Cleaner Priya',    role: 'Cleaner',           lat: 0, lng: 0, tier: 1, status: 'idle' },
  { id: 'w4', name: 'Worker Suresh',    role: 'Sanitation Worker', lat: 0, lng: 0, tier: 1, status: 'idle' },
  { id: 'w5', name: 'Worker Lakshmi',   role: 'Sanitation Worker', lat: 0, lng: 0, tier: 1, status: 'idle' },
  { id: 's1', name: 'Supervisor Raja',  role: 'Supervisor',        lat: 0, lng: 0, tier: 2, status: 'idle' },
  { id: 's2', name: 'Supervisor Meena', role: 'Supervisor',        lat: 0, lng: 0, tier: 2, status: 'idle' },
  { id: 'o1', name: 'Officer Kumar',    role: 'Senior Officer',    lat: 0, lng: 0, tier: 3, status: 'idle' },
  { id: 'o2', name: 'Director Anand',   role: 'Director',          lat: 0, lng: 0, tier: 3, status: 'idle' },
];

// ===== AI ENGINE =====
function predict(h2s: number, mq135: number, humidity: number, waste: number) {
  const sig = (x: number) => 1 / (1 + Math.exp(-x));
  const c = ((h2s-200)/150)*0.4 + ((mq135-450)/200)*0.25 + ((humidity-65)/18)*0.15 + ((waste-65)/20)*0.2;
  const r15 = Math.min(0.99, Math.max(0.01, sig(c*1.2-0.5)));
  const r30 = Math.min(0.99, Math.max(0.01, sig(c*1.5)));
  const r60 = Math.min(0.99, Math.max(0.01, sig(c*1.8+0.3)));
  const ov  = (r15+r30+r60)/3;
  const cat = ov<0.25?'LOW':ov<0.5?'MODERATE':ov<0.75?'HIGH':'CRITICAL';
  return { r15, r30, r60, ov, cat, eta: Math.round((1-r30)*60), conf: Math.round(ov*100) };
}

function riskColor(cat: string) {
  if (cat==='LOW') return '#22c55e';
  if (cat==='MODERATE') return '#facc15';
  if (cat==='HIGH') return '#f97316';
  return '#ef4444';
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// ===== ALARM ENGINE =====
let _loopId: any = null;
let _nodes: any[] = [];

function startAlarm(s: AlarmSettings) {
  stopAlarm();
  const patterns: Record<string, number[]> = {
    single: [0], double: [0, 0.3], triple: [0, 0.25, 0.5], continuous: [0, 0.2, 0.4, 0.6, 0.8]
  };
  function beep() {
    try {
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      (patterns[s.pattern] || [0]).forEach(function(t) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = s.waveType; osc.frequency.value = s.frequency;
        gain.gain.setValueAtTime(s.volume, ctx.currentTime+t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+t+0.2);
        osc.start(ctx.currentTime+t); osc.stop(ctx.currentTime+t+0.2);
        _nodes.push(osc);
      });
    } catch (_) {}
  }
  beep();
  _loopId = setInterval(beep, s.pattern==='continuous' ? 1500 : 3000);
}

function stopAlarm() {
  if (_loopId) { clearInterval(_loopId); _loopId = null; }
  _nodes.forEach(function(n) { try { n.stop(); } catch (_) {} });
  _nodes = [];
  if ('vibrate' in navigator) navigator.vibrate(0);
}

function vibrate(enabled: boolean) {
  if (enabled && 'vibrate' in navigator) navigator.vibrate([400,150,400,150,400]);
}

function notify(title: string, body: string) {
  if ('Notification' in window && Notification.permission==='granted') {
    new Notification(title, { body, tag: 'sanitix' });
  }
}

// ===== STYLES =====
const S = {
  page: { padding: 30, background: 'linear-gradient(135deg,#0f2027 0%,#203a43 50%,#0f172a 100%)', minHeight: '100vh' } as React.CSSProperties,
  card: { background: 'rgba(30,41,59,0.85)', borderRadius: 14, padding: 24, border: '1px solid #1e293b' } as React.CSSProperties,
  h1: { color: '#f1f5f9', fontSize: 22, fontWeight: 'bold', marginBottom: 4 } as React.CSSProperties,
  sub: { color: '#64748b', fontSize: 13, marginBottom: 24 } as React.CSSProperties,
  label: { color: '#94a3b8', fontSize: 13 } as React.CSSProperties,
  badge: (col: string) => ({ color: col, background: col+'22', fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 'bold' } as React.CSSProperties),
  btn: (bg: string) => ({ background: bg, color: bg==='#1e293b'?'#475569':'#fff', border: 'none', borderRadius: 9, padding: '10px 22px', cursor: 'pointer', fontWeight: 'bold', fontSize: 13 } as React.CSSProperties),
};

// ===== SIDEBAR =====
function Sidebar({ alarm }: { alarm: boolean }): JSX.Element {
  const loc = useLocation();
  const links = [
    { to: '/',         icon: '🎛', label: 'Sensor Control' },
    { to: '/dispatch', icon: '📋', label: 'Dispatch Board' },
    { to: '/history',  icon: '📜', label: 'Alert History'  },
    { to: '/settings', icon: '⚙',  label: 'Settings'       },
    { to: '/about',    icon: 'ℹ',  label: 'About'          },
  ];
  return (
    <aside style={{ width: 230, background: '#0a111e', minHeight: '100vh', flexShrink: 0, borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '22px 20px 14px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ color: '#22d3ee', fontWeight: 'bold', fontSize: 20 }}>🌿 SanitiX AI</div>
        <div style={{ color: '#334155', fontSize: 11, marginTop: 2 }}>Predictive Odour Intelligence</div>
      </div>

      {alarm && (
        <div style={{ margin: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef444455', borderRadius: 10 }}>
          <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 12, animation: 'pulse 1s infinite' }}>🔴 ALARM ACTIVE</div>
          <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>Awaiting response...</div>
        </div>
      )}

      <nav style={{ padding: '8px 0', flex: 1 }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes glow{from{box-shadow:0 0 10px #ef444455}to{box-shadow:0 0 30px #ef4444aa}}`}</style>
        {links.map(function(l) {
          const active = loc.pathname === l.to;
          return (
            <Link key={l.to} to={l.to} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 20px', textDecoration: 'none', fontSize: 13,
              color: active ? '#22d3ee' : '#64748b',
              background: active ? '#1e293b' : 'transparent',
              borderLeft: active ? '3px solid #22d3ee' : '3px solid transparent',
              transition: 'all 0.2s',
            }}>
              <span>{l.icon}</span><span>{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '14px 20px', borderTop: '1px solid #1e293b', color: '#334155', fontSize: 10 }}>
        GPS Auto-Select • 20 Min Escalation
      </div>
    </aside>
  );
}

// ===== SENSOR CONTROL =====
function SensorControl({ sensors, setSensors, result }: { sensors: any; setSensors: any; result: any }): JSX.Element {
  const col = riskColor(result.cat);
  const sliders = [
    { key: 'h2s',      label: '🟠 H2S',      unit: 'ppm', min: 0,  max: 650, danger: 200 },
    { key: 'mq135',    label: '🔵 MQ135',     unit: 'ppm', min: 0,  max: 950, danger: 450 },
    { key: 'humidity', label: '💧 Humidity',  unit: '%',   min: 0,  max: 100, danger: 70  },
    { key: 'waste',    label: '🗑 Waste Fill', unit: '%',   min: 0,  max: 100, danger: 70  },
  ];
  return (
    <div style={S.page}>
      <h1 style={S.h1}>🎛 Sensor Control Panel</h1>
      <p style={S.sub}>Adjust sensor levels manually. All alerts fire automatically by GPS distance.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* SLIDERS */}
        <div style={S.card}>
          <div style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 15, marginBottom: 20 }}>Manual Sensor Input</div>
          {sliders.map(function(s) {
            const val: number = sensors[s.key];
            const pct = ((val-s.min)/(s.max-s.min))*100;
            const over = val >= s.danger;
            return (
              <div key={s.key} style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={S.label}>{s.label}</span>
                  <span style={{ color: over?'#f97316':'#22d3ee', fontWeight: 'bold', fontSize: 14 }}>
                    {val} {s.unit} {over ? '⚠ DANGER' : '✓ OK'}
                  </span>
                </div>
                <div style={{ position: 'relative', height: 10, background: '#0f172a', borderRadius: 8 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 8, width: pct+'%', background: over ? 'linear-gradient(90deg,#22d3ee,#f97316,#ef4444)' : 'linear-gradient(90deg,#22d3ee,#0ea5e9)', transition: 'width 0.15s' }} />
                  <div style={{ position: 'absolute', top: -3, left: (((s.danger-s.min)/(s.max-s.min))*100)+'%', width: 2, height: 16, background: '#ef4444aa', borderRadius: 2 }} />
                </div>
                <input type="range" min={s.min} max={s.max} value={val}
                  onChange={function(e) { const c=Object.assign({},sensors); c[s.key]=Number(e.target.value); setSensors(c); }}
                  style={{ width: '100%', marginTop: 4, accentColor: over?'#f97316':'#22d3ee' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: 10 }}>
                  <span>{s.min}</span><span style={{ color:'#475569' }}>danger at {s.danger}</span><span>{s.max}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* RESULT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[['15 MIN', result.r15], ['30 MIN', result.r30], ['60 MIN', result.r60]].map(function(item) {
              return (
                <div key={item[0] as string} style={{ ...S.card, padding: 18, textAlign: 'center', border: '1px solid '+col+'44' }}>
                  <div style={{ color: '#64748b', fontSize: 10, letterSpacing: 2 }}>{item[0] as string}</div>
                  <div style={{ color: col, fontSize: 38, fontWeight: 'bold', transition: 'all 0.3s' }}>{Math.round((item[1] as number)*100)}%</div>
                </div>
              );
            })}
          </div>

          <div style={{ ...S.card, textAlign: 'center', border: '2px solid '+col, padding: 22 }}>
            <div style={{ color: col, fontSize: 40, fontWeight: 'bold' }}>{result.cat}</div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>Odour in ~{result.eta} min | Confidence {result.conf}%</div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 10 }}>
              {result.cat==='LOW' && '✅ All clear. Raise sliders to test.'}
              {result.cat==='MODERATE' && '⚠ Sensors rising. Nearest 3 workers ready.'}
              {result.cat==='HIGH' && '🚨 AUTO-ALERT: Nearest 3 workers notified by GPS!'}
              {result.cat==='CRITICAL' && '🔴 CRITICAL: Full escalation chain activated!'}
            </div>
          </div>

          {/* Escalation legend */}
          <div style={S.card}>
            <div style={{ color: '#64748b', fontSize: 11, letterSpacing: 1, marginBottom: 14 }}>GPS AUTO ESCALATION</div>
            {[
              { n:1, label:'Nearest 3 Workers', time:'Instant',   c:'#22d3ee', desc:'Auto-selected by GPS Haversine distance' },
              { n:2, label:'All Supervisors',   time:'+20 min',   c:'#facc15', desc:'If no worker acknowledges in 20 minutes' },
              { n:3, label:'Senior Officials',  time:'+40 min',   c:'#ef4444', desc:'Notification ONLY — no sound/vibration' },
            ].map(function(row) {
              return (
                <div key={row.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: row.c+'22', border: '2px solid '+row.c, display: 'flex', alignItems: 'center', justifyContent: 'center', color: row.c, fontSize: 12, fontWeight: 'bold', flexShrink: 0 }}>{row.n}</div>
                  <div>
                    <div style={{ color: '#f1f5f9', fontSize: 12, fontWeight: 'bold' }}>{row.label} <span style={{ color: row.c }}>({row.time})</span></div>
                    <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>{row.desc}</div>
                  </div>
                </div>
              );
            })}
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px', color: '#475569', fontSize: 11 }}>
              🔔 Alarm loops until worker presses COMPLETE on Dispatch Board.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== DISPATCH BOARD =====
function DispatchBoard({ personnel, activeAlert, escalationLevel, escalationTimer, onAck, onComplete }: {
  personnel: Personnel[]; activeAlert: AlertEvent | null;
  escalationLevel: number; escalationTimer: number;
  onAck: (id: string) => void; onComplete: (id: string) => void;
}): JSX.Element {
  const tierMeta: Record<number, { label: string; color: string }> = {
    1: { label: 'Field Workers (GPS Auto-Selected)', color: '#22d3ee' },
    2: { label: 'Supervisors', color: '#facc15' },
    3: { label: 'Senior Officials (Notification Only)', color: '#ef4444' },
  };

  function fmt(sec: number) {
    const m = Math.floor(sec/60);
    const s = sec%60;
    return m+'m '+(s<10?'0':'')+s+'s';
  }

  return (
    <div style={S.page}>
      <h1 style={S.h1}>📋 Dispatch Board</h1>
      <p style={S.sub}>GPS-based escalation. 20-minute response window per tier.</p>

      {activeAlert && activeAlert.active && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '2px solid '+riskColor(activeAlert.category), borderRadius: 14, padding: 22, marginBottom: 24, animation: 'glow 0.7s ease-in-out infinite alternate' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ color: riskColor(activeAlert.category), fontWeight: 'bold', fontSize: 22 }}>🔴 ALARM ACTIVE — {activeAlert.category}</div>
              <div style={{ color: '#fca5a5', fontSize: 13, marginTop: 4 }}>Escalation Level {escalationLevel} / 3 | Started: {activeAlert.time}</div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                {escalationLevel===1 && 'Nearest 3 workers alerted. No response in 20 min → Supervisors notified.'}
                {escalationLevel===2 && 'Workers did not respond. Supervisors alerted. No response → Officials notified.'}
                {escalationLevel===3 && 'Maximum escalation. Officials notified. Alarm continues until COMPLETE pressed.'}
              </div>
            </div>
            <div style={{ ...S.card, padding: '12px 20px', textAlign: 'center', minWidth: 130 }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>ESCALATES IN</div>
              <div style={{ color: escalationLevel<3?'#facc15':'#475569', fontSize: 26, fontWeight: 'bold' }}>
                {escalationLevel<3 ? fmt(escalationTimer) : 'MAX'}
              </div>
            </div>
          </div>
        </div>
      )}

      {!activeAlert && (
        <div style={{ ...S.card, padding: 40, textAlign: 'center', color: '#475569', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <div style={{ marginTop: 12, fontSize: 15, color: '#64748b' }}>No active alarm</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Raise sensor sliders past the danger threshold to trigger the system.</div>
        </div>
      )}

      {[1,2,3].map(function(tier) {
        const group = personnel.filter(function(p) { return p.tier===tier; });
        const meta = tierMeta[tier];
        const active = group.some(function(p) { return p.status!=='idle'; });
        return (
          <div key={tier} style={{ ...S.card, marginBottom: 20, border: '1px solid '+(active?meta.color+'55':'#1e293b') }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: meta.color+'22', border: '2px solid '+meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, fontWeight: 'bold', fontSize: 14 }}>{tier}</div>
              <div style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 15 }}>{meta.label}</div>
              {active && <span style={S.badge(meta.color)}>ALERTED</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
              {group.map(function(p) {
                const bg = p.status==='alerted' ? 'rgba(249,115,22,0.1)' : p.status==='acknowledged' ? 'rgba(250,204,21,0.1)' : p.status==='completed' ? 'rgba(34,197,94,0.1)' : '#0f172a';
                const bd = p.status==='alerted' ? '#f9731688' : p.status==='acknowledged' ? '#facc1588' : p.status==='completed' ? '#22c55e88' : '#1e293b';
                return (
                  <div key={p.id} style={{ background: bg, border: '1px solid '+bd, borderRadius: 10, padding: 14 }}>
                    <div style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 13 }}>{p.name}</div>
                    <div style={{ color: '#64748b', fontSize: 11 }}>{p.role}</div>
                    {p.distance !== undefined && <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>GPS: {p.distance}m</div>}
                    <div style={{ margin: '8px 0' }}>
                      {p.status==='idle' && <span style={{ color:'#475569', fontSize:11, background:'#1e293b', padding:'3px 10px', borderRadius:20 }}>Standby</span>}
                      {p.status==='alerted' && <span style={{ color:'#f97316', fontSize:11, background:'rgba(249,115,22,0.15)', padding:'3px 10px', borderRadius:20 }}>🔔 ALARM SENT {p.alertedAt?'@ '+p.alertedAt:''}</span>}
                      {p.status==='acknowledged' && <span style={{ color:'#facc15', fontSize:11, background:'rgba(250,204,21,0.15)', padding:'3px 10px', borderRadius:20 }}>👁 Acknowledged {p.respondedAt?'@ '+p.respondedAt:''}</span>}
                      {p.status==='completed' && <span style={{ color:'#22c55e', fontSize:11, background:'rgba(34,197,94,0.15)', padding:'3px 10px', borderRadius:20 }}>✅ Completed {p.completedAt?'@ '+p.completedAt:''}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {p.status==='alerted' && (
                        <button onClick={function() { onAck(p.id); }} style={{ flex:1, padding:'6px 0', background:'linear-gradient(135deg,#facc15,#eab308)', color:'#0f172a', border:'none', borderRadius:7, cursor:'pointer', fontWeight:'bold', fontSize:11 }}>
                          Acknowledge
                        </button>
                      )}
                      {(p.status==='alerted' || p.status==='acknowledged') && (
                        <button onClick={function() { onComplete(p.id); }} style={{ flex:1, padding:'6px 0', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontWeight:'bold', fontSize:12 }}>
                          ✅ COMPLETE
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===== ALERT HISTORY =====
function AlertHistory({ history }: { history: AlertEvent[] }): JSX.Element {
  return (
    <div style={S.page}>
      <h1 style={S.h1}>📜 Alert History</h1>
      <p style={S.sub}>All auto-triggered alarm events with GPS escalation details.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[['Total Alarms', history.length], ['Resolved', history.filter(function(e){return !e.active;}).length], ['Active', history.filter(function(e){return e.active;}).length]].map(function(row) {
          return (
            <div key={row[0] as string} style={{ ...S.card, textAlign: 'center' }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>{row[0] as string}</div>
              <div style={{ color: '#22d3ee', fontSize: 28, fontWeight: 'bold' }}>{row[1] as number}</div>
            </div>
          );
        })}
      </div>

      {history.length === 0 ? (
        <div style={{ ...S.card, padding: 40, textAlign: 'center', color: '#475569' }}>
          <div style={{ fontSize: 48 }}>📋</div>
          <div style={{ marginTop: 12 }}>No alerts yet. Raise sensor levels to trigger the system.</div>
        </div>
      ) : (
        history.map(function(e) {
          const col = riskColor(e.category);
          return (
            <div key={e.id} style={{ ...S.card, marginBottom: 12, background: e.active?'rgba(239,68,68,0.08)':'rgba(30,41,59,0.85)', border: '1px solid '+(e.active?'#ef444455':'#1e293b') }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: col, fontWeight: 'bold', fontSize: 15 }}>{e.category} — {e.risk}%</span>
                  {e.active ? <span style={S.badge('#ef4444')}>ACTIVE</span> : <span style={S.badge('#22c55e')}>RESOLVED</span>}
                </div>
                <span style={{ color: '#475569', fontSize: 12 }}>Started: {e.time}</span>
              </div>
              <div style={{ color: '#64748b', fontSize: 12 }}>Escalation reached Level {e.escalationLevel}</div>
              {e.completedBy && <div style={{ color: '#22c55e', fontSize: 12, marginTop: 4 }}>✅ Completed by {e.completedBy} at {e.completedAt}</div>}
            </div>
          );
        })
      )}
    </div>
  );
}

// ===== SETTINGS =====
function Settings({ s, setS }: { s: AlarmSettings; setS: any }): JSX.Element {
  function test() {
    try {
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = s.waveType; osc.frequency.value = s.frequency;
      gain.gain.setValueAtTime(s.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.6);
      osc.start(); osc.stop(ctx.currentTime+0.6);
    } catch (_) {}
    vibrate(s.vibrationEnabled);
  }

  return (
    <div style={S.page}>
      <h1 style={S.h1}>⚙ Alarm Settings</h1>
      <p style={S.sub}>Customize the alarm sound for your local device. Settings saved automatically.</p>

      <div style={{ maxWidth: 580 }}>
        <div style={S.card}>

          {/* Frequency */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 14 }}>Frequency</span>
              <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>{s.frequency} Hz</span>
            </div>
            <input type="range" min={200} max={2000} step={50} value={s.frequency}
              onChange={function(e) { setS(Object.assign({},s,{frequency:Number(e.target.value)})); }}
              style={{ width: '100%', accentColor: '#22d3ee' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 11, marginTop: 4 }}>
              <span>200 Hz (Low, deep)</span><span>2000 Hz (High, sharp)</span>
            </div>
          </div>

          {/* Wave Type */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Wave Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {(['sine','square','sawtooth','triangle'] as const).map(function(t) {
                return (
                  <button key={t} onClick={function() { setS(Object.assign({},s,{waveType:t})); }}
                    style={{ padding: '10px 0', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 'bold', fontSize: 12, background: s.waveType===t?'#22d3ee':'#1e293b', color: s.waveType===t?'#0f172a':'#64748b' }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 14 }}>Volume</span>
              <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>{Math.round(s.volume*100)}%</span>
            </div>
            <input type="range" min={0.05} max={1} step={0.05} value={s.volume}
              onChange={function(e) { setS(Object.assign({},s,{volume:Number(e.target.value)})); }}
              style={{ width: '100%', accentColor: '#22d3ee' }} />
          </div>

          {/* Pattern */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>Alarm Pattern</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {(['single','double','triple','continuous'] as const).map(function(p) {
                return (
                  <button key={p} onClick={function() { setS(Object.assign({},s,{pattern:p})); }}
                    style={{ padding: '10px 0', border: 'none', borderRadius: 9, cursor: 'pointer', fontWeight: 'bold', fontSize: 12, background: s.pattern===p?'#22d3ee':'#1e293b', color: s.pattern===p?'#0f172a':'#64748b' }}>
                    {p}
                  </button>
                );
              })}
            </div>
            <div style={{ color: '#475569', fontSize: 11, marginTop: 8 }}>Single=1 beep | Double=2 beeps | Triple=3 beeps | Continuous=rapid</div>
          </div>

          {/* Vibration */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={s.vibrationEnabled}
                onChange={function(e) { setS(Object.assign({},s,{vibrationEnabled:e.target.checked})); }}
                style={{ width: 18, height: 18, accentColor: '#22d3ee' }} />
              <span style={{ color: '#f1f5f9', fontWeight: 'bold', fontSize: 14 }}>📳 Enable Vibration</span>
            </label>
          </div>

          <button onClick={test} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#22d3ee,#0ea5e9)', color: '#0f172a', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 15 }}>
            🔊 TEST ALARM NOW
          </button>

          <div style={{ marginTop: 16, padding: '10px 14px', background: '#0f172a', borderRadius: 8, color: '#475569', fontSize: 11 }}>
            Settings are saved automatically to your browser's local storage.
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== ABOUT =====
function About(): JSX.Element {
  return (
    <div style={S.page}>
      <h1 style={S.h1}>ℹ About SanitiX AI</h1>
      <p style={S.sub}>GPS-based automated odour intelligence and alert escalation system.</p>
      {[
        { t: '🎛 Manual Sensor Control',       b: 'You control sensor levels via sliders. The AI recalculates odour risk live and fires alerts automatically when risk escalates.' },
        { t: '📍 GPS Auto-Selection',           b: 'When HIGH/CRITICAL risk is detected, the 3 nearest workers are automatically identified using real GPS coordinates and Haversine distance calculation.' },
        { t: '⏱ 20-Minute Escalation Chain',   b: 'Level 1: nearest 3 workers (sound + vibration). No response in 20 min → Level 2: all supervisors (sound + vibration). No response in 20 more min → Level 3: officials (push notification only, no alarm).' },
        { t: '🔔 Officials: Notification Only', b: 'Senior officials at Level 3 receive a browser push notification only. No looping alarm or vibration is sent to them — they are informed, not alarmed.' },
        { t: '🔇 Alarm Stop Condition',         b: 'The looping alarm sound and vibration continue indefinitely until a worker presses the COMPLETE button on the Dispatch Board after finishing physical sanitation work.' },
        { t: '⚙ Custom Alarm Settings',         b: 'Go to Settings to configure frequency (200–2000 Hz), wave type, volume, pattern, and vibration. All settings are saved to localStorage and persist across sessions.' },
      ].map(function(item) {
        return (
          <div key={item.t} style={{ ...S.card, marginBottom: 14 }}>
            <div style={{ color: '#22d3ee', fontWeight: 'bold', fontSize: 14, marginBottom: 8 }}>{item.t}</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{item.b}</div>
          </div>
        );
      })}
    </div>
  );
}

// ===== ROOT APP =====
export default function App(): JSX.Element {
  const [sensors, setSensors] = useState({ h2s: 80, mq135: 320, humidity: 58, waste: 45 });
  const [userGPS, setUserGPS] = useState<{ lat: number; lng: number } | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>(BASE_PERSONNEL.map(function(p) { return Object.assign({}, p); }));
  const [activeAlert, setActiveAlert] = useState<AlertEvent | null>(null);
  const [history, setHistory] = useState<AlertEvent[]>([]);
  const [escLevel, setEscLevel] = useState(0);
  const [escTimer, setEscTimer] = useState(1200);
  const [alarmS, setAlarmS] = useState<AlarmSettings>(function() {
    try { const s = localStorage.getItem('sanitix-alarm'); if (s) return JSON.parse(s); } catch (_) {}
    return { frequency: 880, waveType: 'square', volume: 0.3, pattern: 'double', vibrationEnabled: true };
  });

  const prevCat   = useRef('');
  const timerRef  = useRef<any>(null);
  const countRef  = useRef<any>(null);
  const alertRef  = useRef<AlertEvent | null>(null);
  const persRef   = useRef<Personnel[]>(personnel);
  alertRef.current = activeAlert;
  persRef.current  = personnel;

  // Save settings
  useEffect(function() { localStorage.setItem('sanitix-alarm', JSON.stringify(alarmS)); }, [alarmS]);

  // GPS
  useEffect(function() {
    if ('Notification' in window && Notification.permission==='default') Notification.requestPermission();
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(function(pos) {
      const lat = pos.coords.latitude, lng = pos.coords.longitude;
      setUserGPS({ lat, lng });
      setPersonnel(function(prev) {
        return prev.map(function(p) {
          if (p.lat===0 && p.lng===0) {
            return Object.assign({}, p, {
              lat: lat + (Math.random()-0.5)*0.008,
              lng: lng + (Math.random()-0.5)*0.008,
            });
          }
          return Object.assign({}, p, { distance: haversine(lat, lng, p.lat, p.lng) });
        });
      });
    }, function() {}, { enableHighAccuracy: true });
    return function() { navigator.geolocation.clearWatch(id); };
  }, []);

  // Update distances when GPS changes
  useEffect(function() {
    if (!userGPS) return;
    setPersonnel(function(prev) {
      return prev.map(function(p) {
        return Object.assign({}, p, { distance: haversine(userGPS.lat, userGPS.lng, p.lat, p.lng) });
      });
    });
  }, [userGPS]);

  function alertTier(tier: number, settings: AlarmSettings) {
    const now = new Date().toLocaleTimeString();
    if (tier===1) {
      const sorted = persRef.current
        .filter(function(p) { return p.tier===1 && p.distance!==undefined; })
        .sort(function(a,b) { return (a.distance||0)-(b.distance||0); })
        .slice(0,3);
      setPersonnel(function(prev) {
        return prev.map(function(p) {
          const hit = sorted.some(function(n) { return n.id===p.id; });
          return hit && p.status==='idle' ? Object.assign({},p,{status:'alerted' as const,alertedAt:now}) : p;
        });
      });
      const names = sorted.map(function(n) { return n.name; }).join(', ');
      notify('SanitiX — Level 1 Alarm', 'Nearest 3 workers alerted: '+names);
      startAlarm(settings);
      vibrate(settings.vibrationEnabled);
    } else if (tier===2) {
      setPersonnel(function(prev) {
        return prev.map(function(p) {
          return p.tier===2 && p.status==='idle' ? Object.assign({},p,{status:'alerted' as const,alertedAt:now}) : p;
        });
      });
      notify('SanitiX — Level 2 Escalation', 'No worker response. All supervisors notified.');
      startAlarm(settings);
      vibrate(settings.vibrationEnabled);
    } else {
      setPersonnel(function(prev) {
        return prev.map(function(p) {
          return p.tier===3 && p.status==='idle' ? Object.assign({},p,{status:'alerted' as const,alertedAt:now}) : p;
        });
      });
      // Officials: NOTIFICATION ONLY
      notify('SanitiX — Level 3 (Officials)', 'Work still incomplete after 40 minutes. Immediate intervention required.');
    }
  }

  function startCountdown(fromLevel: number, settings: AlarmSettings) {
    clearTimeout(timerRef.current);
    clearInterval(countRef.current);
    if (fromLevel>=3) return;
    let rem = 1200;
    setEscTimer(rem);
    countRef.current = setInterval(function() {
      rem--;
      setEscTimer(rem);
      if (rem<=0) clearInterval(countRef.current);
    }, 1000);
    timerRef.current = setTimeout(function() {
      const curr = persRef.current;
      const tierAck = curr.some(function(p) {
        return p.tier===fromLevel && (p.status==='acknowledged' || p.status==='completed');
      });
      if (!tierAck && alertRef.current && alertRef.current.active) {
        const next = fromLevel+1;
        setEscLevel(next);
        setActiveAlert(function(prev) { return prev ? Object.assign({},prev,{escalationLevel:next}) : prev; });
        setHistory(function(h) { return h.map(function(e) { return e.active ? Object.assign({},e,{escalationLevel:next}) : e; }); });
        alertTier(next, settings);
        if (next<3) startCountdown(next, settings);
      }
    }, 1200000); // 20 minutes
  }

  const result = (function() {
    const sig = (x: number) => 1/(1+Math.exp(-x));
    const c = ((sensors.h2s-200)/150)*0.4+((sensors.mq135-450)/200)*0.25+((sensors.humidity-65)/18)*0.15+((sensors.waste-65)/20)*0.2;
    const r15=Math.min(0.99,Math.max(0.01,sig(c*1.2-0.5)));
    const r30=Math.min(0.99,Math.max(0.01,sig(c*1.5)));
    const r60=Math.min(0.99,Math.max(0.01,sig(c*1.8+0.3)));
    const ov=(r15+r30+r60)/3;
    const cat=ov<0.25?'LOW':ov<0.5?'MODERATE':ov<0.75?'HIGH':'CRITICAL';
    return {r15,r30,r60,ov,cat,eta:Math.round((1-r30)*60),conf:Math.round(ov*100)};
  })();

  useEffect(function() {
    const curr = result.cat;
    const prev = prevCat.current;
    const escalated = (curr==='HIGH' && prev!=='HIGH' && prev!=='CRITICAL') || (curr==='CRITICAL' && prev!=='CRITICAL');
    if (escalated && (!activeAlert || !activeAlert.active)) {
      const id = Date.now().toString();
      const now = new Date().toLocaleTimeString();
      const ev: AlertEvent = { id, time: now, category: curr, risk: result.conf, escalationLevel: 1, active: true };
      setActiveAlert(ev);
      setHistory(function(h) { return [ev].concat(h); });
      setEscLevel(1);
      setPersonnel(BASE_PERSONNEL.map(function(p) {
        const found = personnel.find(function(x) { return x.id===p.id; });
        return Object.assign({}, found||p, {status:'idle'});
      }));
      alertTier(1, alarmS);
      startCountdown(1, alarmS);
    }
    prevCat.current = curr;
  }, [result.cat]);

  function handleAck(id: string) {
    const now = new Date().toLocaleTimeString();
    clearTimeout(timerRef.current);
    clearInterval(countRef.current);
    setEscTimer(0);
    setPersonnel(function(prev) {
      return prev.map(function(p) {
        return p.id===id ? Object.assign({},p,{status:'acknowledged' as const,respondedAt:now}) : p;
      });
    });
  }

  function handleComplete(id: string) {
    const person = personnel.find(function(p) { return p.id===id; });
    const now = new Date().toLocaleTimeString();
    stopAlarm();
    clearTimeout(timerRef.current);
    clearInterval(countRef.current);
    setPersonnel(function(prev) {
      return prev.map(function(p) {
        return p.id===id ? Object.assign({},p,{status:'completed' as const,completedAt:now}) : p;
      });
    });
    setActiveAlert(null);
    setHistory(function(prev) {
      return prev.map(function(e) {
        return e.active ? Object.assign({},e,{active:false,completedBy:person?person.name:id,completedAt:now}) : e;
      });
    });
    notify('SanitiX — Resolved', 'Work completed by '+(person?person.name:id)+'. All clear.');
    prevCat.current = 'LOW';
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a111e', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <Router>
        <Sidebar alarm={activeAlert!==null && activeAlert.active} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/"         element={<SensorControl sensors={sensors} setSensors={setSensors} result={result} />} />
            <Route path="/dispatch" element={<DispatchBoard personnel={personnel} activeAlert={activeAlert} escalationLevel={escLevel} escalationTimer={escTimer} onAck={handleAck} onComplete={handleComplete} />} />
            <Route path="/history"  element={<AlertHistory history={history} />} />
            <Route path="/settings" element={<Settings s={alarmS} setS={setAlarmS} />} />
            <Route path="/about"    element={<About />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}