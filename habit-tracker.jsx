import { useState, useEffect, useCallback } from "react";

const HABITS = [
  { id: "exercise",     label: "Exercise",               time: "4:00–5:00 AM",  icon: "🏃", cat: "morning", color: "#f97316" },
  { id: "prayer_fajr", label: "Fajr Prayer",            time: "5:00–5:15 AM",  icon: "🤲", cat: "morning", color: "#a78bfa" },
  { id: "reading",     label: "Reading",                 time: "5:15–6:00 AM",  icon: "📖", cat: "morning", color: "#34d399" },
  { id: "academics",   label: "Academic Studies",        time: "6:00–8:30 AM",  icon: "📚", cat: "morning", color: "#60a5fa" },
  { id: "get_ready",   label: "Get Ready for College",   time: "8:30–9:00 AM",  icon: "🎒", cat: "morning", color: "#facc15" },
  { id: "hydration",   label: "Drink 2L+ Water",         time: "All day",       icon: "💧", cat: "morning", color: "#38bdf8" },
  { id: "prayer_zuhr", label: "Zuhr Prayer",             time: "12:30–1:00 PM", icon: "🤲", cat: "evening", color: "#a78bfa" },
  { id: "writing",     label: "Writing & Other Work",    time: "2:00–5:00 PM",  icon: "✍️", cat: "evening", color: "#fb923c" },
  { id: "prayer_asr",  label: "Asr Prayer",              time: "5:00–5:30 PM",  icon: "🤲", cat: "evening", color: "#a78bfa" },
  { id: "python_ai",   label: "Python & AI Classes",     time: "5:30–7:00 PM",  icon: "🤖", cat: "evening", color: "#4ade80" },
  { id: "prayer_mag",  label: "Maghrib Prayer",          time: "7:00–7:30 PM",  icon: "🤲", cat: "evening", color: "#a78bfa" },
  { id: "quantum",     label: "Quantum Physics",         time: "7:30–8:30 PM",  icon: "⚛️", cat: "evening", color: "#f472b6" },
  { id: "prayer_isha", label: "Isha Prayer",             time: "8:30–9:00 PM",  icon: "🤲", cat: "evening", color: "#a78bfa" },
  { id: "rest",        label: "Rest & Unwind",           time: "9:00–9:30 PM",  icon: "😌", cat: "evening", color: "#94a3b8" },
  { id: "code",        label: "Code Practice",           time: "9:30–10:30 PM", icon: "💻", cat: "evening", color: "#22d3ee" },
  { id: "no_phone",    label: "No Phone After 10:30",    time: "10:30 PM+",     icon: "📵", cat: "evening", color: "#f87171" },
  { id: "gratitude",   label: "Gratitude / Journal",     time: "Before Sleep",  icon: "🌙", cat: "evening", color: "#c084fc" },
];

const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getMondayOf(date) {
  const d = new Date(date); d.setHours(0,0,0,0);
  const dow = d.getDay() || 7;
  d.setDate(d.getDate() - dow + 1);
  return d;
}
function dateKey(date) { return date.toISOString().split("T")[0]; }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDowOfMonth(y, m) { return (new Date(y, m, 1).getDay() + 6) % 7; }
function todayKey() { return dateKey(new Date()); }

const START_DATE = "2026-04-24"; // tracking starts from this day
const STORAGE_KEY = "sameer_habits_v3";
function loadData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } }
function saveData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

function scoreForDate(dk, data) {
  const day = data[dk] || {};
  return Math.round((HABITS.filter(h => day[h.id]).length / HABITS.length) * 100);
}

function weekScoreFor(monday, data) {
  let t = 0;
  for (let i = 0; i < 7; i++) t += scoreForDate(dateKey(addDays(monday, i)), data);
  return Math.round(t / 7);
}

