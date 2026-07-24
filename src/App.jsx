import { useState, useRef, useEffect } from "react";

const COMPETITORS = ["ADP TotalSource", "Paychex PEO", "Insperity", "TriNet", "Justworks", "Other"];

const QUICK_OBJECTIONS = [
  "ADP has better brand recognition",
  "Paychex is cheaper than you",
  "We're happy with our current provider",
  "We don't want to lose control of HR",
  "ADP TotalSource renewal looks fine",
  "Implementation seems too complex",
  "Their benefits network is larger",
  "We heard PEOs take over our employees",
];

const SYSTEM_PROMPT = `You are an elite PEO sales coach. A sales rep just heard an objection from a prospect. Give them a sharp, ready-to-use battle card.

Respond in exactly this structure:

**REFRAME**
One sentence that flips the objection into an opportunity or surfaces a hidden assumption.

**COUNTER POINTS**
- Bullet 1: specific, fact-based talking point
- Bullet 2: pain point they may not have considered
- Bullet 3: your differentiator that addresses this directly

**TRAP QUESTION**
One precise question to ask the prospect that puts them on their heels or reveals hidden pain.

**CLOSE LINE**
One confident, natural sentence to transition forward.

Be punchy. No fluff. Sales-ready language only.`;

const SECTION_CONFIG = {
  "REFRAME": { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", emoji: "↺" },
  "COUNTER POINTS": { color: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)", emoji: "⚡" },
  "TRAP QUESTION": { color: "#F87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", emoji: "🎯" },
  "CLOSE LINE": { color: "#34D399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)", emoji: "→" },
};

function parseResponse(text) {
  const sections = [];
  const keys = Object.keys(SECTION_CONFIG);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const pattern = new RegExp(
      `\\*\\*${key}\\*\\*\\s*([\\s\\S]*?)${nextKey ? `(?=\\*\\*${nextKey}\\*\\*)` : "$"}`,
      "i"
    );
    const match = text.match(pattern);
    if (match) sections.push({ key, content: match[1].trim() });
  }
  return sections;
}

