import { useState, useEffect, useCallback, useRef } from "react";
import { Trophy, CalendarDays, Lock, Plus, Trash2, ShieldCheck, X, Check, KeyRound, Wand2, AlertTriangle, Copy, Printer, ChevronDown, ChevronRight, Megaphone, Pencil } from "lucide-react";
import { storage, adminAuth } from "./lib/storage";
import { LOGO_DATA_URI } from "./lib/logo";
import {
  LEGACY_TEAMS_KEY, LEGACY_MATCHES_KEY, SEASONS_KEY, CURRENT_SEASON_KEY,
  teamsKey, matchesKey, venuesKey, announcementsKey,
  formatDateTime, uid, formatDate,
  setWinner, setInvalid, matchOutcome, computeStandings, findVenueConflicts,
  generateRoundRobin, assignToDates,
  nextPowerOfTwo, buildSeedOrder, stageLabel, generateBracketMatches, bracketMatchOutcome, advanceBracket,
  BRAZYLIJSKI_CONFIGS, generateBrazylijskiMatches,
  saveAdminSession, loadAdminSession, clearAdminSession,
} from "./lib/leagueEngine";

const FONT_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
:root {
  --navy: #16303D;
  --navy-2: #1E3E4E;
  --navy-3: #0F232D;
  --oak: #C99A5B;
  --oak-dark: #B0824A;
  --chalk: #F2EFE9;
  --chalk-2: #EAE4D6;
  --amber: #F0A93B;
  --grey: #7C8B90;
  --rust: #B4573F;
  --line: #E2DBC9;
  --radius: 10px;
  --radius-sm: 7px;
  --shadow-sm: 0 1px 2px rgba(22, 48, 61, 0.06);
  --shadow-md: 0 4px 16px rgba(22, 48, 61, 0.10);
  --shadow-lg: 0 12px 32px rgba(22, 48, 61, 0.18);
}
* { box-sizing: border-box; }
.vb-root { font-family: 'IBM Plex Sans', sans-serif; color: var(--navy); }
.vb-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em; }