function computeStreak(habitId, data) {
  let streak = 0, d = new Date();
  const tk = dateKey(d);
  if (!data[tk]?.[habitId]) d = addDays(d, -1);
  for (let i = 0; i < 365; i++) {
    if (data[dateKey(d)]?.[habitId]) { streak++; d = addDays(d, -1); }
    else break;
  }
  return streak;
}

function getMotivation(s) {
  if (s === 100) return "Flawless! You're built different, Sameer 🔥";
  if (s >= 80) return "Almost perfect. Keep that energy! 💪";
  if (s >= 50) return "Solid progress. One habit at a time 🌱";
  if (s > 0) return "Every check counts. Don't give up! ⚡";
  return "Ready to conquer? Let's go! 🚀";
}

export default function HabitTracker() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("day");
  const [activeDate, setActiveDate] = useState(new Date());
  const [monthYear, setMonthYear] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });

  useEffect(() => { saveData(data); }, [data]);

  const toggle = useCallback((habitId, dk) => {
    setData(prev => {
      const day = { ...(prev[dk] || {}) };
      day[habitId] = !day[habitId];
      return { ...prev, [dk]: day };
    });
  }, []);

  const streaks = Object.fromEntries(HABITS.map(h => [h.id, computeStreak(h.id, data)]));
  const activeDk = dateKey(activeDate);
  const todayDk = todayKey();
  const dayScore = scoreForDate(activeDk, data);
  const isToday = activeDk === todayDk;

  const topStreak = Math.max(...Object.values(streaks), 0);

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const mon = getMondayOf(addDays(new Date(), -(7 - i) * 7));
    return { monday: mon, score: weekScoreFor(mon, data) };
  });

  const tabs = [["day","📅 Day"],["week","📊 Week"],["month","🗓 Month"],["history","📈 History"]];

  return (
    <div style={{ minHeight:"100vh", background:"#07070f", fontFamily:"'Plus Jakarta Sans','Segoe UI',sans-serif", color:"#e2e8f0", paddingBottom:48 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        button{font-family:inherit;cursor:pointer;border:none;outline:none}
        .hrow{transition:background .15s,border-color .15s;cursor:pointer;border-radius:14px}
        .hrow:hover{filter:brightness(1.08)}
        .chk{transition:transform .15s,background .15s,border-color .15s}
        .chk:hover{transform:scale(1.18)}
        .nb:hover{filter:brightness(1.2)}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        .fin{animation:fi .3s ease both}
        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .bar{transition:height .6s cubic-bezier(.4,0,.2,1)}
      `}</style>

      {/* STICKY HEADER */}
      <div style={{ position:"sticky",top:0,zIndex:50,background:"#07070f",borderBottom:"1px solid #111827",padding:"18px 16px 14px" }}>
        <div style={{ maxWidth:540,margin:"0 auto" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14 }}>
            <div>
              <p style={{ fontSize:10,color:"#374151",letterSpacing:2,textTransform:"uppercase",fontWeight:700 }}>Daily Habit Tracker</p>
              <h1 style={{ fontSize:24,fontWeight:800,background:"linear-gradient(90deg,#60a5fa,#c084fc,#f472b6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.2 }}>
                Sameer's Routine
              </h1>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:36,fontWeight:800,lineHeight:1,color:dayScore>=80?"#4ade80":dayScore>=50?"#facc15":"#f87171" }}>
                {view==="day"?dayScore:weekScoreFor(getMondayOf(activeDate),data)}%
              </div>
              <div style={{ fontSize:9,color:"#374151",letterSpacing:1.5,fontWeight:700 }}>
                {view==="day"?(isToday?"TODAY":"THAT DAY"):"WEEK AVG"}
              </div>
            </div>
          </div>
          <div style={{ display:"flex",gap:4,background:"#0d0d1a",borderRadius:12,padding:3 }}>
            {tabs.map(([v,label])=>(
              <button key={v} onClick={()=>setView(v)}
                style={{ flex:1,padding:"7px 0",borderRadius:9,fontSize:11,fontWeight:700,transition:"all .2s",
                  background:view===v?"linear-gradient(135deg,#3b82f6,#7c3aed)":"transparent",
                  color:view===v?"#fff":"#374151" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth:540,margin:"0 auto",padding:"18px 14px" }} className="fin" key={view}>

        {/* ══ DAY ══ */}
        {view==="day" && <>
          {/* Day strip */}
          <div style={{ display:"flex",gap:5,marginBottom:14,overflowX:"auto",paddingBottom:4 }}>
            {DAYS_SHORT.map((d,i)=>{
              const monday = getMondayOf(activeDate);
              const dt = addDays(monday,i);
              const dk = dateKey(dt);
              const isActive = dk===activeDk;
              const isTdy = dk===todayDk;
              const s = scoreForDate(dk,data);
              return (
                <button key={d} onClick={()=>setActiveDate(dt)} className="nb"
                  style={{ flex:"0 0 auto",minWidth:48,padding:"8px 3px",borderRadius:11,
                    background:isActive?"linear-gradient(135deg,#3b82f6,#7c3aed)":"rgba(255,255,255,0.02)",
                    border:`1px solid ${isTdy&&!isActive?"#3b82f655":"transparent"}`,
                    color:isActive?"#fff":"#475569" }}>
                  <div style={{ fontSize:9,fontWeight:700,marginBottom:3 }}>{d}</div>
                  <div style={{ fontSize:12,fontWeight:700 }}>{dt.getDate()}</div>
                  {s>0&&<div style={{ fontSize:9,marginTop:2,color:isActive?"#bfdbfe":s>=80?"#4ade80":s>=50?"#facc15":"#f97316" }}>{s}%</div>}
                </button>
              );
            })}
            <button className="nb" onClick={()=>setActiveDate(new Date())}
              style={{ flex:"0 0 auto",padding:"8px 10px",borderRadius:11,
                background:"rgba(59,130,246,0.1)",border:"1px solid #3b82f620",color:"#60a5fa",fontSize:11,fontWeight:700 }}>
              Today
            </button>
          </div>

          <p style={{ fontSize:12,color:"#4b5563",fontStyle:"italic",marginBottom:18 }}>{getMotivation(dayScore)}</p>

          <HabitSection title="🌅 Morning" habits={HABITS.filter(h=>h.cat==="morning")} dk={activeDk} data={data} toggle={toggle} streaks={streaks} />
          <HabitSection title="🌆 Evening" habits={HABITS.filter(h=>h.cat==="evening")} dk={activeDk} data={data} toggle={toggle} streaks={streaks} />
        </>}

        {/* ══ WEEK ══ */}
        {view==="week" && <>
          <WeekNav activeDate={activeDate} setActiveDate={setActiveDate} data={data} />
          <WeekGrid activeDate={activeDate} data={data} toggle={toggle} todayDk={todayDk} />
        </>}

        {/* ══ MONTH ══ */}
        {view==="month" && <>
          <MonthNav monthYear={monthYear} setMonthYear={setMonthYear} />
          <MonthCalendar monthYear={monthYear} data={data} todayDk={todayDk}
            onSelectDay={d=>{ setActiveDate(d); setView("day"); }} />
          <MonthStats monthYear={monthYear} data={data} />
        </>}

        {/* ══ HISTORY ══ */}
        {view==="history" && <HistoryView weeks={weeks} streaks={streaks} topStreak={topStreak} data={data} />}
      </div>
    </div>
  );
}

/* ─── HABIT SECTION ─────────────────────────────────────── */
function HabitSection({ title, habits, dk, data, toggle, streaks }) {
  const done = habits.filter(h=>data[dk]?.[h.id]).length;
  return (
    <div style={{ marginBottom:26 }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
        <h2 style={{ fontSize:14,fontWeight:700,color:"#94a3b8" }}>{title}</h2>
        <span style={{ fontSize:11,color:"#374151",fontWeight:600 }}>{done}/{habits.length} done</span>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
        {habits.map(h=>{
          const checked=!!data[dk]?.[h.id];
          const streak=streaks[h.id]||0;
          return (
            <div key={h.id} className="hrow" onClick={()=>toggle(h.id,dk)}
              style={{ display:"flex",alignItems:"center",gap:11,padding:"10px 12px",
                background:checked?`${h.color}14`:"rgba(255,255,255,0.02)",
                border:`1px solid ${checked?h.color+"40":"#111827"}` }}>
              <span style={{ fontSize:18,minWidth:24,textAlign:"center" }}>{h.icon}</span>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,fontWeight:600,color:checked?"#f1f5f9":"#6b7280" }}>{h.label}</div>
                <div style={{ fontSize:10,color:"#1f2937",marginTop:1 }}>{h.time}</div>
              </div>
              {streak>0&&(
                <div style={{ display:"inline-flex",alignItems:"center",gap:3,background:"#1a1025",borderRadius:20,padding:"2px 7px",fontSize:10,fontWeight:700,color:"#f97316",flexShrink:0 }}>
                  🔥{streak}d
                </div>
              )}
              <div className="chk" style={{ width:25,height:25,borderRadius:7,flexShrink:0,
                background:checked?h.color:"transparent",
                border:`2px solid ${checked?h.color:"#1f2937"}`,
                display:"flex",alignItems:"center",justifyContent:"center" }}>
                {checked&&<span style={{ fontSize:12,color:"#fff",fontWeight:700 }}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── WEEK NAV ──────────────────────────────────────────── */
function WeekNav({ activeDate, setActiveDate, data }) {
  const monday = getMondayOf(activeDate);
  const sunday = addDays(monday,6);
  const score = weekScoreFor(monday,data);
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,
      background:"#0d0d1a",borderRadius:14,padding:"10px 14px",border:"1px solid #111827" }}>
      <button className="nb" onClick={()=>setActiveDate(addDays(monday,-7))}
        style={{ padding:"4px 12px",borderRadius:8,background:"rgba(255,255,255,0.04)",color:"#6b7280",fontSize:18 }}>‹</button>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:12,fontWeight:700,color:"#94a3b8" }}>
          {monday.getDate()} {MONTHS_SHORT[monday.getMonth()]} – {sunday.getDate()} {MONTHS_SHORT[sunday.getMonth()]}
        </div>
        <div style={{ fontSize:22,fontWeight:800,color:score>=80?"#4ade80":score>=50?"#facc15":"#f97316",lineHeight:1.2 }}>{score}% avg</div>
      </div>
      <button className="nb" onClick={()=>setActiveDate(addDays(monday,7))}
        style={{ padding:"4px 12px",borderRadius:8,background:"rgba(255,255,255,0.04)",color:"#6b7280",fontSize:18 }}>›</button>
    </div>
  );
}

/* ─── WEEK GRID ─────────────────────────────────────────── */
function WeekGrid({ activeDate, data, toggle, todayDk }) {
  const monday = getMondayOf(activeDate);
  const days = Array.from({length:7},(_,i)=>addDays(monday,i));
  const dks = days.map(dateKey);
  const sections = [
    { title:"🌅 Morning", habits:HABITS.filter(h=>h.cat==="morning") },
    { title:"🌆 Evening", habits:HABITS.filter(h=>h.cat==="evening") },
  ];
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ minWidth:360 }}>
        {/* Header row */}
        <div style={{ display:"grid",gridTemplateColumns:"140px repeat(7,1fr)",gap:3,marginBottom:8 }}>
          <div/>
          {days.map((d,i)=>(
            <div key={i} style={{ textAlign:"center",fontSize:9,fontWeight:700,lineHeight:1.4,
              color:dks[i]===todayDk?"#60a5fa":"#374151" }}>
              <div>{DAYS_SHORT[i]}</div>
              <div style={{ fontSize:11 }}>{d.getDate()}</div>
            </div>
          ))}
        </div>

        {sections.map(sec=>(
          <div key={sec.title}>
            <div style={{ fontSize:10,color:"#374151",fontWeight:700,letterSpacing:1,textTransform:"uppercase",padding:"10px 0 5px 2px" }}>{sec.title}</div>
            {sec.habits.map(h=>(
              <div key={h.id} style={{ display:"grid",gridTemplateColumns:"140px repeat(7,1fr)",gap:3,marginBottom:3,alignItems:"center" }}>
                <div style={{ display:"flex",alignItems:"center",gap:6,paddingLeft:2 }}>
                  <span style={{ fontSize:13 }}>{h.icon}</span>
                  <span style={{ fontSize:10,color:"#4b5563",fontWeight:500,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{h.label}</span>
                </div>
                {dks.map((dk,i)=>{
                  const checked=!!data[dk]?.[h.id];
                  const isFuture=dk>todayDk;
                  return (
                    <div key={i} className="chk" onClick={()=>!isFuture&&toggle(h.id,dk)}
                      style={{ width:28,height:28,borderRadius:7,margin:"0 auto",
                        background:checked?h.color:"rgba(255,255,255,0.02)",
                        border:`1.5px solid ${checked?h.color:dks[i]===todayDk?"#3b82f620":"#111827"}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        opacity:isFuture?0.25:1,cursor:isFuture?"default":"pointer" }}>
                      {checked&&<span style={{ fontSize:11,color:"#fff",fontWeight:700 }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}

        {/* Score row */}
        <div style={{ display:"grid",gridTemplateColumns:"140px repeat(7,1fr)",gap:3,
          marginTop:12,borderTop:"1px solid #111827",paddingTop:10 }}>
          <div style={{ fontSize:10,color:"#374151",fontWeight:700,paddingLeft:2 }}>Day Score</div>
          {dks.map((dk,i)=>{
            const s=scoreForDate(dk,data);
            return (
              <div key={i} style={{ textAlign:"center",fontSize:11,fontWeight:800,
                color:s>=80?"#4ade80":s>=50?"#facc15":s>0?"#f97316":"#1f2937" }}>
                {s>0?`${s}%`:"–"}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── MONTH NAV ─────────────────────────────────────────── */
function MonthNav({ monthYear, setMonthYear }) {
  const go = (delta) => {
    let { year, month } = monthYear;
    month += delta;
    if (month < 0) { month = 11; year--; }
    if (month > 11) { month = 0; year++; }
    setMonthYear({ year, month });
  };
  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
      <button className="nb" onClick={()=>go(-1)}
        style={{ padding:"7px 14px",borderRadius:10,background:"rgba(255,255,255,0.03)",color:"#6b7280",fontSize:18 }}>‹</button>
      <span style={{ fontSize:16,fontWeight:800,color:"#cbd5e1" }}>{MONTHS[monthYear.month]} {monthYear.year}</span>
      <button className="nb" onClick={()=>go(1)}
        style={{ padding:"7px 14px",borderRadius:10,background:"rgba(255,255,255,0.03)",color:"#6b7280",fontSize:18 }}>›</button>
    </div>
  );
}

/* ─── MONTH CALENDAR ────────────────────────────────────── */
function MonthCalendar({ monthYear, data, todayDk, onSelectDay }) {
  const { year, month } = monthYear;
  const total = daysInMonth(year, month);
  const firstDow = firstDowOfMonth(year, month);
  const cells = [...Array(firstDow).fill(null), ...Array.from({length:total},(_,i)=>i+1)];

  const colorFor = (s, isFuture) => {
    if (isFuture) return "rgba(255,255,255,0.02)";
    if (s === 100) return "rgba(74,222,128,0.25)";
    if (s >= 75)  return "rgba(74,222,128,0.12)";
    if (s >= 50)  return "rgba(250,204,21,0.15)";
    if (s > 0)    return "rgba(249,115,22,0.15)";
    return "rgba(255,255,255,0.02)";
  };
  const dotFor = (s, isFuture) => {
    if (isFuture) return "transparent";
    if (s === 100) return "#4ade80";
    if (s >= 75)  return "#86efac";
    if (s >= 50)  return "#facc15";
    if (s > 0)    return "#f97316";
    return "#1f2937";
  };

  return (
    <div style={{ background:"#0d0d1a",border:"1px solid #111827",borderRadius:16,padding:14,marginBottom:14 }}>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:8 }}>
        {DAYS_SHORT.map(d=><div key={d} style={{ textAlign:"center",fontSize:9,color:"#374151",fontWeight:700 }}>{d}</div>)}
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3 }}>
        {cells.map((day,idx)=>{
          if (!day) return <div key={`e${idx}`}/>;
          const dk=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const s=scoreForDate(dk,data);
          const isToday=dk===todayDk;
          const isFuture=dk>todayDk;
          const isBeforeStart=dk<START_DATE;
          return (
            <button key={dk} onClick={()=>!isBeforeStart&&onSelectDay(new Date(year,month,day))}
              style={{ aspectRatio:"1",borderRadius:9,
                background:isBeforeStart?"transparent":colorFor(s,isFuture),
                border:`1.5px solid ${isToday?"#3b82f6":"transparent"}`,
                display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,
                opacity:(isFuture||isBeforeStart)?0.2:1,cursor:(isFuture||isBeforeStart)?"default":"pointer" }}>
              <span style={{ fontSize:11,fontWeight:isToday?800:500,color:isToday?"#60a5fa":"#94a3b8" }}>{day}</span>
              <div style={{ width:4,height:4,borderRadius:"50%",background:dotFor(s,isFuture) }}/>
            </button>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display:"flex",gap:10,marginTop:12,justifyContent:"center",flexWrap:"wrap" }}>
        {[["#4ade80","100%"],["#86efac","75%+"],["#facc15","50%+"],["#f97316","1%+"],["#1f2937","0%"]].map(([c,l])=>(
          <div key={l} style={{ display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#374151" }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:c }}/>{l}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── MONTH STATS ───────────────────────────────────────── */
function MonthStats({ monthYear, data }) {
  const { year, month } = monthYear;
  const tk = todayKey();
  let perfect=0, above50=0, total=0, scoreSum=0;
  for (let d=1; d<=daysInMonth(year,month); d++) {
    const dk=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (dk>tk) continue;
    const s=scoreForDate(dk,data);
    scoreSum+=s; total++;
    if (s===100) perfect++;
    if (s>=50) above50++;
  }
  const avg=total?Math.round(scoreSum/total):0;
  return (
    <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
      {[
        {label:"Avg Score",value:`${avg}%`,color:"#60a5fa",icon:"📊"},
        {label:"Perfect Days",value:perfect,color:"#4ade80",icon:"🏆"},
        {label:"50%+ Days",value:above50,color:"#facc15",icon:"⭐"},
      ].map(s=>(
        <div key={s.label} style={{ background:"#0d0d1a",border:"1px solid #111827",borderRadius:14,padding:"13px 8px",textAlign:"center" }}>
          <div style={{ fontSize:20 }}>{s.icon}</div>
          <div style={{ fontSize:20,fontWeight:800,color:s.color,marginTop:4 }}>{s.value}</div>
          <div style={{ fontSize:9,color:"#374151",marginTop:2,fontWeight:600 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── HISTORY VIEW ──────────────────────────────────────── */
function HistoryView({ weeks, streaks, topStreak, data }) {
  const topHabits = [...HABITS].sort((a,b)=>(streaks[b.id]||0)-(streaks[a.id]||0));
  const maxWeekScore = Math.max(...weeks.map(w=>w.score), 1);

  return (
    <>
      {/* Streak Leaderboard */}
      <div style={{ background:"#0d0d1a",border:"1px solid #111827",borderRadius:16,padding:16,marginBottom:14 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <h3 style={{ fontSize:14,fontWeight:700,color:"#cbd5e1" }}>🔥 Current Streaks</h3>
          {topStreak>0&&<div style={{ fontSize:10,color:"#f97316",fontWeight:700,background:"#1a1025",borderRadius:20,padding:"3px 10px" }}>
            Best: {topStreak}d
          </div>}
        </div>
        {topHabits.slice(0,6).map((h,i)=>{
          const s=streaks[h.id]||0;
          const pct=topStreak>0?Math.round((s/topStreak)*100):0;
          return (
            <div key={h.id} style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
              <span style={{ fontSize:16,minWidth:22,textAlign:"center" }}>{h.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                  <span style={{ fontSize:11,fontWeight:600,color:"#6b7280" }}>{h.label}</span>
                  <span style={{ fontSize:11,fontWeight:800,color:s>0?"#f97316":"#1f2937" }}>
                    {s>0?`🔥 ${s}d`:"–"}
                  </span>
                </div>
                <div style={{ height:5,borderRadius:3,background:"#111827",overflow:"hidden" }}>
                  <div style={{ height:"100%",borderRadius:3,background:h.color,width:`${pct}%`,transition:"width .6s" }}/>
                </div>
              </div>
              <span style={{ fontSize:10,color:"#374151",fontWeight:700,minWidth:18,textAlign:"right" }}>#{i+1}</span>
            </div>
          );
        })}
      </div>

      {/* Weekly bar chart */}
      <div style={{ background:"#0d0d1a",border:"1px solid #111827",borderRadius:16,padding:16,marginBottom:14 }}>
        <h3 style={{ fontSize:14,fontWeight:700,color:"#cbd5e1",marginBottom:16 }}>📈 Last 8 Weeks</h3>
        <div style={{ display:"flex",gap:6,alignItems:"flex-end",height:130 }}>
          {weeks.map(({monday,score},i)=>(
            <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
              <span style={{ fontSize:9,fontWeight:800,color:score>=80?"#4ade80":score>=50?"#facc15":"#f97316" }}>
                {score>0?`${score}%`:"–"}
              </span>
              <div style={{ width:"100%",background:"#111827",borderRadius:6,height:100,display:"flex",alignItems:"flex-end",overflow:"hidden" }}>
                <div className="bar" style={{ width:"100%",borderRadius:6,
                  background:score>=80?"linear-gradient(180deg,#4ade80,#16a34a)":
                             score>=50?"linear-gradient(180deg,#facc15,#ca8a04)":
                             score>0?"linear-gradient(180deg,#f97316,#c2410c)":"transparent",
                  height:`${score>0?Math.max(Math.round((score/100)*100),4):0}%` }}/>
              </div>
              <span style={{ fontSize:8,color:"#374151",fontWeight:600 }}>
                {monday.getDate()}/{MONTHS_SHORT[monday.getMonth()]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* All streaks grid */}
      <div style={{ background:"#0d0d1a",border:"1px solid #111827",borderRadius:16,padding:16 }}>
        <h3 style={{ fontSize:14,fontWeight:700,color:"#cbd5e1",marginBottom:12 }}>📋 All Streaks</h3>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:7 }}>
          {HABITS.map(h=>{
            const s=streaks[h.id]||0;
            return (
              <div key={h.id} style={{ display:"flex",alignItems:"center",gap:8,
                background:"rgba(255,255,255,0.02)",borderRadius:10,padding:"8px 10px",
                border:`1px solid ${s>0?h.color+"30":"#111827"}` }}>
                <span style={{ fontSize:15 }}>{h.icon}</span>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:10,color:"#4b5563",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{h.label}</div>
                  <div style={{ fontSize:12,fontWeight:800,color:s>0?h.color:"#1f2937" }}>{s>0?`🔥 ${s}d`:"–"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