function SectionCard({ sectionKey, content, delay }) {
  const cfg = SECTION_CONFIG[sectionKey];
  const lines = content.split("\n").filter((l) => l.trim());

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 10, padding: "16px 18px", marginBottom: 10,
      animation: `fadeUp 0.35s ease ${delay}s both`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{
          background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
          borderRadius: 5, width: 26, height: 26,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: cfg.color,
        }}>{cfg.emoji}</span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", color: cfg.color, textTransform: "uppercase", fontFamily: "monospace" }}>
          {sectionKey}
        </span>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.75, color: "#CBD5E1" }}>
        {lines.map((line, i) => {
          const isBullet = /^[-•–]/.test(line.trim());
          const text = line.replace(/^[-•–]\s*/, "").trim();
          return (
            <div key={i} style={{ display: "flex", gap: isBullet ? 10 : 0, marginBottom: 4 }}>
              {isBullet && <span style={{ color: cfg.color, marginTop: 2, flexShrink: 0 }}>▸</span>}
              <span>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [competitor, setCompetitor] = useState("ADP TotalSource");
  const [objection, setObjection] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("main");
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
    }
  }, [result]);

  const fire = async () => {
    if (!objection.trim() || loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://localhost:3001/api/battle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Competitor: ${competitor}\nObjection: "${objection}"` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "No response.";
      setResult(text);
      setHistory((h) => [{ competitor, objection, text, id: Date.now() }, ...h].slice(0, 15));
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  const reset = () => { setObjection(""); setResult(null); };
  const sections = result ? parseResponse(result) : [];

  return (
    <div style={{ minHeight: "100vh", background: "#080C18", color: "#E2E8F0" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080C18; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        textarea:focus { outline: none; border-color: rgba(96,165,250,0.4) !important; }
        textarea { transition: border-color 0.2s; }
      `}</style>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(8,12,24,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 20px",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
          <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, letterSpacing: 3, color: "#F1F5F9" }}>
            ⚔ BATTLECARD AI
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {["main", "history"].map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                background: view === v ? "rgba(96,165,250,0.12)" : "none",
                border: `1px solid ${view === v ? "rgba(96,165,250,0.25)" : "transparent"}`,
                borderRadius: 6, color: view === v ? "#93C5FD" : "#475569",
                fontFamily: "monospace", fontSize: 10, letterSpacing: 1, textTransform: "uppercase",
                padding: "5px 12px", cursor: "pointer",
              }}>
                {v === "history" ? `History ${history.length ? `(${history.length})` : ""}` : "Battle"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px" }}>

        {view === "main" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: "monospace", fontSize: 9, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
                Competing against
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {COMPETITORS.map((c) => (
                  <button key={c} onClick={() => setCompetitor(c)} style={{
                    background: competitor === c ? "rgba(96,165,250,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${competitor === c ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 6, color: competitor === c ? "#93C5FD" : "#64748B",
                    fontFamily: "monospace", fontSize: 11, padding: "7px 13px", cursor: "pointer",
                  }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontFamily: "monospace", fontSize: 9, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
                What did the prospect just say?
              </p>
              <textarea
                value={objection}
                onChange={(e) => setObjection(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.metaKey && fire()}
                placeholder="Type the objection here..."
                rows={3}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, color: "#E2E8F0",
                  fontFamily: "sans-serif", fontSize: 14, lineHeight: 1.6,
                  padding: "13px 15px", resize: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 26 }}>
              <p style={{ fontFamily: "monospace", fontSize: 9, color: "#334155", letterSpacing: 2, marginBottom: 8 }}>Quick picks →</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {QUICK_OBJECTIONS.map((q) => (
                  <button key={q} onClick={() => setObjection(q)} style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 4, color: "#475569", fontFamily: "monospace", fontSize: 10,
                    padding: "5px 10px", cursor: "pointer",
                  }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
              <button onClick={fire} disabled={!objection.trim() || loading} style={{
                background: !objection.trim() || loading ? "rgba(37,99,235,0.3)" : "linear-gradient(135deg, #2563EB, #1D4ED8)",
                border: "none", borderRadius: 8, color: "white",
                fontFamily: "monospace", fontSize: 11, letterSpacing: 3, textTransform: "uppercase",
                padding: "14px 40px", cursor: !objection.trim() || loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 28px rgba(37,99,235,0.35)",
              }}>
                {loading ? "Thinking..." : "⚡ Fire Counter"}
              </button>
            </div>

            {sections.length > 0 && (
              <div ref={resultRef}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: "#475569", letterSpacing: 2 }}>COUNTER VS</span>
                  <span style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 4, padding: "2px 10px", fontFamily: "monospace", fontSize: 10, color: "#93C5FD" }}>
                    {competitor}
                  </span>
                </div>
                {sections.map((s, i) => <SectionCard key={s.key} sectionKey={s.key} content={s.content} delay={i * 0.07} />)}
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <button onClick={reset} style={{ background: "none", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, color: "#475569", fontFamily: "monospace", fontSize: 10, letterSpacing: 1, padding: "8px 20px", cursor: "pointer" }}>
                    ↺ New objection
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {view === "history" && (
          <div>
            <p style={{ fontFamily: "monospace", fontSize: 9, color: "#475569", letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 }}>Recent battles</p>
            {history.length === 0 ? (
              <p style={{ textAlign: "center", color: "#334155", fontFamily: "monospace", fontSize: 12, padding: "60px 0" }}>No history yet — fire your first counter.</p>
            ) : history.map((item) => (
              <div key={item.id} onClick={() => { setCompetitor(item.competitor); setObjection(item.objection); setResult(item.text); setView("main"); }}
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "14px 16px", marginBottom: 8, cursor: "pointer" }}>
                <span style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 3, padding: "1px 8px", fontFamily: "monospace", fontSize: 9, color: "#93C5FD" }}>{item.competitor}</span>
                <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5, marginTop: 8 }}>"{item.objection}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