/* Scrollbars */
.vb-root ::-webkit-scrollbar { height: 8px; width: 8px; }
.vb-root ::-webkit-scrollbar-track { background: transparent; }
.vb-root ::-webkit-scrollbar-thumb { background: #C9C2B3; border-radius: 8px; }

.vb-tab {
  background: rgba(242, 239, 233, 0.06);
  border: 1px solid rgba(242, 239, 233, 0.16);
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease;
}
.vb-tab:hover:not(.active) { background: rgba(242, 239, 233, 0.13); border-color: rgba(242, 239, 233, 0.3); transform: translateY(-1px); }
.vb-tab.active {
  background: var(--oak);
  border-color: var(--oak-dark);
  box-shadow: 0 4px 12px rgba(201, 154, 91, 0.4);
}

.vb-input {
  background: #fff;
  border: 1px solid #D8D1BF;
  border-radius: var(--radius-sm);
  padding: 7px 11px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  color: var(--navy);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.vb-input:focus { outline: none; border-color: var(--oak); box-shadow: 0 0 0 3px rgba(201, 154, 91, 0.18); }
.vb-input:hover { border-color: #C9C2B3; }

.vb-btn {
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 600;
  border-radius: var(--radius-sm);
  padding: 9px 18px;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  border: none;
  box-shadow: var(--shadow-sm);
}
.vb-btn:hover { filter: brightness(1.07); box-shadow: var(--shadow-md); }
.vb-btn:active { transform: translateY(1px); box-shadow: var(--shadow-sm); }

.vb-score-input {
  width: 36px;
  text-align: center;
  background: var(--navy);
  color: var(--amber);
  border: 1px solid var(--navy-2);
  border-radius: 6px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 17px;
  padding: 4px 0;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.vb-score-input:focus { outline: none; border-color: var(--amber); box-shadow: 0 0 0 3px rgba(240, 169, 59, 0.25); }
.vb-score-input::-webkit-outer-spin-button, .vb-score-input::-webkit-inner-spin-button {
  -webkit-appearance: none; margin: 0;
}

.vb-protocol-table { width: 100%; border-collapse: collapse; }
.vb-protocol-table th, .vb-protocol-table td {
  border: 1px solid #16303D; padding: 6px 8px; font-size: 13px; text-align: center;
}
.vb-sig-line { border-bottom: 1px solid #16303D; height: 42px; }

.vb-header {
  background: linear-gradient(165deg, var(--navy) 0%, var(--navy-3) 100%);
  padding: clamp(14px, 4vw, 22px) clamp(14px, 4vw, 24px) 0 clamp(14px, 4vw, 24px);
  position: sticky; top: 0; z-index: 20;
  box-shadow: 0 6px 20px rgba(10, 22, 28, 0.25);
}
.vb-header-top { display: flex; align-items: center; gap: 12px; margin-bottom: clamp(10px, 3vw, 16px); flex-wrap: wrap; max-width: 920px; margin-left: auto; margin-right: auto; }
.vb-logo {
  width: clamp(32px, 8vw, 46px); height: clamp(32px, 8vw, 46px); flex-shrink: 0;
  border-radius: 50%; box-shadow: 0 0 0 2px rgba(240, 169, 59, 0.35), var(--shadow-sm);
}
.vb-title { color: var(--amber); font-size: clamp(22px, 6.5vw, 34px); line-height: 1; }
.vb-tabs { display: flex; gap: clamp(8px, 2.5vw, 12px); overflow-x: auto; -webkit-overflow-scrolling: touch; padding: 6px 0 16px 0; max-width: 920px; margin-left: auto; margin-right: auto; scrollbar-width: none; -ms-overflow-style: none; }
.vb-tabs::-webkit-scrollbar { display: none; }
.vb-tab-btn { display: flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 999px; font-size: clamp(12px, 3.2vw, 14px); font-weight: 600; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; white-space: nowrap; }
.vb-content { padding: clamp(14px, 4vw, 26px); max-width: 920px; margin: 0 auto; }

.vb-match-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; background: #FFFFFF; border: 1px solid var(--line);
  border-left: 3px solid var(--line);
  border-radius: var(--radius-sm); margin-bottom: 8px; flex-wrap: wrap; gap: 8px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.vb-match-card:hover { box-shadow: var(--shadow-md); border-left-color: var(--oak); transform: translateY(-1px); }
.vb-match-info { display: flex; align-items: center; gap: 14px; flex: 1 1 260px; flex-wrap: wrap; min-width: 0; }
.vb-match-date { font-size: 12px; color: var(--grey); white-space: nowrap; }
.vb-match-teams { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-width: 0; }
.vb-match-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.vb-standings-wrap {
  overflow-x: auto; -webkit-overflow-scrolling: touch;
  border: 1px solid var(--line); border-radius: var(--radius); background: #fff;
  box-shadow: var(--shadow-sm);
}
.vb-standings-table { width: 100%; min-width: 480px; border-collapse: collapse; }
.vb-standings-table thead th { background: var(--chalk-2); }
.vb-standings-table tbody tr { transition: background-color 0.12s ease; }
.vb-standings-table tbody tr:hover { background-color: #F5F0E4 !important; }

@media (max-width: 480px) {
  .vb-tabs { gap: 6px; padding: 4px 0 12px 0; }
  .vb-tab-btn { font-size: 11.5px; gap: 4px; padding: 7px 11px; }
  .vb-match-card { flex-direction: column; align-items: stretch; gap: 8px; }
  .vb-match-info { flex-direction: column; align-items: flex-start; gap: 6px; flex: none; }
  .vb-match-actions { width: 100%; justify-content: space-between; }
  .vb-sig-row { flex-direction: column !important; }
  .vb-protocol-sheet, .vb-poster-sheet { padding: 20px 16px !important; }
  .vb-standings-wrap { overflow-x: hidden; }
  .vb-standings-table { min-width: 0 !important; table-layout: fixed; width: 100%; }
  .vb-standings-table th, .vb-standings-table td { padding: 8px 3px !important; font-size: 11px !important; }
  .vb-standings-table th:nth-child(1), .vb-standings-table td:nth-child(1) { width: 8%; }
  .vb-standings-table th:nth-child(2), .vb-standings-table td:nth-child(2) { width: 26%; white-space: normal; word-break: normal; overflow-wrap: break-word; line-height: 1.25; }
  .vb-standings-table th:nth-child(3), .vb-standings-table td:nth-child(3),
  .vb-standings-table th:nth-child(4), .vb-standings-table td:nth-child(4),
  .vb-standings-table th:nth-child(5), .vb-standings-table td:nth-child(5) { width: 7%; }
  .vb-standings-table th:nth-child(6), .vb-standings-table td:nth-child(6),
  .vb-standings-table th:nth-child(7), .vb-standings-table td:nth-child(7) { width: 15%; white-space: nowrap; }
  .vb-standings-table th:nth-child(8), .vb-standings-table td:nth-child(8) { width: 15%; }
  .vb-score-input { width: 30px; font-size: 15px; padding: 3px 0; }
  .vb-sets-row { row-gap: 6px; }
}
@media print {
  #vb-app-content, .vb-no-print { display: none !important; }
  .vb-protocol-overlay, .vb-poster-overlay {
    position: static !important; background: #fff !important; padding: 0 !important;
    display: block !important;
  }
  .vb-protocol-sheet, .vb-poster-sheet { box-shadow: none !important; border: none !important; margin: 0 !important; }
  .vb-poster-round { break-inside: avoid; page-break-inside: avoid; }
}
`;

// Wspólny hak: mierzy dostępny rozmiar kontenera (szerokość + to, co zostało
// do dołu ekranu) i wylicza skalę potrzebną, żeby treść o wymiarach
// contentWidth x contentHeight zmieściła się bez przewijania. Checkbox
// "fitToScreen" pozwala to wyłączyć. Używany przez BrazylijskiGraphSVG i
// RundyColumnsView, żeby nie duplikować pomiaru DOM w dwóch miejscach.
function useFitToScreen(contentWidth, contentHeight) {
  const containerRef = useRef(null);
  const [fitToScreen, setFitToScreen] = useState(true);
  const [containerWidth, setContainerWidth] = useState(null);
  const [availableHeight, setAvailableHeight] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setContainerWidth(el.clientWidth);
      const top = el.getBoundingClientRect().top;
      setAvailableHeight(Math.max(240, window.innerHeight - top - 24));
    };
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (ro) ro.observe(el);
    window.addEventListener("resize", update);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", update); };
  }, []);

  const scale = fitToScreen && containerWidth
    ? Math.min(1, containerWidth / contentWidth, availableHeight ? availableHeight / contentHeight : 1)
    : 1;

  return { containerRef, scale, fitToScreen, setFitToScreen };
}

// Pełny graf systemu brazylijskiego (opcjonalny widok, obok prostszych kolumn) —
// każdy mecz jako "pudełko" z dwiema drużynami, a strzałki pokazują skąd biorą
// się kolejni rywale (zwycięzca/przegrany poprzedniego meczu). Odpowiednik
// oryginalnego grafu SVG, przestylowany na kolory Ligi Siatkówki.
function BrazylijskiGraphSVG({ matches, teamName, setsToWin, pointsPerSet }) {
  const colW = 190, colGap = 55, rowH = 64, rowGap = 24, marginX = 24, marginTop = 34;
  const svgRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState("");

  const byId = {};
  matches.forEach((m) => { byId[m.id] = m; });

  const byRound = {};
  matches.forEach((m) => {
    const d = m.bracket?.roundIndex ?? 0;
    (byRound[d] = byRound[d] || []).push(m);
  });
  const depths = Object.keys(byRound).map(Number).sort((a, b) => a - b);

  let maxRows = 0;
  const pos = {};
  depths.forEach((d, colIdx) => {
    const arr = byRound[d].slice().sort((a, b) => (a.bracket?.cfgId || 0) - (b.bracket?.cfgId || 0));
    maxRows = Math.max(maxRows, arr.length);
    arr.forEach((m, i) => {
      pos[m.id] = { x: marginX + colIdx * (colW + colGap), y: marginTop + i * (rowH + rowGap) };
    });
  });

  const svgWidth = marginX * 2 + depths.length * colW + Math.max(0, depths.length - 1) * colGap;
  const svgHeight = marginTop + maxRows * (rowH + rowGap);
  const { containerRef, scale, fitToScreen, setFitToScreen } = useFitToScreen(svgWidth, svgHeight);

  if (depths.length === 0) return null;

  const edges = [];
  matches.forEach((m) => {
    if (m.bracket?.nextMatchId && pos[m.bracket.nextMatchId]) {
      edges.push({ from: m.id, anchor: "top", to: m.bracket.nextMatchId, toSlot: m.bracket.nextSlot, champ: byId[m.bracket.nextMatchId]?.round === "Finał" });
    }
    if (m.bracket?.loserNextMatchId && pos[m.bracket.loserNextMatchId]) {
      edges.push({ from: m.id, anchor: "bottom", to: m.bracket.loserNextMatchId, toSlot: m.bracket.loserNextSlot, champ: false });
    }
  });

  // Eksportuje aktualnie widoczny graf do pliku PNG: klonuje węzeł <svg>,
  // dopisuje wartości zmiennych CSS (var(--oak) itd. nie zadziała w
  // samodzielnym, odłączonym SVG), serializuje do obrazka i rysuje na
  // canvasie w podwójnej rozdzielczości, po czym zapisuje jako plik.
  function exportGraphPng() {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    setExporting(true);
    setExportMsg("Przygotowuję obraz…");
    try {
      const scaleFactor = 2;
      const clone = svgEl.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
      const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = ":root{--navy:#16303D;--oak:#C99A5B;--grey:#7C8B90;}";
      clone.insertBefore(style, clone.firstChild);

      const svgStr = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = svgWidth * scaleFactor;
        canvas.height = svgHeight * scaleFactor;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => {
          if (!blob) {
            setExportMsg("Nie udało się wygenerować pliku PNG.");
            setExporting(false);
            return;
          }
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "graf-systemu-brazylijskiego.png";
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
          setExportMsg("Pobrano graf jako PNG.");
          setExporting(false);
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setExportMsg("Nie udało się wygenerować pliku PNG.");
        setExporting(false);
      };
      img.src = url;
    } catch (e) {
      setExportMsg("Nie udało się wygenerować pliku PNG.");
      setExporting(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--grey)", cursor: "pointer" }}>
          <input type="checkbox" checked={fitToScreen} onChange={(e) => setFitToScreen(e.target.checked)} />
          Dopasuj graf do rozmiaru ekranu
        </label>
        <button className="vb-btn" disabled={exporting} onClick={exportGraphPng} style={{
          background: "none", border: "1px solid #C9C2B3", color: "var(--navy)", fontSize: 12, padding: "5px 10px",
          opacity: exporting ? 0.6 : 1, cursor: exporting ? "default" : "pointer",
        }}>
          ⬇ {exporting ? "Generuję…" : "Pobierz jako PNG"}
        </button>
        {exportMsg && <span style={{ fontSize: 12, color: "var(--grey)" }}>{exportMsg}</span>}
      </div>
      <div ref={containerRef} style={{ overflowX: scale < 1 ? "hidden" : "auto", paddingBottom: 12, width: "100%" }}>
        <div style={{ width: svgWidth * scale, height: svgHeight * scale }}>
          <svg ref={svgRef} width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ display: "block", transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <defs>
          <marker id="br-graf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#B7C3CE" strokeWidth="1.4" />
          </marker>
          <marker id="br-graf-arrow-oak" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#B9812E" strokeWidth="1.6" />
          </marker>
        </defs>

        {depths.map((d, colIdx) => {
          const x = marginX + colIdx * (colW + colGap);
          const isFinalCol = byRound[d].some((m) => m.round === "Finał");
          const label = isFinalCol ? "FINAŁ" : `RUNDA ${colIdx + 1}`;
          return (
            <g key={d}>
              <text x={x + colW / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={700}
                fontFamily="'IBM Plex Sans', sans-serif" letterSpacing="0.06em"
                fill={isFinalCol ? "var(--oak)" : "var(--grey)"}>
                {label}
              </text>
              <line x1={x} x2={x + colW} y1={25} y2={25} stroke={isFinalCol ? "var(--oak)" : "#DFD8C8"} strokeWidth={1} />
            </g>
          );
        })}

        <g fill="none" strokeLinecap="round">
          {edges.map((e, i) => {
            const s = pos[e.from], t = pos[e.to];
            if (!s || !t) return null;
            const sx = s.x + colW, sy = s.y + (e.anchor === "top" ? 22 : 44);
            const tx = t.x, ty = t.y + (e.toSlot === "home" ? 22 : 44);
            const dx = Math.max(28, (tx - sx) * 0.5);
            return (
              <path key={i} d={`M${sx},${sy} C${sx + dx},${sy} ${tx - dx},${ty} ${tx},${ty}`}
                stroke={e.champ ? "#B9812E" : "#B7C3CE"} strokeWidth={e.champ ? 1.8 : 1.2} strokeOpacity={e.champ ? 0.9 : 0.75}
                markerEnd={`url(#br-graf-arrow${e.champ ? "-oak" : ""})`} />
            );
          })}
        </g>

        {matches.map((m) => {
          const p = pos[m.id];
          if (!p) return null;
          const isFinal = m.round === "Finał";
          const isThird = m.round === "Mecz o 3. miejsce";
          const o = matchOutcome(m, setsToWin, pointsPerSet);
          const bo = bracketMatchOutcome(m, setsToWin, pointsPerSet);
          return (
            <g key={m.id}>
              <rect x={p.x} y={p.y} width={colW} height={rowH} rx={10}
                fill="#fff" stroke={isFinal ? "var(--oak)" : isThird ? "#B79A6B" : "#DFD8C8"}
                strokeWidth={isFinal ? 1.8 : 1} />
              <text x={p.x + 9} y={p.y + 13} fontSize={9.5} fontWeight={600} letterSpacing="0.02em"
                fontFamily="'IBM Plex Sans', sans-serif" fill={isFinal ? "var(--oak)" : "var(--grey)"}>
                {`MECZ ${m.bracket?.cfgId ?? ""}`}{isFinal ? "  •  I MIEJSCE" : isThird ? "  •  III MIEJSCE" : ""}
              </text>
              <line x1={p.x + 9} x2={p.x + colW - 9} y1={p.y + rowH / 2 + 3} y2={p.y + rowH / 2 + 3} stroke="#DFD8C8" />
              <foreignObject x={p.x} y={p.y + 15} width={colW} height={rowH - 15}>
                <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, lineHeight: "24px", padding: "0 9px", color: "var(--navy)", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6, fontWeight: bo.winner && bo.winner === m.homeId ? 700 : 400 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.homeId ? teamName(m.homeId) : "—"}</span>
                    <span style={{ color: "var(--grey)", flexShrink: 0 }}>{o.played ? o.homeSets : ""}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6, fontWeight: bo.winner && bo.winner === m.awayId ? 700 : 400 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.awayId ? teamName(m.awayId) : "—"}</span>
                    <span style={{ color: "var(--grey)", flexShrink: 0 }}>{o.played ? o.awaySets : ""}</span>
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
        </div>
      </div>
    </div>
  );
}

// Widok "Rundy" (kolumny) — korzysta z tego samego haka useFitToScreen co
// BrazylijskiGraphSVG, więc wymiary treści liczone są analitycznie (z liczby
// rund i maksymalnej liczby meczów w rundzie) zamiast duplikować pomiar DOM.
function RundyColumnsView({ rounds, matches, teamName, setsToWin, pointsPerSet, matchOutcome, bracketMatchOutcome }) {
  const colW = 190, colGap = 18, rowH = 58, rowGap = 30, titleH = 34;
  const maxRows = rounds.reduce((max, round) => Math.max(max, matches.filter((m) => m.round === round).length), 0);
  const contentWidth = rounds.length * colW + Math.max(0, rounds.length - 1) * colGap;
  const contentHeight = titleH + (maxRows > 0 ? maxRows * rowH + Math.max(0, maxRows - 1) * rowGap : 0);
  const { containerRef, scale, fitToScreen, setFitToScreen } = useFitToScreen(contentWidth, contentHeight);

  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--grey)", marginBottom: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={fitToScreen} onChange={(e) => setFitToScreen(e.target.checked)} />
        Dopasuj do rozmiaru ekranu
      </label>
      <div ref={containerRef} style={{ overflowX: scale < 1 ? "hidden" : "auto", paddingBottom: 12, width: "100%" }}>
        <div style={{ width: contentWidth * scale, height: contentHeight * scale }}>
          <div style={{ display: "flex", gap: colGap, width: contentWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            {rounds.map((round) => (
              <div key={round} style={{ width: colW, flex: "0 0 auto" }}>
                <div className="vb-display" style={{ fontSize: 15, color: "var(--oak)", marginBottom: 10, textAlign: "center" }}>
                  {round}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: rowGap, justifyContent: "center", height: "100%" }}>
                  {matches.filter((m) => m.round === round).map((m) => {
                    const o = matchOutcome(m, setsToWin, pointsPerSet);
                    const bo = bracketMatchOutcome(m, setsToWin, pointsPerSet);
                    return (
                      <div key={m.id} style={{
                        background: "#fff", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", boxShadow: "var(--shadow-sm)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: bo.winner && bo.winner === m.homeId ? 700 : 400, padding: "2px 0" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.homeId ? teamName(m.homeId) : "—"}</span>
                          <span style={{ color: "var(--grey)", flexShrink: 0 }}>{o.played ? o.homeSets : ""}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13, fontWeight: bo.winner && bo.winner === m.awayId ? 700 : 400, padding: "2px 0" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.awayId ? teamName(m.awayId) : "—"}</span>
                          <span style={{ color: "var(--grey)", flexShrink: 0 }}>{o.played ? o.awaySets : ""}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VolleyballLeagueApp() {
  const [tab, setTab] = useState("tabela");
  const [selectedRound, setSelectedRound] = useState("all");
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [venues, setVenues] = useState([]);
  const [newVenueName, setNewVenueName] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState("");
  const [newAnnouncementBody, setNewAnnouncementBody] = useState("");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);

  const [seasons, setSeasons] = useState([]);
  const [currentSeasonId, setCurrentSeasonId] = useState(null); // domyślny sezon widoczny dla kibiców
  const [selectedSeasonId, setSelectedSeasonId] = useState(null); // sezon aktualnie przeglądany/edytowany
  const [newSeasonName, setNewSeasonName] = useState("");
  const [newSeasonType, setNewSeasonType] = useState("liga");
  const [newSeasonPointsPerSet, setNewSeasonPointsPerSet] = useState(25);
  const [newSeasonSetsToWin, setNewSeasonSetsToWin] = useState(3);
  const [newSeasonBrSize, setNewSeasonBrSize] = useState(8);
  const [copySeasonSource, setCopySeasonSource] = useState("");
  const [seedOrder, setSeedOrder] = useState(null);
  const [bracketViewMode, setBracketViewMode] = useState("kolumny"); // "kolumny" | "graf" (tylko system brazylijski)
  const [bracketError, setBracketError] = useState("");
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [seasonError, setSeasonError] = useState("");
  const [confirmDeleteSeasonId, setConfirmDeleteSeasonId] = useState(null);
  const [confirmDeleteMatchId, setConfirmDeleteMatchId] = useState(null);
  const [confirmDeleteTeamId, setConfirmDeleteTeamId] = useState(null);

  const [accountsExist, setAccountsExist] = useState(null); // null=unknown
  const [unlocked, setUnlocked] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [passInput, setPassInput] = useState("");
  const [passInput2, setPassInput2] = useState("");
  const [passError, setPassError] = useState("");
  const [sessionUsername, setSessionUsername] = useState("");
  const [sessionPassword, setSessionPassword] = useState("");
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [accountsLoadError, setAccountsLoadError] = useState("");
  const [newAccUsername, setNewAccUsername] = useState("");
  const [newAccPassword, setNewAccPassword] = useState("");
  const [newAccError, setNewAccError] = useState("");
  const [confirmRemoveAcc, setConfirmRemoveAcc] = useState("");
  const [changeOwnPass, setChangeOwnPass] = useState("");
  const [changeOwnPassMsg, setChangeOwnPassMsg] = useState("");

  const [newTeamName, setNewTeamName] = useState("");
  const [teamError, setTeamError] = useState("");
  const [newMatch, setNewMatch] = useState({ round: "1", date: "", time: "", venue: "", homeId: "", awayId: "" });

  const [dateRows, setDateRows] = useState([{ id: uid(), date: "", slots: [{ id: uid(), time: "", venue: "" }] }]);
  const [roundMode, setRoundMode] = useState("single");
  const [genPreview, setGenPreview] = useState(null);
  const [genError, setGenError] = useState("");
  const [printMatchId, setPrintMatchId] = useState(null);
  const [posterOpen, setPosterOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        let seasonList = [];
        try {
          const r = await storage.get(SEASONS_KEY);
          if (r) seasonList = JSON.parse(r.value);
        } catch (e) { /* brak sezonów jeszcze */ }

        let curId = null;
        try {
          const r = await storage.get(CURRENT_SEASON_KEY);
          if (r) curId = r.value;
        } catch (e) { /* brak ustawionego domyślnego sezonu */ }

        if (seasonList.length === 0) {
          // migracja starych, niesezonowych danych (jeśli istniały) do pierwszego sezonu
          let legacyTeams = null, legacyMatches = null;
          try {
            const r = await storage.get(LEGACY_TEAMS_KEY);
            if (r) legacyTeams = JSON.parse(r.value);
          } catch (e) { /* brak */ }
          try {
            const r = await storage.get(LEGACY_MATCHES_KEY);
            if (r) legacyMatches = JSON.parse(r.value);
          } catch (e) { /* brak */ }

          const firstId = uid();
          await storage.set(teamsKey(firstId), JSON.stringify(legacyTeams || []));
          await storage.set(matchesKey(firstId), JSON.stringify(legacyMatches || []));
          await storage.set(venuesKey(firstId), JSON.stringify([{ id: uid(), name: "Hala 1" }]));
          seasonList = [{ id: firstId, name: "Sezon 1", type: "liga", createdAt: Date.now() }];
          curId = firstId;
          await storage.set(SEASONS_KEY, JSON.stringify(seasonList));
          await storage.set(CURRENT_SEASON_KEY, curId);
        } else if (!curId || !seasonList.find((s) => s.id === curId)) {
          curId = seasonList[0].id;
          await storage.set(CURRENT_SEASON_KEY, curId);
        }

        setSeasons(seasonList);
        setCurrentSeasonId(curId);
        setSelectedSeasonId(curId);

        let t = [], m = [];
        try {
          const r = await storage.get(teamsKey(curId));
          if (r) t = JSON.parse(r.value);
        } catch (e) { /* brak drużyn */ }
        try {
          const r = await storage.get(matchesKey(curId));
          if (r) m = JSON.parse(r.value);
        } catch (e) { /* brak meczów */ }
        let v = [];
        try {
          const r = await storage.get(venuesKey(curId));
          if (r) v = JSON.parse(r.value);
        } catch (e) { /* brak hal */ }
        let a = [];
        try {
          const r = await storage.get(announcementsKey(curId));
          if (r) a = JSON.parse(r.value);
        } catch (e) { /* brak ogłoszeń */ }
        setTeams(t);
        setMatches(m);
        setVenues(v);
        setAnnouncements(a);

        try {
          const exists = await adminAuth.accountsExist();
          setAccountsExist(exists);
          if (exists) {
            const saved = loadAdminSession();
            if (saved) {
              try {
                const ok = await adminAuth.login(saved.username, saved.password);
                if (ok) {
                  setSessionUsername(saved.username);
                  setSessionPassword(saved.password);
                  setUnlocked(true);
                  fetchAccounts(saved.username, saved.password);
                } else {
                  clearAdminSession();
                }
              } catch (e) {
                clearAdminSession();
              }
            }
          }
        } catch (e) {
          setAccountsExist(false);
        }
      } catch (e) {
        setStorageError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function switchSeason(id) {
    setSelectedSeasonId(id);
    let t = [], m = [], v = [];
    try {
      const r = await storage.get(teamsKey(id));
      if (r) t = JSON.parse(r.value);
    } catch (e) { /* brak drużyn */ }
    try {
      const r = await storage.get(matchesKey(id));
      if (r) m = JSON.parse(r.value);
    } catch (e) { /* brak meczów */ }
    try {
      const r = await storage.get(venuesKey(id));
      if (r) v = JSON.parse(r.value);
    } catch (e) { /* brak hal */ }
    setTeams(t);
    setMatches(m);
    setVenues(v);
    let a = [];
    try {
      const r = await storage.get(announcementsKey(id));
      if (r) a = JSON.parse(r.value);
    } catch (e) { /* brak ogłoszeń */ }
    setAnnouncements(a);
    setConfirmRegenerate(false);
    setSeedOrder(null);
  }

  async function createSeason() {
    setSeasonError("");
    const name = newSeasonName.trim();
    if (!name) { setSeasonError("Podaj nazwę sezonu, np. 2027/2028."); return; }
    try {
      const id = uid();
      let newTeams = [];
      let newVenues = [{ id: uid(), name: "Hala 1" }];
      if (copySeasonSource) {
        try {
          const r = await storage.get(teamsKey(copySeasonSource));
          if (r) newTeams = JSON.parse(r.value).map((t) => ({ id: uid(), name: t.name }));
        } catch (e) { /* brak drużyn do skopiowania */ }
        try {
          const r = await storage.get(venuesKey(copySeasonSource));
          if (r) newVenues = JSON.parse(r.value).map((v) => ({ id: uid(), name: v.name }));
        } catch (e) { /* brak hal do skopiowania */ }
      }
      await storage.set(teamsKey(id), JSON.stringify(newTeams));
      await storage.set(matchesKey(id), JSON.stringify([]));
      await storage.set(venuesKey(id), JSON.stringify(newVenues));
      await storage.set(announcementsKey(id), JSON.stringify([]));
      const nextSeasons = [...seasons, {
        id, name, type: newSeasonType, createdAt: Date.now(),
        pointsPerSet: newSeasonType === "turniej" || newSeasonType === "brazylijski" ? (Number(newSeasonPointsPerSet) || 25) : 25,
        setsToWin: newSeasonType === "turniej" || newSeasonType === "brazylijski" ? (Number(newSeasonSetsToWin) || 3) : 3,
        brSize: newSeasonType === "brazylijski" ? Number(newSeasonBrSize) || 8 : null,
      }];
      await storage.set(SEASONS_KEY, JSON.stringify(nextSeasons));
      setSeasons(nextSeasons);
      setNewSeasonName("");
      setNewSeasonType("liga");
      setNewSeasonPointsPerSet(25);
      setNewSeasonSetsToWin(3);
      setNewSeasonBrSize(8);
      setCopySeasonSource("");
      await switchSeason(id);
    } catch (e) {
      setSeasonError("Nie udało się utworzyć sezonu. Spróbuj ponownie.");
    }
  }

  async function setAsCurrentSeason(id) {
    setCurrentSeasonId(id);
    try { await storage.set(CURRENT_SEASON_KEY, id); } catch (e) { setStorageError(true); }
  }

  async function deleteSeason(id) {
    if (seasons.length <= 1) return;
    const nextSeasons = seasons.filter((s) => s.id !== id);
    setSeasons(nextSeasons);
    setConfirmDeleteSeasonId(null);
    try { await storage.set(SEASONS_KEY, JSON.stringify(nextSeasons)); } catch (e) { /* ignore */ }
    try { await storage.delete(teamsKey(id)); } catch (e) { /* ignore */ }
    try { await storage.delete(matchesKey(id)); } catch (e) { /* ignore */ }
    try { await storage.delete(venuesKey(id)); } catch (e) { /* ignore */ }
    try { await storage.delete(announcementsKey(id)); } catch (e) { /* ignore */ }
    if (id === currentSeasonId) await setAsCurrentSeason(nextSeasons[0].id);
    if (id === selectedSeasonId) await switchSeason(nextSeasons[0].id);
  }

  // Zmienia format meczu (punkty w secie / sety do wygrania) dla danego sezonu —
  // dotyczy tylko turniejów pucharowych.
  async function updateSeasonSettings(id, field, value) {
    const nextSeasons = seasons.map((s) => (s.id === id ? { ...s, [field]: value } : s));
    setSeasons(nextSeasons);
    try { await storage.set(SEASONS_KEY, JSON.stringify(nextSeasons)); } catch (e) { /* ignore */ }
  }

  const saveTeams = useCallback(async (next) => {
    setTeams(next);
    if (!selectedSeasonId) return;
    try { await storage.set(teamsKey(selectedSeasonId), JSON.stringify(next)); } catch (e) { setStorageError(true); }
  }, [selectedSeasonId]);

  const saveMatches = useCallback(async (next) => {
    setMatches(next);
    if (!selectedSeasonId) return;
    try { await storage.set(matchesKey(selectedSeasonId), JSON.stringify(next)); } catch (e) { setStorageError(true); }
  }, [selectedSeasonId]);

  const saveVenues = useCallback(async (next) => {
    setVenues(next);
    if (!selectedSeasonId) return;
    try { await storage.set(venuesKey(selectedSeasonId), JSON.stringify(next)); } catch (e) { setStorageError(true); }
  }, [selectedSeasonId]);

  const saveAnnouncements = useCallback(async (next) => {
    setAnnouncements(next);
    if (!selectedSeasonId) return;
    try { await storage.set(announcementsKey(selectedSeasonId), JSON.stringify(next)); } catch (e) { setStorageError(true); }
  }, [selectedSeasonId]);

  function addAnnouncement() {
    const title = newAnnouncementTitle.trim();
    const body = newAnnouncementBody.trim();
    if (!title && !body) return;
    const announcement = { id: uid(), title: title || "Ogłoszenie", body, createdAt: Date.now() };
    saveAnnouncements([announcement, ...announcements]);
    setNewAnnouncementTitle("");
    setNewAnnouncementBody("");
  }

  function updateAnnouncementField(id, field, value) {
    saveAnnouncements(announcements.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }

  function deleteAnnouncement(id) {
    saveAnnouncements(announcements.filter((a) => a.id !== id));
    if (editingAnnouncementId === id) setEditingAnnouncementId(null);
  }

  function addTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    if (teams.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setTeamError("Drużyna o tej nazwie już jest na liście.");
      return;
    }
    setTeamError("");
    saveTeams([...teams, { id: uid(), name }]);
    setNewTeamName("");
  }

  function deleteTeam(id) {
    saveTeams(teams.filter((t) => t.id !== id));
    saveMatches(matches.filter((m) => m.homeId !== id && m.awayId !== id));
    setConfirmDeleteTeamId(null);
  }

  function addVenue() {
    const name = newVenueName.trim();
    if (!name) return;
    if (venues.some((v) => v.name.toLowerCase() === name.toLowerCase())) { setNewVenueName(""); return; }
    saveVenues([...venues, { id: uid(), name }]);
    setNewVenueName("");
  }

  function deleteVenue(id) {
    saveVenues(venues.filter((v) => v.id !== id));
  }

  function addMatch() {
    if (!newMatch.homeId || !newMatch.awayId || newMatch.homeId === newMatch.awayId) return;
    const match = {
      id: uid(),
      round: newMatch.round || "1",
      date: newMatch.date,
      time: newMatch.time,
      venue: newMatch.venue,
      homeId: newMatch.homeId,
      awayId: newMatch.awayId,
      sets: [],
    };
    saveMatches([...matches, match]);
    setNewMatch({ round: newMatch.round, date: "", time: "", venue: "", homeId: "", awayId: "" });
  }

  function deleteMatch(id) {
    saveMatches(matches.filter((m) => m.id !== id));
    setConfirmDeleteMatchId(null);
  }

  function updateMatchField(matchId, field, value) {
    const next = matches.map((m) => (m.id === matchId ? { ...m, [field]: value } : m));
    saveMatches(next);
  }

  function updateSet(matchId, setIndex, side, value) {
    const clean = value === "" ? "" : value.replace(/[^0-9]/g, "");
    let next = matches.map((m) => {
      if (m.id !== matchId) return m;
      const sets = [...(m.sets || [])];
      while (sets.length <= setIndex) sets.push({ home: "", away: "" });
      sets[setIndex] = { ...sets[setIndex], [side]: clean };
      return { ...m, sets };
    });
    if (next.some((m) => m.bracket)) next = advanceBracket(next, currentSeasonObj?.setsToWin || 3, currentSeasonObj?.pointsPerSet || 25);
    saveMatches(next);
  }

  function moveSeed(index, dir) {
    const current = seedOrder && seedOrder.length === teams.length ? seedOrder : teams.map((t) => t.id);
    const next = [...current];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSeedOrder(next);
  }

  function handleGenerateBracket() {
    setBracketError("");
    const order = seedOrder && seedOrder.length === teams.length ? seedOrder : teams.map((t) => t.id);
    if (order.length < 2) { setBracketError("Potrzebujesz co najmniej 2 drużyn."); return; }
    saveMatches(advanceBracket(generateBracketMatches(order), currentSeasonObj?.setsToWin || 3, currentSeasonObj?.pointsPerSet || 25));
    setConfirmRegenerate(false);
  }

  function handleGenerateBrazylijski() {
    setBracketError("");
    const size = currentSeasonObj?.brSize;
    if (!size || !BRAZYLIJSKI_CONFIGS[size]) { setBracketError("Nieprawidłowy rozmiar systemu brazylijskiego."); return; }
    const order = seedOrder && seedOrder.length === teams.length ? seedOrder : teams.map((t) => t.id);
    if (order.length !== size) {
      setBracketError(`System brazylijski na ${size} drużyn wymaga dokładnie ${size} drużyn (masz ${order.length}).`);
      return;
    }
    saveMatches(advanceBracket(generateBrazylijskiMatches(order, size), currentSeasonObj?.setsToWin || 3, currentSeasonObj?.pointsPerSet || 25));
    setConfirmRegenerate(false);
  }

  function addDateRow() {
    setDateRows([...dateRows, { id: uid(), date: "", slots: [{ id: uid(), time: "", venue: venues[0]?.name || "" }] }]);
  }

  function duplicateDateRow(rowId) {
    setDateRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      if (idx === -1) return prev;
      const original = prev[idx];
      const copy = {
        id: uid(),
        date: "",
        slots: original.slots.map((s) => ({ id: uid(), time: s.time, venue: s.venue })),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function removeDateRow(id) {
    setDateRows(dateRows.filter((r) => r.id !== id));
  }

  function updateDateRowDate(id, value) {
    setDateRows(dateRows.map((r) => (r.id === id ? { ...r, date: value } : r)));
  }

  function addSlot(rowId) {
    setDateRows(dateRows.map((r) => (r.id === rowId ? { ...r, slots: [...r.slots, { id: uid(), time: "", venue: venues[0]?.name || "" }] } : r)));
  }

  function removeSlot(rowId, slotId) {
    setDateRows(dateRows.map((r) => (r.id === rowId ? { ...r, slots: r.slots.filter((s) => s.id !== slotId) } : r)));
  }

  function updateSlot(rowId, slotId, field, value) {
    setDateRows(dateRows.map((r) => (
      r.id === rowId ? { ...r, slots: r.slots.map((s) => (s.id === slotId ? { ...s, [field]: value } : s)) } : r
    )));
  }

  function handlePreviewGenerate() {
    setGenError("");
    setGenPreview(null);
    const teamIds = teams.map((t) => t.id);
    if (teamIds.length < 2) { setGenError("Potrzebujesz co najmniej 2 drużyn."); return; }
    if (venues.length === 0) { setGenError("Najpierw zdefiniuj przynajmniej jedną halę w sekcji „Hale”."); return; }
    const validRows = dateRows.filter((d) => d.date.trim() !== "" && d.slots.length > 0);
    if (validRows.length === 0) { setGenError("Dodaj co najmniej jeden termin z przynajmniej jednym slotem meczowym."); return; }
    const defaultVenueName = venues[0]?.name || "";
    const rounds = generateRoundRobin(teamIds, roundMode === "double");
    const totalMatches = rounds.reduce((s, r) => s + r.length, 0);
    const rowsForAssign = validRows.map((r) => ({ date: r.date.trim(), slots: r.slots.map((s) => ({ time: s.time, venue: s.venue || defaultVenueName })) }));
    const { scheduled, unscheduled } = assignToDates(rounds, rowsForAssign);
    const conflictCount = Object.keys(findVenueConflicts(scheduled.map((m, i) => ({ ...m, id: String(i) })))).length;
    // Przy N drużynach da się rozegrać jednocześnie maksymalnie floor(N/2) meczów (przy nieparzystej
    // liczbie drużyn jedna zawsze pauzuje) — jeśli w którymś dniu zdefiniowano więcej slotów niż to,
    // część z nich NIGDY się nie zapełni, niezależnie od liczby dodanych terminów.
    const maxPerDay = Math.floor(teamIds.length / 2);
    const oversizedDaysCount = validRows.filter((r) => r.slots.length > maxPerDay).length;
    setGenPreview({ scheduled, unscheduledCount: unscheduled, totalMatches, roundsCount: validRows.length, conflictCount, maxPerDay, oversizedDaysCount });
  }

  function handleConfirmGenerate() {
    if (!genPreview) return;
    const generated = genPreview.scheduled.map((m) => ({
      id: uid(), round: String(m.round), date: m.date, time: m.time, venue: m.venue, homeId: m.home, awayId: m.away, sets: [],
    }));
    saveMatches(generated);
    setGenPreview(null);
  }

  async function handleBootstrapAccount() {
    setPassError("");
    if (loginUsername.trim().length < 2) { setPassError("Login musi mieć min. 2 znaki."); return; }
    if (passInput.length < 4) { setPassError("Hasło musi mieć min. 4 znaki."); return; }
    if (passInput !== passInput2) { setPassError("Hasła nie są identyczne."); return; }
    try {
      await adminAuth.bootstrapAccount(loginUsername.trim(), passInput);
      setAccountsExist(true);
      setSessionUsername(loginUsername.trim());
      setSessionPassword(passInput);
      setUnlocked(true);
      saveAdminSession(loginUsername.trim(), passInput);
      fetchAccounts(loginUsername.trim(), passInput);
      setLoginUsername(""); setPassInput(""); setPassInput2("");
    } catch (e) {
      setPassError("Nie udało się utworzyć konta. Spróbuj ponownie.");
    }
  }

  async function handleLogin() {
    setPassError("");
    if (!loginUsername.trim() || !passInput) { setPassError("Podaj login i hasło."); return; }
    try {
      const ok = await adminAuth.login(loginUsername.trim(), passInput);
      if (ok) {
        setSessionUsername(loginUsername.trim());
        setSessionPassword(passInput);
        setUnlocked(true);
        saveAdminSession(loginUsername.trim(), passInput);
        fetchAccounts(loginUsername.trim(), passInput);
        setLoginUsername(""); setPassInput("");
      } else {
        setPassError("Błędny login lub hasło.");
      }
    } catch (e) {
      setPassError("Nie udało się sprawdzić danych logowania.");
    }
  }

  async function fetchAccounts(u, p) {
    setAccountsLoadError("");
    try {
      const list = await adminAuth.listAccounts(u, p);
      setAdminAccounts(list);
    } catch (e) {
      setAccountsLoadError("Nie udało się pobrać listy kont.");
    }
  }

  async function loadAdminAccounts() {
    await fetchAccounts(sessionUsername, sessionPassword);
  }

  async function handleAddAccount() {
    setNewAccError("");
    if (newAccUsername.trim().length < 2) { setNewAccError("Login musi mieć min. 2 znaki."); return; }
    if (newAccPassword.length < 4) { setNewAccError("Hasło musi mieć min. 4 znaki."); return; }
    try {
      await adminAuth.addAccount(sessionUsername, sessionPassword, newAccUsername.trim(), newAccPassword);
      setNewAccUsername(""); setNewAccPassword("");
      await fetchAccounts(sessionUsername, sessionPassword);
    } catch (e) {
      const msg = String(e?.message || "");
      if (msg.includes("username_taken")) setNewAccError("Ten login jest już zajęty.");
      else setNewAccError("Nie udało się dodać konta.");
    }
  }

  async function handleRemoveAccount(username) {
    try {
      await adminAuth.removeAccount(sessionUsername, sessionPassword, username);
      setConfirmRemoveAcc("");
      await fetchAccounts(sessionUsername, sessionPassword);
    } catch (e) {
      setAccountsLoadError("Nie udało się usunąć konta (może to ostatnie pozostałe?).");
    }
  }

  async function handleChangeOwnPassword() {
    setChangeOwnPassMsg("");
    if (changeOwnPass.length < 4) { setChangeOwnPassMsg("Hasło musi mieć min. 4 znaki."); return; }
    try {
      await adminAuth.changePassword(sessionUsername, sessionPassword, changeOwnPass);
      setSessionPassword(changeOwnPass);
      saveAdminSession(sessionUsername, changeOwnPass);
      setChangeOwnPass("");
      setChangeOwnPassMsg("Hasło zmienione.");
    } catch (e) {
      setChangeOwnPassMsg("Nie udało się zmienić hasła.");
    }
  }

  function handleLogout() {
    setUnlocked(false);
    setSessionUsername("");
    setSessionPassword("");
    setAdminAccounts([]);
    clearAdminSession();
  }

  const teamName = (id) => teams.find((t) => t.id === id)?.name || "?";
  const currentSeasonObj = seasons.find((s) => s.id === selectedSeasonId) || null;
  const isTournament = currentSeasonObj?.type === "turniej";
  const isBrazylijski = currentSeasonObj?.type === "brazylijski";
  const standings = computeStandings(teams, matches);
  const venueConflicts = findVenueConflicts(matches);
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => {
    if (isTournament) return 0; // kolejność drabinki = kolejność generowania rund
    if (isBrazylijski) {
      const rank = (r) => {
        if (r === "Finał") return 9999;
        if (r === "Mecz o 3. miejsce") return 9998;
        return matches.find((x) => x.round === r)?.bracket?.roundIndex ?? 0;
      };
      return rank(a) - rank(b);
    }
    return Number(a) - Number(b);
  });
  const activeRound = rounds.find((r) => matches.some((m) => m.round === r && !matchOutcome(m, currentSeasonObj?.setsToWin || 3, currentSeasonObj?.pointsPerSet || 25).played));

  if (loading) {
    return (
      <div className="vb-root" style={{ background: "var(--navy)", minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{FONT_STYLE}</style>
        <div style={{ color: "var(--chalk)", fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: "0.05em" }}>WCZYTYWANIE...</div>
      </div>
    );
  }

  const currentSeasonName = seasons.find((s) => s.id === selectedSeasonId)?.name || "";
  const matchToPrint = matches.find((m) => m.id === printMatchId) || null;

  return (
    <div className="vb-root" style={{ background: "var(--chalk)", minHeight: 500 }}>
      <style>{FONT_STYLE}</style>

      <div id="vb-app-content">
      {/* Header */}
      <div className="vb-header">
        <div className="vb-header-top">
          <img src={LOGO_DATA_URI} alt="Towarzystwo Sportowe w Wągrowcu" className="vb-logo" />
          <span className="vb-display vb-title">LIGA SIATKÓWKI</span>
          {seasons.length > 0 ? (
            <select
              value={selectedSeasonId || ""}
              onChange={(e) => switchSeason(e.target.value)}
              style={{
                background: "var(--navy-2)", color: "var(--chalk)", border: "1px solid #2C4C5E", borderRadius: 8,
                padding: "5px 10px", fontSize: 13, fontFamily: "'IBM Plex Sans', sans-serif", cursor: "pointer",
                maxWidth: "100%", marginLeft: "auto",
              }}
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.id === currentSeasonId ? " (aktualny)" : ""}</option>
              ))}
            </select>
          ) : (
            <span style={{ color: "var(--grey)", fontSize: 13 }}>sezon lokalny</span>
          )}
          {selectedSeasonId && selectedSeasonId !== currentSeasonId && (
            <span style={{ fontSize: 11, color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: 6, padding: "2px 6px" }}>
              Archiwum
            </span>
          )}
        </div>
        <div className="vb-tabs">
          {[
            { id: "tabela", label: "Tabela", icon: Trophy },
            { id: "terminarz", label: "Terminarz", icon: CalendarDays },
            { id: "ogloszenia", label: "Ogłoszenia", icon: Megaphone },
            { id: "admin", label: "Admin", icon: Lock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`vb-tab vb-tab-btn ${tab === id ? "active" : ""}`}
              style={{ color: tab === id ? "var(--navy-3)" : "var(--chalk)" }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="vb-content" style={tab === "tabela" && (isTournament || isBrazylijski) ? { maxWidth: "min(1600px, 97vw)" } : undefined}>
        {storageError && (
          <div style={{ background: "#F6E4DE", color: "var(--rust)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            Wystąpił problem z zapisem danych. Spróbuj odświeżyć stronę.
          </div>
        )}

        {tab === "tabela" && (isTournament || isBrazylijski) && (
          <div>
            {matches.length === 0 ? (
              <EmptyState icon={Trophy} text="Brak wygenerowanej drabinki. Wygeneruj ją w panelu Admin." />
            ) : (
              <>
                {isBrazylijski && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <button className="vb-btn" onClick={() => setBracketViewMode("kolumny")} style={{
                      background: bracketViewMode === "kolumny" ? "var(--navy)" : "#fff",
                      color: bracketViewMode === "kolumny" ? "#fff" : "var(--navy)",
                      border: "1px solid var(--navy)", fontSize: 13,
                    }}>
                      Rundy
                    </button>
                    <button className="vb-btn" onClick={() => setBracketViewMode("graf")} style={{
                      background: bracketViewMode === "graf" ? "var(--navy)" : "#fff",
                      color: bracketViewMode === "graf" ? "#fff" : "var(--navy)",
                      border: "1px solid var(--navy)", fontSize: 13,
                    }}>
                      Graf systemu
                    </button>
                  </div>
                )}
                {isBrazylijski && bracketViewMode === "graf" ? (
                  <BrazylijskiGraphSVG matches={matches} teamName={teamName} setsToWin={currentSeasonObj?.setsToWin || 3} pointsPerSet={currentSeasonObj?.pointsPerSet || 25} />
                ) : (
                <RundyColumnsView
                  rounds={rounds}
                  matches={matches}
                  teamName={teamName}
                  setsToWin={currentSeasonObj?.setsToWin || 3}
                  pointsPerSet={currentSeasonObj?.pointsPerSet || 25}
                  matchOutcome={matchOutcome}
                  bracketMatchOutcome={bracketMatchOutcome}
                />
                )}
                {(() => {
                  const finalMatch = matches.find((m) => m.round === "Finał");
                  const bronzeMatch = matches.find((m) => m.round === "Mecz o 3. miejsce");
                  const finalOutcome = finalMatch ? bracketMatchOutcome(finalMatch, currentSeasonObj?.setsToWin || 3, currentSeasonObj?.pointsPerSet || 25) : null;
                  const bronzeOutcome = bronzeMatch ? bracketMatchOutcome(bronzeMatch, currentSeasonObj?.setsToWin || 3, currentSeasonObj?.pointsPerSet || 25) : null;
                  if (!finalOutcome?.played) return null;
                  return (
                    <div style={{ marginTop: 22, textAlign: "center" }}>
                      <div className="vb-display" style={{ fontSize: 22, color: "var(--navy)" }}>
                        🏆 Mistrz turnieju: {teamName(finalOutcome.winner)}
                      </div>
                      {bronzeOutcome?.played && (
                        <div style={{ fontSize: 13, color: "var(--grey)", marginTop: 4 }}>
                          III miejsce: {teamName(bronzeOutcome.winner)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {tab === "tabela" && !isTournament && !isBrazylijski && (
          <div>
            {standings.length === 0 ? (
              <EmptyState icon={Trophy} text="Brak drużyn. Dodaj drużyny w panelu Admin, żeby zobaczyć tabelę." />
            ) : (
              <div className="vb-standings-wrap">
                <table className="vb-standings-table">
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--navy)" }}>
                      {["#", "Drużyna", "M", "W", "P", "Sety", "Punkty", "Pkt lig."].map((h, i) => (
                        <th key={h} style={{
                          textAlign: i === 1 ? "left" : "center",
                          padding: "8px 10px",
                          fontSize: 12,
                          color: "var(--grey)",
                          fontWeight: 600,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, idx) => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #DFD8C8", background: idx % 2 === 1 ? "#EAE5D9" : "transparent" }}>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <span className="vb-display" style={{ fontSize: 20, color: "var(--oak)" }}>{idx + 1}</span>
                        </td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{row.name}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>{row.mp}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>{row.w}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>{row.l}</td>
                        <td style={{ padding: "10px", textAlign: "center", color: "var(--grey)" }}>{row.setsW}:{row.setsL}</td>
                        <td style={{ padding: "10px", textAlign: "center", color: "var(--grey)" }}>{row.ptsW}:{row.ptsL}</td>
                        <td style={{ padding: "10px", textAlign: "center" }}>
                          <span className="vb-display" style={{ fontSize: 20, color: "var(--navy)" }}>{row.pts}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "terminarz" && (
          <div>
            {matches.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--grey)" }}>{(isTournament || isBrazylijski) ? "Runda" : "Kolejka"}</span>
                  <select
                    className="vb-input"
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(e.target.value)}
                    style={{ padding: "6px 10px" }}
                  >
                    <option value="all">Wszystkie</option>
                    {rounds.map((r) => (
                      <option key={r} value={r}>{(isTournament || isBrazylijski) ? r : `Kolejka ${r}`}{r === activeRound ? " (bieżąca)" : ""}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setPosterOpen(true)} className="vb-btn" style={{
                  background: "var(--navy)", color: "var(--chalk)", display: "flex", alignItems: "center", gap: 6, fontSize: 13,
                }}>
                  <Printer size={14} /> Plakat terminarza
                </button>
              </div>
            )}
            {matches.length === 0 ? (
              <EmptyState icon={CalendarDays} text="Brak zaplanowanych meczów. Dodaj mecze w panelu Admin." />
            ) : (
              rounds
                .filter((round) => selectedRound === "all" || round === selectedRound)
                .map((round) => (
                <div key={round} style={{ marginBottom: 22 }}>
                  <div className="vb-display" style={{ fontSize: 18, color: "var(--oak)", marginBottom: 8 }}>
                    {(isTournament || isBrazylijski) ? round : `KOLEJKA ${round}`}
                  </div>
                  {matches
                    .filter((m) => m.round === round)
                    .slice()
                    .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.venue || "").localeCompare(b.venue || "") || (a.time || "").localeCompare(b.time || ""))
                    .map((m) => {
                    const o = matchOutcome(m, currentSeasonObj?.setsToWin || 3, currentSeasonObj?.pointsPerSet || 25);
                    return (
                      <div key={m.id} className="vb-match-card">
                        <div className="vb-match-info">
                          <span className="vb-match-date">
                            {m.date ? formatDate(m.date) : ""}{m.time ? ` · ${m.time}` : ""}{m.venue ? ` · ${m.venue}` : ""}
                          </span>
                          <span className="vb-match-teams">
                            <span style={{ fontWeight: o.winner === "home" ? 700 : 400 }}>{m.homeId ? teamName(m.homeId) : "Wolny los / TBA"}</span>
                            <span style={{ color: "var(--grey)" }}>vs</span>
                            <span style={{ fontWeight: o.winner === "away" ? 700 : 400 }}>{m.awayId ? teamName(m.awayId) : "Wolny los / TBA"}</span>
                          </span>
                        </div>
                        <div className="vb-match-actions">
                          {o.played ? (
                            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                              <span className="vb-display" style={{ fontSize: 20, color: "var(--navy)" }}>
                                {o.homeSets} : {o.awaySets}
                              </span>
                              {(m.sets || []).some((s) => s.home !== "" && s.away !== "") && (
                                <span style={{ fontSize: 11, color: "var(--grey)", whiteSpace: "nowrap" }}>
                                  {(m.sets || [])
                                    .filter((s) => s.home !== "" && s.away !== "")
                                    .map((s) => `${s.home}:${s.away}`)
                                    .join(", ")}
                                </span>
                              )}
                            </span>
                          ) : (o.homeSets > 0 || o.awaySets > 0) ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                                <span className="vb-display" style={{ fontSize: 20, color: "var(--navy)" }}>
                                  {o.homeSets} : {o.awaySets}
                                </span>
                                {(m.sets || []).some((s) => s.home !== "" && s.away !== "") && (
                                  <span style={{ fontSize: 11, color: "var(--grey)", whiteSpace: "nowrap" }}>
                                    {(m.sets || [])
                                      .filter((s) => s.home !== "" && s.away !== "")
                                      .map((s) => `${s.home}:${s.away}`)
                                      .join(", ")}
                                  </span>
                                )}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--grey)", fontStyle: "italic" }}>w trakcie</span>
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--grey)", fontStyle: "italic" }}>do rozegrania</span>
                          )}
                          <button onClick={() => setPrintMatchId(m.id)} title="Drukuj protokół meczowy" style={{ background: "none", border: "1px solid #C9C2B3", borderRadius: 8, cursor: "pointer", color: "var(--navy)", display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 7px" }}>
                            <Printer size={13} /> Protokół
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "ogloszenia" && (
          <div>
            {announcements.length === 0 ? (
              <EmptyState icon={Megaphone} text="Brak ogłoszeń. Dodaj ogłoszenie w panelu Admin." />
            ) : (
              announcements
                .slice()
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .map((a) => (
                  <div key={a.id} style={{
                    background: "#fff", border: "1px solid var(--line)", borderLeft: "3px solid var(--oak)",
                    borderRadius: "var(--radius-sm)", padding: "14px 16px", marginBottom: 10, boxShadow: "var(--shadow-sm)",
                  }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: "var(--grey)", whiteSpace: "nowrap" }}>{formatDateTime(a.createdAt)}</div>
                    </div>
                    {a.body && (
                      <div style={{ fontSize: 14, color: "var(--navy)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.body}</div>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {tab === "admin" && !unlocked && (
          <div style={{
            maxWidth: 340, margin: "48px auto", textAlign: "center",
            background: "#fff", border: "1px solid var(--line)", borderRadius: "var(--radius)",
            boxShadow: "var(--shadow-md)", padding: "28px 26px",
          }}>
            {accountsExist === false ? (
              <>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", background: "var(--chalk-2)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px auto",
                }}>
                  <KeyRound size={24} color="var(--oak)" />
                </div>
                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>Utwórz pierwsze konto administratora</div>
                <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 16 }}>Będzie potrzebne do zarządzania drużynami i wynikami. Kolejne osoby dodasz później w panelu.</div>
                <input type="text" autoComplete="username" className="vb-input" placeholder="Login" value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
                <input type="password" autoComplete="new-password" className="vb-input" placeholder="Nowe hasło" value={passInput}
                  onChange={(e) => setPassInput(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
                <input type="password" autoComplete="new-password" className="vb-input" placeholder="Powtórz hasło" value={passInput2}
                  onChange={(e) => setPassInput2(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
                {passError && <div style={{ color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>{passError}</div>}
                <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", width: "100%" }} onClick={handleBootstrapAccount}>
                  Utwórz konto i wejdź
                </button>
              </>
            ) : (
              <>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", background: "var(--chalk-2)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px auto",
                }}>
                  <Lock size={24} color="var(--oak)" />
                </div>
                <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Panel administratora</div>
                <input type="text" autoComplete="username" className="vb-input" placeholder="Login" value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%", marginBottom: 8 }} />
                <input type="password" autoComplete="current-password" className="vb-input" placeholder="Hasło" value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{ width: "100%", marginBottom: 10 }} />
                {passError && <div style={{ color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>{passError}</div>}
                <button className="vb-btn" style={{ background: "var(--navy)", color: "#fff", width: "100%" }} onClick={handleLogin}>
                  Wejdź
                </button>
              </>
            )}
          </div>
        )}

        {tab === "admin" && unlocked && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--oak)", marginBottom: 20, fontSize: 13 }}>
              <ShieldCheck size={16} /> Zalogowano jako administrator
            </div>

            {/* Season management */}
            <Section title="Sezony" defaultOpen>
              <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 12 }}>
                Każdy sezon ma osobne drużyny, hale i terminarz. „Aktualny” to sezon, który domyślnie widzą odwiedzający stronę — pozostałe zostają zarchiwizowane, ale możesz je przeglądać i edytować w dowolnej chwili z listy powyżej (przy logo).
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {seasons.map((s) => (
                  <div key={s.id} style={{
                    display: "flex", flexDirection: "column", gap: 6,
                    background: s.id === selectedSeasonId ? "#EAE5D9" : "#fff",
                    border: "1px solid #DFD8C8", borderRadius: 8, padding: "8px 10px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 100 }}>
                      {s.name}
                      <span style={{ fontWeight: 400, color: "var(--grey)", fontSize: 11 }}>
                        {" · "}{s.type === "turniej" ? "Turniej jednodniowy" : s.type === "brazylijski" ? `System brazylijski (${s.brSize || "?"} dr.)` : "Liga"}
                      </span>
                    </span>
                    {s.id === currentSeasonId && (
                      <span style={{ fontSize: 11, color: "var(--oak)", border: "1px solid var(--oak)", borderRadius: 6, padding: "2px 6px" }}>Aktualny</span>
                    )}
                    {s.id === selectedSeasonId && (
                      <span style={{ fontSize: 11, color: "var(--navy)", border: "1px solid var(--navy)", borderRadius: 6, padding: "2px 6px" }}>Przeglądasz</span>
                    )}
                    {s.id !== selectedSeasonId && (
                      <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)", fontSize: 12, padding: "4px 8px" }} onClick={() => switchSeason(s.id)}>
                        Przeglądaj / edytuj
                      </button>
                    )}
                    {s.id !== currentSeasonId && (
                      <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)", fontSize: 12, padding: "4px 8px" }} onClick={() => setAsCurrentSeason(s.id)}>
                        Ustaw jako aktualny
                      </button>
                    )}
                    {seasons.length > 1 && (
                      confirmDeleteSeasonId === s.id ? (
                        <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                          <span style={{ color: "var(--rust)" }}>Na pewno usunąć?</span>
                          <button className="vb-btn" style={{ background: "var(--rust)", color: "#fff", fontSize: 12, padding: "4px 8px" }} onClick={() => deleteSeason(s.id)}>
                            Tak, usuń
                          </button>
                          <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)", fontSize: 12, padding: "4px 8px" }} onClick={() => setConfirmDeleteSeasonId(null)}>
                            Anuluj
                          </button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDeleteSeasonId(s.id)} title="Usuń sezon" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                          <Trash2 size={14} />
                        </button>
                      )
                    )}
                    </div>
                    {(s.type === "turniej" || s.type === "brazylijski") && (
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", paddingTop: 4, borderTop: "1px dashed #DFD8C8" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--grey)" }}>
                          Punkty w secie
                          <input className="vb-input" type="number" min={1} style={{ width: 56, padding: "3px 6px" }}
                            value={s.pointsPerSet ?? 25}
                            onChange={(e) => updateSeasonSettings(s.id, "pointsPerSet", Number(e.target.value.replace(/[^0-9]/g, "")) || 25)} />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--grey)" }}>
                          Format meczu
                          <select className="vb-input" style={{ padding: "3px 6px" }} value={s.setsToWin ?? 3}
                            onChange={(e) => updateSeasonSettings(s.id, "setsToWin", Number(e.target.value))}>
                            <option value={1}>1 set</option>
                            <option value={2}>Best of 3</option>
                            <option value={3}>Best of 5</option>
                          </select>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #DFD8C8", paddingTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Nowy sezon</div>
                <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input type="radio" checked={newSeasonType === "liga"} onChange={() => setNewSeasonType("liga")} />
                    Liga (każdy z każdym)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input type="radio" checked={newSeasonType === "turniej"} onChange={() => setNewSeasonType("turniej")} />
                    Turniej jednodniowy (drabinka pucharowa)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input type="radio" checked={newSeasonType === "brazylijski"} onChange={() => setNewSeasonType("brazylijski")} />
                    System brazylijski (drabinka klubowa z miejscówkami)
                  </label>
                </div>
                {newSeasonType === "brazylijski" && (
                  <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      Liczba drużyn
                      <select className="vb-input" style={{ padding: "5px 8px" }} value={newSeasonBrSize}
                        onChange={(e) => setNewSeasonBrSize(e.target.value)}>
                        <option value={8}>8 drużyn</option>
                        <option value={12}>12 drużyn</option>
                        <option value={16}>16 drużyn</option>
                        <option value={24}>24 drużyny</option>
                      </select>
                    </label>
                  </div>
                )}
                {(newSeasonType === "turniej" || newSeasonType === "brazylijski") && (
                  <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      Punkty w secie
                      <input className="vb-input" type="number" min={1} style={{ width: 64, padding: "5px 8px" }}
                        value={newSeasonPointsPerSet}
                        onChange={(e) => setNewSeasonPointsPerSet(e.target.value.replace(/[^0-9]/g, ""))} />
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                      Format meczu
                      <select className="vb-input" style={{ padding: "5px 8px" }} value={newSeasonSetsToWin}
                        onChange={(e) => setNewSeasonSetsToWin(e.target.value)}>
                        <option value={1}>1 set (mecz do 1 wygranego seta)</option>
                        <option value={2}>Do 2 wygranych setów (best of 3)</option>
                        <option value={3}>Do 3 wygranych setów (best of 5)</option>
                      </select>
                    </label>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <input className="vb-input" placeholder="Nazwa sezonu, np. 2027/2028" value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createSeason()}
                    style={{ flex: 1, minWidth: 160 }} />
                  <select className="vb-input" value={copySeasonSource} onChange={(e) => setCopySeasonSource(e.target.value)}>
                    <option value="">Bez kopiowania drużyn/hal</option>
                    {seasons.map((s) => <option key={s.id} value={s.id}>Kopiuj z: {s.name}</option>)}
                  </select>
                  <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 4 }} onClick={createSeason}>
                    <Plus size={15} /> Utwórz sezon
                  </button>
                </div>
                {seasonError && <div style={{ color: "var(--rust)", fontSize: 13, marginTop: 8 }}>{seasonError}</div>}
              </div>
            </Section>

            {/* Match results */}
            <Section title="Terminarz i wyniki (edytuj w razie zmian)" defaultOpen>
              <div style={{ fontSize: 12, color: "var(--grey)", marginBottom: 10 }}>
                Możesz przełożyć mecz na inny termin, zamienić kolejkę albo zamienić drużyny — zmiany zapisują się od razu.
              </div>
              {(isTournament || isBrazylijski) && (
                <div style={{ fontSize: 12, color: "var(--navy)", background: "#F5F0E4", border: "1px solid #E2DBC9", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>
                  Format meczów: sety do {currentSeasonObj?.pointsPerSet || 25} pkt, mecz do {currentSeasonObj?.setsToWin || 3} wygranych {(currentSeasonObj?.setsToWin || 3) === 1 ? "seta" : "setów"} — zmienisz go w sekcji „Sezony” powyżej.
                </div>
              )}
              {Object.keys(venueConflicts).length > 0 && (
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start", background: "#F6E4DE", color: "var(--rust)", fontSize: 13, padding: "8px 12px", borderRadius: 8, marginBottom: 10 }}>
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  Wykryto kolizje terminów — dwa mecze oznaczone poniżej są zaplanowane na tę samą halę, ten sam dzień i tę samą godzinę. Popraw datę, godzinę lub halę jednego z nich.
                </div>
              )}
              {matches.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--grey)" }}>Brak meczów.</div>
              ) : (
                rounds.map((round) => (
                  <Section key={round} title={(isTournament || isBrazylijski) ? round : `Kolejka ${round}`} defaultOpen={round === activeRound} compact>
                    {matches
                      .filter((m) => m.round === round)
                      .slice()
                      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.venue || "").localeCompare(b.venue || "") || (a.time || "").localeCompare(b.time || ""))
                      .map((m) => {
                    const setsToWin = currentSeasonObj?.setsToWin || 3;
                    const pointsPerSet = currentSeasonObj?.pointsPerSet || 25;
                    const maxSets = setsToWin * 2 - 1;
                    const o = matchOutcome(m, setsToWin, pointsPerSet);
                    const hasConflict = Boolean(venueConflicts[m.id]);
                    const sets = [...(m.sets || [])];
                    while (sets.length < maxSets) sets.push({ home: "", away: "" });
                    return (
                      <div key={m.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                        background: "#fff", border: hasConflict ? "1px solid var(--rust)" : "1px solid #DFD8C8", borderRadius: 8, padding: "10px 14px", marginBottom: 8,
                      }}>
                        <div style={{ minWidth: "min(260px, 100%)", flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 6 }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            {(isTournament || isBrazylijski) ? (
                              <span style={{ fontSize: 11, color: "var(--grey)" }}>{m.round}</span>
                            ) : (
                              <>
                                <span style={{ fontSize: 11, color: "var(--grey)" }}>Kolejka</span>
                                <input className="vb-input" style={{ width: 46, padding: "3px 6px" }} value={m.round}
                                  onChange={(e) => updateMatchField(m.id, "round", e.target.value.replace(/[^0-9]/g, ""))} />
                              </>
                            )}
                            <input className="vb-input" style={{ width: 140, padding: "3px 6px", borderColor: hasConflict ? "var(--rust)" : undefined }} type="date" value={m.date || ""}
                              onChange={(e) => updateMatchField(m.id, "date", e.target.value)} />
                            <input className="vb-input" style={{ width: 90, padding: "3px 6px", borderColor: hasConflict ? "var(--rust)" : undefined }} type="time" value={m.time || ""}
                              onChange={(e) => updateMatchField(m.id, "time", e.target.value)} />
                            <select className="vb-input" style={{ width: 110, padding: "3px 6px", borderColor: hasConflict ? "var(--rust)" : undefined }} value={m.venue || ""}
                              onChange={(e) => updateMatchField(m.id, "venue", e.target.value)}>
                              <option value="">Hala</option>
                              {venues.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                              {m.venue && !venues.some((v) => v.name === m.venue) && (
                                <option value={m.venue}>{m.venue} (usunięta)</option>
                              )}
                            </select>
                          </div>
                          {(isTournament || isBrazylijski) ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{m.homeId ? teamName(m.homeId) : "Wolny los / TBA"}</span>
                              <span style={{ color: "var(--grey)", fontSize: 12 }}>vs</span>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{m.awayId ? teamName(m.awayId) : "Wolny los / TBA"}</span>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <select className="vb-input" style={{ padding: "3px 6px", maxWidth: 110 }} value={m.homeId}
                                onChange={(e) => updateMatchField(m.id, "homeId", e.target.value)}>
                                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                              <span style={{ color: "var(--grey)", fontSize: 12 }}>vs</span>
                              <select className="vb-input" style={{ padding: "3px 6px", maxWidth: 110 }} value={m.awayId}
                                onChange={(e) => updateMatchField(m.id, "awayId", e.target.value)}>
                                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            </div>
                          )}
                          {!isTournament && !isBrazylijski && m.homeId === m.awayId && (
                            <div style={{ fontSize: 11, color: "var(--rust)" }}>Wybierz dwie różne drużyny.</div>
                          )}
                          {hasConflict && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--rust)" }}>
                              <AlertTriangle size={12} /> Kolizja: ta sama hala i godzina co inny mecz tego dnia.
                            </div>
                          )}
                        </div>
                        {(isTournament || isBrazylijski) && (!m.homeId || !m.awayId) ? (
                          <div style={{ fontSize: 12, color: "var(--grey)", fontStyle: "italic", minWidth: 140 }}>
                            {isBrazylijski
                              ? "Oczekuje na wynik poprzedniego meczu"
                              : (!m.homeId && !m.awayId ? "Oczekuje na wyniki poprzedniej rundy" : "Wolny los — awans automatyczny")}
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, maxWidth: "100%" }}>
                            <div className="vb-sets-row" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", rowGap: 6 }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4, maxWidth: 96, flexShrink: 0 }}>
                                <span style={{ display: "block", fontSize: 11, color: "var(--navy)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={teamName(m.homeId)}>
                                  {teamName(m.homeId)}
                                </span>
                                <span style={{ display: "block", fontSize: 11, color: "var(--navy)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={teamName(m.awayId)}>
                                  {teamName(m.awayId)}
                                </span>
                              </div>
                              {sets.map((s, i) => {
                                const invalid = setInvalid(s, pointsPerSet, i === maxSets - 1);
                                return (
                                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                                    <input className="vb-score-input" style={invalid ? { borderColor: "var(--rust)" } : undefined} value={s.home}
                                      onChange={(e) => updateSet(m.id, i, "home", e.target.value)} maxLength={2} />
                                    <input className="vb-score-input" style={invalid ? { borderColor: "var(--rust)" } : undefined} value={s.away}
                                      onChange={(e) => updateSet(m.id, i, "away", e.target.value)} maxLength={2} />
                                  </div>
                                );
                              })}
                            </div>
                            {sets.some((s, i) => setInvalid(s, pointsPerSet, i === maxSets - 1)) && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--rust)", maxWidth: 200 }}>
                                <AlertTriangle size={12} style={{ flexShrink: 0 }} /> Różnica musi wynosić min. 2 pkt, a zwycięzca osiągnąć {pointsPerSet} pkt (poza ew. setem decydującym) — set się nie liczy.
                              </div>
                            )}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {(isTournament || isBrazylijski) && (!m.homeId || !m.awayId) ? (
                            !isBrazylijski && (m.homeId || m.awayId) ? (
                              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--oak)", fontSize: 12 }}>
                                <Check size={14} /> wolny los
                              </span>
                            ) : (
                              <span style={{ fontSize: 12, color: "var(--grey)" }}>oczekuje</span>
                            )
                          ) : o.played ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--oak)", fontSize: 12 }}>
                              <Check size={14} /> {o.homeSets}:{o.awaySets}
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--grey)" }}>w trakcie</span>
                          )}
                          <button onClick={() => setPrintMatchId(m.id)} title="Drukuj protokół meczowy" style={{ background: "none", border: "1px solid #C9C2B3", borderRadius: 8, cursor: "pointer", color: "var(--navy)", display: "flex", alignItems: "center", gap: 4, fontSize: 12, padding: "4px 8px" }}>
                            <Printer size={14} /> Protokół
                          </button>
                          {confirmDeleteMatchId === m.id ? (
                            <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                              <span style={{ color: "var(--rust)" }}>Usunąć mecz?</span>
                              <button className="vb-btn" style={{ background: "var(--rust)", color: "#fff", fontSize: 12, padding: "4px 8px" }} onClick={() => deleteMatch(m.id)}>
                                Tak, usuń
                              </button>
                              <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)", fontSize: 12, padding: "4px 8px" }} onClick={() => setConfirmDeleteMatchId(null)}>
                                Anuluj
                              </button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDeleteMatchId(m.id)} title="Usuń mecz" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                      })}
                  </Section>
                ))
              )}
            </Section>

            {/* Teams management */}
            <Section title="Drużyny">
              {isBrazylijski && (
                <div style={{ fontSize: 12, color: "var(--navy)", background: "#F5F0E4", border: "1px solid #E2DBC9", borderRadius: 8, padding: "6px 10px", marginBottom: 10 }}>
                  System brazylijski na {currentSeasonObj?.brSize || "?"} drużyn wymaga dokładnie tylu drużyn — obecnie masz {teams.length}.
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input className="vb-input" placeholder="Nazwa nowej drużyny" value={newTeamName}
                  onChange={(e) => { setNewTeamName(e.target.value); if (teamError) setTeamError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && addTeam()}
                  style={{ flex: 1 }} />
                <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 4 }} onClick={addTeam}>
                  <Plus size={15} /> Dodaj
                </button>
              </div>
              {teamError && <div style={{ fontSize: 12, color: "var(--rust)", marginBottom: 8 }}>{teamError}</div>}
              {teams.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--grey)" }}>Brak drużyn.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {teams.map((t) => {
                    const teamMatchCount = matches.filter((m) => m.homeId === t.id || m.awayId === t.id).length;
                    return (
                      <div key={t.id} style={{
                        display: "flex", alignItems: "center", gap: 8, background: "#fff",
                        border: "1px solid #DFD8C8", borderRadius: 8, padding: "6px 10px", fontSize: 13,
                      }}>
                        {t.name}
                        {confirmDeleteTeamId === t.id ? (
                          <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                            <span style={{ color: "var(--rust)" }}>
                              {teamMatchCount > 0 ? `Usunie też ${teamMatchCount} mecz(y). Na pewno?` : "Na pewno usunąć?"}
                            </span>
                            <button className="vb-btn" style={{ background: "var(--rust)", color: "#fff", fontSize: 12, padding: "4px 8px" }} onClick={() => deleteTeam(t.id)}>
                              Tak, usuń
                            </button>
                            <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)", fontSize: 12, padding: "4px 8px" }} onClick={() => setConfirmDeleteTeamId(null)}>
                              Anuluj
                            </button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDeleteTeamId(t.id)} title="Usuń drużynę" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            {/* Venues management */}
            <Section title="Hale">
              <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 12 }}>
                Zdefiniuj hale dostępne w tym sezonie — potem wybierzesz je z listy przy ustalaniu terminarza, zamiast wpisywać nazwę za każdym razem.
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input className="vb-input" placeholder="Nazwa nowej hali" value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addVenue()}
                  style={{ flex: 1, maxWidth: 240 }} />
                <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 4 }} onClick={addVenue}>
                  <Plus size={15} /> Dodaj
                </button>
              </div>
              {venues.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--rust)" }}>Brak zdefiniowanych hal — dodaj przynajmniej jedną, zanim wygenerujesz terminarz.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {venues.map((v) => (
                    <div key={v.id} style={{
                      display: "flex", alignItems: "center", gap: 8, background: "#fff",
                      border: "1px solid #DFD8C8", borderRadius: 8, padding: "6px 10px", fontSize: 13,
                    }}>
                      {v.name}
                      <button onClick={() => deleteVenue(v.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Announcements management */}
            <Section title="Ogłoszenia" defaultOpen>
              <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 12 }}>
                Ogłoszenia widoczne są dla wszystkich odwiedzających w zakładce „Ogłoszenia”, najnowsze na górze.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, background: "#fff", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: 12 }}>
                <input className="vb-input" placeholder="Tytuł ogłoszenia" value={newAnnouncementTitle}
                  onChange={(e) => setNewAnnouncementTitle(e.target.value)} />
                <textarea className="vb-input" placeholder="Treść ogłoszenia (opcjonalnie)" value={newAnnouncementBody}
                  onChange={(e) => setNewAnnouncementBody(e.target.value)}
                  rows={3} style={{ resize: "vertical", fontFamily: "'IBM Plex Sans', sans-serif" }} />
                <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start" }} onClick={addAnnouncement}>
                  <Plus size={15} /> Opublikuj ogłoszenie
                </button>
              </div>

              {announcements.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--grey)" }}>Brak ogłoszeń.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {announcements
                    .slice()
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                    .map((a) => (
                      <div key={a.id} style={{
                        background: "#fff", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "10px 12px",
                      }}>
                        {editingAnnouncementId === a.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <input className="vb-input" value={a.title}
                              onChange={(e) => updateAnnouncementField(a.id, "title", e.target.value)} />
                            <textarea className="vb-input" value={a.body}
                              onChange={(e) => updateAnnouncementField(a.id, "body", e.target.value)}
                              rows={3} style={{ resize: "vertical", fontFamily: "'IBM Plex Sans', sans-serif" }} />
                            <button className="vb-btn" style={{ background: "var(--navy)", color: "#fff", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 4 }}
                              onClick={() => setEditingAnnouncementId(null)}>
                              <Check size={14} /> Gotowe
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</div>
                                <div style={{ fontSize: 11, color: "var(--grey)" }}>{formatDateTime(a.createdAt)}</div>
                              </div>
                              {a.body && <div style={{ fontSize: 13, color: "var(--grey)", marginTop: 2, whiteSpace: "pre-wrap" }}>{a.body}</div>}
                            </div>
                            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                              <button onClick={() => setEditingAnnouncementId(a.id)} title="Edytuj" style={{ background: "none", border: "1px solid #C9C2B3", borderRadius: 8, cursor: "pointer", color: "var(--navy)", display: "flex", alignItems: "center", padding: "4px 7px" }}>
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => deleteAnnouncement(a.id)} title="Usuń" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </Section>

            {/* Auto schedule generator (tylko liga) */}
            {!isTournament && !isBrazylijski && (
            <Section title="Generator terminarza (automatyczny)">
              <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 12 }}>
                Wygeneruje mecze każdy z każdym i rozłoży je na podane terminy — dla każdej daty określ godziny i wybierz halę z listy zdefiniowanej w sekcji „Hale”. Żadna drużyna nie zagra dwa razy tego samego dnia.
              </div>

              <div style={{ display: "flex", gap: 18, marginBottom: 14, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" checked={roundMode === "single"} onChange={() => setRoundMode("single")} />
                  Runda pojedyncza (każdy z każdym raz)
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input type="radio" checked={roundMode === "double"} onChange={() => setRoundMode("double")} />
                  Runda podwójna (mecz i rewanż)
                </label>
              </div>

              <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {dateRows.map((row) => (
                  <div key={row.id} style={{ border: "1px solid #DFD8C8", background: "#fff", borderRadius: 8, padding: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <input className="vb-input" style={{ width: 155 }} type="date" value={row.date}
                        onChange={(e) => updateDateRowDate(row.id, e.target.value)} />
                      <span style={{ fontSize: 12, color: "var(--grey)" }}>{row.slots.length} slot(y) meczowe tego dnia</span>
                      <button onClick={() => duplicateDateRow(row.id)} title="Duplikuj ten dzień (te same sloty, nowa data)" style={{
                        background: "none", border: "1px solid #C9C2B3", borderRadius: 8, cursor: "pointer", color: "var(--navy)",
                        display: "flex", alignItems: "center", gap: 4, fontSize: 12, padding: "4px 8px", marginLeft: "auto",
                      }}>
                        <Copy size={13} /> Duplikuj dzień
                      </button>
                      {dateRows.length > 1 && (
                        <button onClick={() => removeDateRow(row.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 8 }}>
                      {row.slots.map((slot) => (
                        <div key={slot.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input className="vb-input" style={{ width: 100, padding: "4px 8px" }} type="time" value={slot.time}
                            onChange={(e) => updateSlot(row.id, slot.id, "time", e.target.value)} />
                          <select className="vb-input" style={{ width: 150, padding: "4px 8px" }}
                            value={slot.venue || (venues[0]?.name || "")}
                            onChange={(e) => updateSlot(row.id, slot.id, "venue", e.target.value)}>
                            {venues.length === 0 && <option value="">Brak zdefiniowanych hal</option>}
                            {venues.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                          </select>
                          {row.slots.length > 1 && (
                            <button onClick={() => removeSlot(row.id, slot.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button className="vb-btn" style={{ background: "none", border: "1px dashed #C9C2B3", color: "var(--navy)", padding: "4px 10px", fontSize: 12, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 4 }} onClick={() => addSlot(row.id)}>
                        <Plus size={12} /> Dodaj godzinę/halę
                      </button>
                    </div>
                  </div>
                ))}
                <button className="vb-btn" style={{ background: "#fff", border: "1px solid #C9C2B3", color: "var(--navy)", display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start" }} onClick={addDateRow}>
                  <Plus size={13} /> Dodaj termin (dzień meczowy)
                </button>
              </div>

              {genError && <div style={{ color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>{genError}</div>}

              <button className="vb-btn" style={{ background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }} onClick={handlePreviewGenerate}>
                <Wand2 size={15} /> Wygeneruj terminarz
              </button>

              {genPreview && (
                <div style={{ marginTop: 14, padding: 12, background: "#fff", border: "1px solid #DFD8C8", borderRadius: 8 }}>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    Wygenerowano <strong>{genPreview.scheduled.length}</strong> z {genPreview.totalMatches} meczów w {genPreview.roundsCount} kolejkach.
                  </div>
                  {genPreview.conflictCount > 0 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>
                      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                      Uwaga: {genPreview.conflictCount} meczów ma tę samą halę, datę i godzinę co inny mecz — sprawdź, czy nie powtórzyłeś/aś tej samej daty w kilku wierszach terminów.
                    </div>
                  )}
                  {genPreview.unscheduledCount > 0 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>
                      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                      {genPreview.oversizedDaysCount > 0 ? (
                        <span>
                          {genPreview.unscheduledCount} meczów nie zmieściło się w terminarzu. Przy {teams.length} drużynach da się rozegrać jednocześnie maksymalnie {genPreview.maxPerDay} {genPreview.maxPerDay === 1 ? "mecz" : "mecze"} dziennie (
                          {genPreview.oversizedDaysCount === 1 ? "jeden dzień ma" : `${genPreview.oversizedDaysCount} dni ma`} zdefiniowanych więcej slotów niż da się realnie wypełnić) — zmniejsz liczbę slotów w tych dniach, dodanie kolejnych dat tego nie naprawi.
                        </span>
                      ) : (
                        <span>{genPreview.unscheduledCount} meczów nie zmieściło się w podanych terminach — dodaj więcej dat lub slotów godzinowych.</span>
                      )}
                    </div>
                  )}
                  {matches.length > 0 && (
                    <div style={{ fontSize: 13, color: "var(--rust)", marginBottom: 8 }}>
                      Uwaga: to zastąpi obecny terminarz ({matches.length} meczów) — wpisane wyniki zostaną utracone.
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff" }} onClick={handleConfirmGenerate}>
                      Potwierdź i zastosuj
                    </button>
                    <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)" }} onClick={() => setGenPreview(null)}>
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
            </Section>
            )}

            {/* Bracket generator (tylko turniej jednodniowy) */}
            {isTournament && (
              <Section title="Generator drabinki (turniej jednodniowy)" defaultOpen>
                <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 12 }}>
                  Ustaw kolejność rozstawienia drużyn (najsilniejsza na górze) i wygeneruj drabinkę pucharową. Po wpisaniu
                  wyniku meczu zwycięzca automatycznie awansuje do kolejnej rundy — nie trzeba nic parować ręcznie.
                  Finał wyłania I i II miejsce, a przegrani półfinałów grają o III miejsce. Jeśli liczba drużyn nie jest
                  potęgą dwójki, najwyżej rozstawione dostają wolny los w 1. rundzie.
                </div>
                {teams.length < 2 ? (
                  <div style={{ fontSize: 13, color: "var(--rust)" }}>Dodaj co najmniej 2 drużyny, żeby wygenerować drabinkę.</div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, maxWidth: 360 }}>
                      {(seedOrder && seedOrder.length === teams.length ? seedOrder : teams.map((t) => t.id)).map((id, idx, arr) => (
                        <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #DFD8C8", borderRadius: 8, padding: "6px 10px" }}>
                          <span className="vb-display" style={{ fontSize: 15, color: "var(--oak)", width: 20 }}>{idx + 1}</span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{teamName(id)}</span>
                          <button onClick={() => moveSeed(idx, -1)} disabled={idx === 0} style={{
                            background: "none", border: "1px solid #C9C2B3", borderRadius: 6, padding: "2px 7px",
                            cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.4 : 1,
                          }}>↑</button>
                          <button onClick={() => moveSeed(idx, 1)} disabled={idx === arr.length - 1} style={{
                            background: "none", border: "1px solid #C9C2B3", borderRadius: 6, padding: "2px 7px",
                            cursor: idx === arr.length - 1 ? "default" : "pointer", opacity: idx === arr.length - 1 ? 0.4 : 1,
                          }}>↓</button>
                        </div>
                      ))}
                    </div>
                    {bracketError && <div style={{ color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>{bracketError}</div>}
                    {matches.length > 0 && (
                      <div style={{ fontSize: 13, color: "var(--rust)", marginBottom: 8 }}>
                        Uwaga: to zastąpi obecną drabinkę ({matches.length} meczów) — wpisane wyniki zostaną utracone.
                      </div>
                    )}
                    {matches.length > 0 && confirmRegenerate ? (
                      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button className="vb-btn" style={{ background: "var(--rust)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }} onClick={handleGenerateBracket}>
                          <Wand2 size={15} /> Tak, generuj ponownie
                        </button>
                        <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)" }} onClick={() => setConfirmRegenerate(false)}>
                          Anuluj
                        </button>
                      </span>
                    ) : (
                      <button className="vb-btn" style={{ background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}
                        onClick={() => matches.length > 0 ? setConfirmRegenerate(true) : handleGenerateBracket()}>
                        <Wand2 size={15} /> Wygeneruj drabinkę
                      </button>
                    )}
                  </>
                )}
              </Section>
            )}

            {isBrazylijski && (
              <Section title="Generator systemu brazylijskiego" defaultOpen>
                <div style={{ fontSize: 13, color: "var(--grey)", marginBottom: 12 }}>
                  Ten sezon jest ustawiony na <strong>{currentSeasonObj?.brSize || "?"} drużyn</strong> (zmienisz to tylko
                  zakładając nowy sezon). Ustaw kolejność rozstawienia (R1 na górze) i wygeneruj drabinkę — każdy zespół
                  gra dalej niezależnie od wyniku: zwycięzca awansuje w górę, przegrany do meczów o miejsca. Po wpisaniu
                  wyniku kolejne mecze uzupełniają się same.
                </div>
                {teams.length !== (currentSeasonObj?.brSize || 0) ? (
                  <div style={{ fontSize: 13, color: "var(--rust)" }}>
                    Potrzebujesz dokładnie {currentSeasonObj?.brSize || "?"} drużyn, żeby wygenerować ten system (masz {teams.length}).
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14, maxWidth: 360 }}>
                      {(seedOrder && seedOrder.length === teams.length ? seedOrder : teams.map((t) => t.id)).map((id, idx, arr) => (
                        <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #DFD8C8", borderRadius: 8, padding: "6px 10px" }}>
                          <span className="vb-display" style={{ fontSize: 15, color: "var(--oak)", width: 20 }}>R{idx + 1}</span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{teamName(id)}</span>
                          <button onClick={() => moveSeed(idx, -1)} disabled={idx === 0} style={{
                            background: "none", border: "1px solid #C9C2B3", borderRadius: 6, padding: "2px 7px",
                            cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.4 : 1,
                          }}>↑</button>
                          <button onClick={() => moveSeed(idx, 1)} disabled={idx === arr.length - 1} style={{
                            background: "none", border: "1px solid #C9C2B3", borderRadius: 6, padding: "2px 7px",
                            cursor: idx === arr.length - 1 ? "default" : "pointer", opacity: idx === arr.length - 1 ? 0.4 : 1,
                          }}>↓</button>
                        </div>
                      ))}
                    </div>
                    {bracketError && <div style={{ color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>{bracketError}</div>}
                    {matches.length > 0 && (
                      <div style={{ fontSize: 13, color: "var(--rust)", marginBottom: 8 }}>
                        Uwaga: to zastąpi obecną drabinkę ({matches.length} meczów) — wpisane wyniki zostaną utracone.
                      </div>
                    )}
                    {matches.length > 0 && confirmRegenerate ? (
                      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button className="vb-btn" style={{ background: "var(--rust)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }} onClick={handleGenerateBrazylijski}>
                          <Wand2 size={15} /> Tak, generuj ponownie
                        </button>
                        <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)" }} onClick={() => setConfirmRegenerate(false)}>
                          Anuluj
                        </button>
                      </span>
                    ) : (
                      <button className="vb-btn" style={{ background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }}
                        onClick={() => matches.length > 0 ? setConfirmRegenerate(true) : handleGenerateBrazylijski()}>
                        <Wand2 size={15} /> Wygeneruj system brazylijski
                      </button>
                    )}
                  </>
                )}
              </Section>
            )}

            {/* Match creation */}
            <Section title="Dodaj pojedynczy mecz ręcznie">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input className="vb-input" style={{ width: 70 }} placeholder="Kolejka" value={newMatch.round}
                  onChange={(e) => setNewMatch({ ...newMatch, round: e.target.value })} />
                <input className="vb-input" style={{ width: 155 }} type="date" value={newMatch.date}
                  onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })} />
                <input className="vb-input" style={{ width: 100 }} type="time" value={newMatch.time}
                  onChange={(e) => setNewMatch({ ...newMatch, time: e.target.value })} />
                <select className="vb-input" style={{ width: 130 }} value={newMatch.venue}
                  onChange={(e) => setNewMatch({ ...newMatch, venue: e.target.value })}>
                  <option value="">Hala</option>
                  {venues.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
                <select className="vb-input" value={newMatch.homeId} onChange={(e) => setNewMatch({ ...newMatch, homeId: e.target.value })}>
                  <option value="">Gospodarz</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <span style={{ color: "var(--grey)" }}>vs</span>
                <select className="vb-input" value={newMatch.awayId} onChange={(e) => setNewMatch({ ...newMatch, awayId: e.target.value })}>
                  <option value="">Gość</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 4 }} onClick={addMatch}>
                  <Plus size={15} /> Dodaj mecz
                </button>
              </div>
              {teams.length < 2 && <div style={{ fontSize: 12, color: "var(--grey)", marginTop: 6 }}>Dodaj co najmniej 2 drużyny, żeby zaplanować mecz.</div>}
            </Section>

            <Section title="Konta administratorów" defaultOpen>
              <div style={{ fontSize: 12, color: "var(--grey)", marginBottom: 10 }}>
                Zalogowano jako <strong>{sessionUsername}</strong>. Tu dodasz lub usuniesz dostęp dla innych osób.
              </div>
              {accountsLoadError && <div style={{ color: "var(--rust)", fontSize: 13, marginBottom: 8 }}>{accountsLoadError}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {adminAccounts.length === 0 && !accountsLoadError && (
                  <div style={{ fontSize: 12, color: "var(--grey)" }}>Wczytywanie listy kont…</div>
                )}
                {adminAccounts.map((a) => (
                  <div key={a.username} style={{
                    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                    background: "#fff", border: "1px solid #DFD8C8", borderRadius: 8, padding: "6px 10px",
                  }}>
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1, minWidth: 100 }}>
                      {a.username}
                      {a.username === sessionUsername && (
                        <span style={{ fontWeight: 400, color: "var(--oak)", fontSize: 11 }}> · Ty</span>
                      )}
                    </span>
                    {adminAccounts.length > 1 && (
                      confirmRemoveAcc === a.username ? (
                        <span style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
                          <span style={{ color: "var(--rust)" }}>Na pewno usunąć?</span>
                          <button className="vb-btn" style={{ background: "var(--rust)", color: "#fff", fontSize: 12, padding: "4px 8px" }} onClick={() => handleRemoveAccount(a.username)}>
                            Tak, usuń
                          </button>
                          <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)", fontSize: 12, padding: "4px 8px" }} onClick={() => setConfirmRemoveAcc("")}>
                            Anuluj
                          </button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmRemoveAcc(a.username)} title="Usuń konto" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rust)", display: "flex" }}>
                          <Trash2 size={14} />
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Dodaj nową osobę</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                <input type="text" autoComplete="off" className="vb-input" placeholder="Login" value={newAccUsername}
                  onChange={(e) => setNewAccUsername(e.target.value)} style={{ width: 140 }} />
                <input type="password" autoComplete="new-password" className="vb-input" placeholder="Hasło (min. 4 znaki)" value={newAccPassword}
                  onChange={(e) => setNewAccPassword(e.target.value)} style={{ width: 160 }} />
                <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff" }} onClick={handleAddAccount}>
                  Dodaj konto
                </button>
              </div>
              {newAccError && <div style={{ color: "var(--rust)", fontSize: 13, marginBottom: 6 }}>{newAccError}</div>}

              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 14, marginBottom: 6 }}>Zmień własne hasło</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input type="password" autoComplete="new-password" className="vb-input" placeholder="Nowe hasło" value={changeOwnPass}
                  onChange={(e) => setChangeOwnPass(e.target.value)} style={{ width: 160 }} />
                <button className="vb-btn" style={{ background: "none", border: "1px solid #C9C2B3", color: "var(--navy)" }} onClick={handleChangeOwnPassword}>
                  Zapisz hasło
                </button>
                {changeOwnPassMsg && <span style={{ fontSize: 12, color: changeOwnPassMsg === "Hasło zmienione." ? "var(--oak)" : "var(--rust)" }}>{changeOwnPassMsg}</span>}
              </div>
            </Section>

            <button onClick={handleLogout} style={{
              background: "none", border: "none", color: "var(--grey)", fontSize: 12, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, marginTop: 4,
            }}>
              <X size={13} /> Wyloguj z panelu admina
            </button>
          </div>
        )}
      </div>
      </div>

      {matchToPrint && (
        <MatchProtocol
          match={matchToPrint}
          teams={teams}
          seasonName={currentSeasonName}
          setsToWin={currentSeasonObj?.setsToWin || 3}
          pointsPerSet={currentSeasonObj?.pointsPerSet || 25}
          onClose={() => setPrintMatchId(null)}
        />
      )}

      {posterOpen && (
        <SchedulePoster
          matches={matches}
          teams={teams}
          rounds={rounds}
          seasonName={currentSeasonName}
          isBracketStyle={isTournament || isBrazylijski}
          onClose={() => setPosterOpen(false)}
        />
      )}
    </div>
  );
}

function Section({ title, children, defaultOpen = false, compact = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      marginBottom: compact ? 8 : 14,
      border: "1px solid var(--line)",
      borderRadius: "var(--radius)",
      background: compact ? "var(--chalk)" : "#fff",
      overflow: "hidden",
      boxShadow: compact ? "none" : "var(--shadow-sm)",
      transition: "box-shadow 0.15s ease",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: compact ? "9px 12px" : "13px 16px",
          fontWeight: 700, fontSize: compact ? 13 : 14, color: "var(--navy)",
          fontFamily: "'IBM Plex Sans', sans-serif", textAlign: "left",
        }}
      >
        {title}
        <ChevronDown
          size={compact ? 14 : 16}
          color="var(--oak)"
          style={{ transition: "transform 0.18s ease", transform: open ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0, marginLeft: 8 }}
        />
      </button>
      {open && <div style={{ padding: compact ? "0 12px 12px 12px" : "0 16px 16px 16px" }}>{children}</div>}
    </div>
  );
}

function EmptyState({ text, icon: Icon = CalendarDays }) {
  return (
    <div style={{
      textAlign: "center", padding: "52px 24px", color: "var(--grey)",
      border: "1px dashed #CDC5AF", borderRadius: "var(--radius)", background: "rgba(255,255,255,0.5)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%", background: "var(--chalk-2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={20} color="var(--oak)" />
      </div>
      <div style={{ fontSize: 14, maxWidth: 320, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}

function SchedulePoster({ matches, teams, rounds, seasonName, isBracketStyle, onClose }) {
  const teamName = (id) => teams.find((t) => t.id === id)?.name || "—";
  const generatedAt = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="vb-poster-overlay" style={{
      position: "fixed", inset: 0, background: "rgba(22,48,61,0.55)", zIndex: 1000,
      overflowY: "auto", padding: "28px 16px",
    }}>
      <div className="vb-no-print" style={{
        maxWidth: 760, margin: "0 auto 12px auto", display: "flex", justifyContent: "flex-end", gap: 8,
      }}>
        <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }} onClick={() => window.print()}>
          <Printer size={15} /> Drukuj / Zapisz jako PDF
        </button>
        <button className="vb-btn" style={{ background: "#fff", border: "1px solid #C9C2B3", color: "var(--navy)", display: "flex", alignItems: "center", gap: 6 }} onClick={onClose}>
          <X size={15} /> Zamknij
        </button>
      </div>

      <div className="vb-poster-sheet vb-root" style={{
        maxWidth: 760, margin: "0 auto", background: "#fff",
        boxShadow: "0 6px 24px rgba(0,0,0,0.25)", fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--navy)",
        overflow: "hidden", borderRadius: 6,
      }}>
        <div style={{
          background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-2) 100%)",
          padding: "30px 32px", textAlign: "center", position: "relative",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "var(--amber)" }} />
          <img src={LOGO_DATA_URI} alt="Towarzystwo Sportowe w Wągrowcu" style={{ width: 92, height: 92, marginBottom: 10 }} />
          <div className="vb-display" style={{ color: "var(--amber)", fontSize: 40, letterSpacing: "0.03em", lineHeight: 1 }}>
            TERMINARZ ROZGRYWEK
          </div>
          <div style={{ color: "var(--chalk)", fontSize: 15, marginTop: 6 }}>
            Liga Siatkówki{seasonName ? ` — sezon ${seasonName}` : ""}
          </div>
        </div>

        <div style={{ padding: "26px 32px 32px 32px" }}>
          {rounds.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--grey)", padding: "20px 0" }}>Brak zaplanowanych meczów.</div>
          ) : (
            rounds.map((round) => {
              const roundMatches = matches
                .filter((m) => m.round === round)
                .slice()
                .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.venue || "").localeCompare(b.venue || "") || (a.time || "").localeCompare(b.time || ""));
              if (roundMatches.length === 0) return null;
              return (
                <div key={round} className="vb-poster-round" style={{ marginBottom: 20 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                    borderBottom: "2px solid var(--oak)", paddingBottom: 4,
                  }}>
                    <span className="vb-display" style={{ fontSize: 20, color: "var(--navy)" }}>{isBracketStyle ? round : `KOLEJKA ${round}`}</span>
                  </div>
                  {roundMatches.map((m) => (
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 4px", borderBottom: "1px solid #EAE5D9", gap: 10, flexWrap: "wrap",
                    }}>
                      <span style={{ fontSize: 12, color: "var(--grey)", minWidth: 170 }}>
                        {m.date ? formatDate(m.date) : "termin TBA"}{m.time ? ` · ${m.time}` : ""}{m.venue ? ` · ${m.venue}` : ""}
                      </span>
                      <span style={{ flex: 1, textAlign: "right", fontWeight: 600, fontSize: 14 }}>{teamName(m.homeId)}</span>
                      <span className="vb-display" style={{ color: "var(--oak)", fontSize: 16, padding: "0 4px" }}>vs</span>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{teamName(m.awayId)}</span>
                    </div>
                  ))}
                </div>
              );
            })
          )}

          <div style={{
            marginTop: 24, paddingTop: 14, borderTop: "1px solid #DFD8C8",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 11, color: "var(--grey)",
          }}>
            <span>Towarzystwo Sportowe w Wągrowcu</span>
            <span>Wygenerowano: {generatedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchProtocol({ match, teams, seasonName, setsToWin = 3, pointsPerSet = 25, onClose }) {
  const teamName = (id) => teams.find((t) => t.id === id)?.name || "—";
  const o = matchOutcome(match, setsToWin, pointsPerSet);
  const maxSets = setsToWin * 2 - 1;
  const sets = [...(match.sets || [])];
  while (sets.length < maxSets) sets.push({ home: "", away: "" });
  const printedAt = new Date().toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  const protocolNo = `${match.round || "?"}/${(match.id || "").toUpperCase()}`;

  return (
    <div className="vb-protocol-overlay" style={{
      position: "fixed", inset: 0, background: "rgba(22,48,61,0.55)", zIndex: 1000,
      overflowY: "auto", padding: "28px 16px",
    }}>
      <div className="vb-no-print" style={{
        maxWidth: 720, margin: "0 auto 12px auto", display: "flex", justifyContent: "flex-end", gap: 8,
      }}>
        <button className="vb-btn" style={{ background: "var(--oak)", color: "#fff", display: "flex", alignItems: "center", gap: 6 }} onClick={() => window.print()}>
          <Printer size={15} /> Drukuj
        </button>
        <button className="vb-btn" style={{ background: "#fff", border: "1px solid #C9C2B3", color: "var(--navy)", display: "flex", alignItems: "center", gap: 6 }} onClick={onClose}>
          <X size={15} /> Zamknij
        </button>
      </div>

      <div className="vb-protocol-sheet vb-root" style={{
        maxWidth: 720, margin: "0 auto", background: "#fff", padding: "36px 42px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.25)", fontFamily: "'IBM Plex Sans', sans-serif", color: "var(--navy)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 18, borderBottom: "2px solid var(--navy)", paddingBottom: 14 }}>
          <img src={LOGO_DATA_URI} alt="Towarzystwo Sportowe w Wągrowcu" style={{ width: 56, height: 56, marginBottom: 8 }} />
          <div className="vb-display" style={{ fontSize: 24, letterSpacing: "0.03em" }}>PROTOKÓŁ MECZOWY</div>
          <div style={{ fontSize: 13, color: "var(--grey)", marginTop: 2 }}>Liga Siatkówki{seasonName ? ` — sezon ${seasonName}` : ""}</div>
          <div style={{ fontSize: 11, color: "var(--grey)", marginTop: 4 }}>Nr protokołu: {protocolNo}</div>
        </div>

        <table className="vb-protocol-table" style={{ marginBottom: 18 }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, width: "25%", textAlign: "left" }}>Kolejka</td>
              <td style={{ textAlign: "left" }}>{match.round || "—"}</td>
              <td style={{ fontWeight: 600, width: "25%", textAlign: "left" }}>Data / godzina</td>
              <td style={{ textAlign: "left" }}>{formatDate(match.date) || "—"}{match.time ? `, ${match.time}` : ""}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600, textAlign: "left" }}>Hala</td>
              <td colSpan={3} style={{ textAlign: "left" }}>{match.venue || "—"}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "10px 4px" }}>
          <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16 }}>{teamName(match.homeId)}</div>
          <div className="vb-display" style={{ fontSize: 28, padding: "0 18px", color: "var(--navy)" }}>
            {o.played ? `${o.homeSets} : ${o.awaySets}` : "— : —"}
          </div>
          <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 16 }}>{teamName(match.awayId)}</div>
        </div>

        <table className="vb-protocol-table" style={{ marginBottom: 10 }}>
          <thead>
            <tr>
              <th>Set</th>{sets.map((_, i) => <th key={i}>{i + 1}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, textAlign: "left" }}>{teamName(match.homeId)}</td>
              {sets.map((s, i) => <td key={i}>{s.home !== "" ? s.home : "—"}</td>)}
            </tr>
            <tr>
              <td style={{ fontWeight: 600, textAlign: "left" }}>{teamName(match.awayId)}</td>
              {sets.map((s, i) => <td key={i}>{s.away !== "" ? s.away : "—"}</td>)}
            </tr>
          </tbody>
        </table>

        {o.played && (
          <div style={{ fontSize: 12, color: "var(--grey)", marginBottom: 18 }}>
            Punkty w setach: {o.homePts}:{o.awayPts} &nbsp;•&nbsp; Punkty ligowe: {o.leaguePts.home}:{o.leaguePts.away}
          </div>
        )}

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Zawodnik meczu (MVP):</div>
          <div className="vb-sig-line"></div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Uwagi / zastrzeżenia:</div>
          <div className="vb-sig-line" style={{ marginBottom: 6 }}></div>
          <div className="vb-sig-line"></div>
        </div>

        <div className="vb-sig-row" style={{ display: "flex", gap: 20, marginTop: 30 }}>
          {["Sędzia", `Kapitan — ${teamName(match.homeId)}`, `Kapitan — ${teamName(match.awayId)}`].map((label) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div className="vb-sig-line"></div>
              <div style={{ fontSize: 11, color: "var(--grey)", marginTop: 4 }}>{label} (podpis)</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "var(--grey)", marginTop: 28, textAlign: "right" }}>
          Protokół wygenerowany: {printedAt}
        </div>
      </div>
    </div>
  );
}
