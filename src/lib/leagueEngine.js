// Silnik ligi: generowanie harmonogramu (round-robin + wypełnianie dni),
// drabinka pucharowa i system brazylijski, wynik meczu/seta, tabela,
// wykrywanie kolizji hal oraz sesja administratora (login/hasło w
// sessionStorage). Same funkcje/dane, zero JSX i zero zależności od Reacta —
// dzięki temu można je testować w izolacji (patrz testy przy okazji zmian).

export const LEGACY_TEAMS_KEY = "vb-teams";
export const LEGACY_MATCHES_KEY = "vb-matches";
export const SEASONS_KEY = "vb-seasons";
export const CURRENT_SEASON_KEY = "vb-current-season";
const ADMIN_SESSION_KEY = "vb-admin-session";

// Trzyma login/hasło administratora w sessionStorage (znika po zamknięciu karty,
// ale przetrwa odświeżenie strony) — żeby nie trzeba było logować się od nowa
// przy każdym F5 podczas wpisywania wyników.
export function saveAdminSession(username, password) {
  try { sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ username, password })); } catch (e) { /* prywatna karta / brak storage */ }
}
export function loadAdminSession() {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.username || !parsed?.password) return null;
    return parsed;
  } catch (e) { return null; }
}
export function clearAdminSession() {
  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch (e) { /* ignoruj */ }
}

export const teamsKey = (seasonId) => `vb-teams-${seasonId}`;
export const matchesKey = (seasonId) => `vb-matches-${seasonId}`;
export const venuesKey = (seasonId) => `vb-venues-${seasonId}`;
export const announcementsKey = (seasonId) => `vb-announcements-${seasonId}`;

export function formatDateTime(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
  } catch (e) {
    return "";
  }
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) {
    return iso;
  }
}

export function setWinner(set, pointsPerSet = 25, isDecider = false) {
  if (set.home === "" || set.away === "" || set.home == null || set.away == null) return null;
  const h = Number(set.home), a = Number(set.away);
  if (Number.isNaN(h) || Number.isNaN(a) || h === a) return null;
  if (Math.abs(h - a) < 2) return null; // set musi być wygrany różnicą min. 2 punktów, jak w siatkówce
  // Set decydujący (tie-break) bywa grany do innej liczby punktów niż reszta
  // (klasycznie 15 zamiast 25) — nie znamy dokładnej wartości dla tego sezonu,
  // więc dla niego sprawdzamy tylko różnicę min. 2 pkt, bez progu pointsPerSet.
  if (!isDecider && Math.max(h, a) < pointsPerSet) return null;
  return h > a ? "home" : "away";
}

// Zwraca true, gdy oba wyniki seta są wpisane, ale wynik jest nieprawidłowy —
// różnica mniejsza niż 2 punkty ALBO (poza setem decydującym) zwycięzca nie
// osiągnął progu punktowego ustawionego dla sezonu (np. 21:19 przy secie do
// 25 pkt) — taki set nie liczy się do wyniku meczu, dopóki nie zostanie poprawiony.
export function setInvalid(set, pointsPerSet = 25, isDecider = false) {
  if (set.home === "" || set.away === "" || set.home == null || set.away == null) return false;
  const h = Number(set.home), a = Number(set.away);
  if (Number.isNaN(h) || Number.isNaN(a)) return false;
  if (Math.abs(h - a) < 2) return true;
  if (!isDecider && Math.max(h, a) < pointsPerSet) return true;
  return false;
}

export function matchOutcome(match, setsToWin = 3, pointsPerSet = 25) {
  let homeSets = 0, awaySets = 0, homePts = 0, awayPts = 0;
  const deciderIndex = setsToWin * 2 - 2; // pozycja (0-indeksowana) ostatniego możliwego seta
  const sets = match.sets || [];
  for (let i = 0; i < sets.length; i++) {
    const s = sets[i];
    const w = setWinner(s, pointsPerSet, i === deciderIndex);
    if (w === "home") homeSets++;
    if (w === "away") awaySets++;
    if (w) {
      homePts += Number(s.home);
      awayPts += Number(s.away);
    }
  }
  const played = homeSets >= setsToWin || awaySets >= setsToWin;
  let winner = null, leaguePts = null;
  if (played) {
    winner = homeSets >= setsToWin ? "home" : "away";
    const tight = homeSets + awaySets === setsToWin * 2 - 1;
    leaguePts = tight
      ? { home: winner === "home" ? 2 : 1, away: winner === "away" ? 2 : 1 }
      : { home: winner === "home" ? 3 : 0, away: winner === "away" ? 3 : 0 };
  }
  return { homeSets, awaySets, homePts, awayPts, played, winner, leaguePts };
}

export function computeStandings(teams, matches) {
  const table = {};
  for (const t of teams) {
    table[t.id] = { id: t.id, name: t.name, mp: 0, w: 0, l: 0, setsW: 0, setsL: 0, ptsW: 0, ptsL: 0, pts: 0 };
  }
  for (const m of matches) {
    const o = matchOutcome(m);
    if (!o.played || !table[m.homeId] || !table[m.awayId]) continue;
    const home = table[m.homeId], away = table[m.awayId];
    home.mp++; away.mp++;
    home.setsW += o.homeSets; home.setsL += o.awaySets;
    away.setsW += o.awaySets; away.setsL += o.homeSets;
    home.ptsW += o.homePts; home.ptsL += o.awayPts;
    away.ptsW += o.awayPts; away.ptsL += o.homePts;
    home.pts += o.leaguePts.home; away.pts += o.leaguePts.away;
    if (o.winner === "home") { home.w++; away.l++; } else { away.w++; home.l++; }
  }
  return Object.values(table).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const ra = a.setsL === 0 ? a.setsW : a.setsW / a.setsL;
    const rb = b.setsL === 0 ? b.setsW : b.setsW / b.setsL;
    if (rb !== ra) return rb - ra;
    const pa = a.ptsL === 0 ? a.ptsW : a.ptsW / a.ptsL;
    const pb = b.ptsL === 0 ? b.ptsW : b.ptsW / b.ptsL;
    return pb - pa;
  });
}

// Wykrywa mecze, które kolidują ze sobą: ta sama data + godzina + hala.
// Zwraca mapę matchId -> lista ID meczów, z którymi dany mecz koliduje (fizycznie niemożliwe:
// dwa mecze nie mogą się jednocześnie rozgrywać na tej samej hali).
export function findVenueConflicts(matches) {
  const groups = {};
  for (const m of matches) {
    const date = (m.date || "").trim();
    const time = (m.time || "").trim();
    const venue = (m.venue || "").trim().toLowerCase();
    if (!date || !time || !venue) continue;
    const key = `${date}|${time}|${venue}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m.id);
  }
  const conflicts = {};
  for (const ids of Object.values(groups)) {
    if (ids.length > 1) {
      for (const id of ids) conflicts[id] = ids.filter((x) => x !== id);
    }
  }
  return conflicts;
}

// Metoda kołowa: każda drużyna gra z każdą raz (lub dwa razy przy rundzie podwójnej),
// nigdy dwa mecze tej samej drużyny w tej samej kolejce.
export function generateRoundRobin(teamIds, doubleRound) {
  let arr = [...teamIds];
  if (arr.length % 2 !== 0) arr.push(null); // "wolny los" przy nieparzystej liczbie drużyn
  const n = arr.length;
  const roundsCount = n - 1;
  const rounds = [];
  for (let r = 0; r < roundsCount; r++) {
    const roundMatches = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i], b = arr[n - 1 - i];
      if (a !== null && b !== null) {
        roundMatches.push(r % 2 === 0 ? { home: a, away: b } : { home: b, away: a });
      }
    }
    rounds.push(roundMatches);
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed, ...rest];
  }
  if (doubleRound) {
    const secondLeg = rounds.map((rm) => rm.map((m) => ({ home: m.away, away: m.home })));
    return [...rounds, ...secondLeg];
  }
  return rounds;
}

// Wypełnia każdy wyznaczony dzień meczowy jego slotami, biorąc najbliższe
// pasujące mecze z kolejki round-robina (tak, żeby żadna drużyna nie zagrała
// dwa razy tego samego dnia). „Kolejka” w wyniku = numer wyznaczonego dnia
// (kolejność dni z formularza), a NIE sztywna runda round-robina — dzięki
// temu liczba kolejek w terminarzu odpowiada liczbie realnie zaplanowanych
// dni meczowych, tak jak w przygotowanym wcześniej planie.
export function assignToDates(rounds, dateRows) {
  // Spłaszcz wszystkie rundy round-robina w jedną kolejkę — kolejność rund
  // to tylko preferowana kolejność wyboru (żeby mecze rozkładały się możliwie
  // równomiernie), a nie sztywny podział na dni.
  const queue = [];
  for (const roundMatches of rounds) {
    for (const m of roundMatches) queue.push({ home: m.home, away: m.away });
  }

  const scheduled = [];
  let dayNumber = 0;

  for (const row of dateRows) {
    if (!row.slots || row.slots.length === 0) continue;
    dayNumber++;
    const playedToday = new Set();
    for (const slot of row.slots) {
      let foundIdx = -1;
      for (let i = 0; i < queue.length; i++) {
        const m = queue[i];
        if (!playedToday.has(m.home) && !playedToday.has(m.away)) { foundIdx = i; break; }
      }
      if (foundIdx === -1) continue; // żaden pozostały mecz nie pasuje na ten slot (obie drużyny już dziś grają)
      const [m] = queue.splice(foundIdx, 1);
      playedToday.add(m.home);
      playedToday.add(m.away);
      scheduled.push({
        home: m.home,
        away: m.away,
        round: dayNumber,
        date: row.date,
        time: slot.time || "",
        venue: slot.venue || "",
      });
    }
  }

  return { scheduled, unscheduled: queue.length };
}

// ---- TURNIEJ JEDNODNIOWY (drabinka pucharowa, tzw. „system brazylijski") ----
// Pełna drabinka eliminacyjna z rozstawieniem i wolnymi losami (bye) dla dowolnej
// liczby drużyn, finałem i meczem o 3. miejsce. Po wpisaniu wyniku zwycięzca
// automatycznie awansuje do kolejnej rundy — patrz advanceBracket().

export function nextPowerOfTwo(n) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Klasyczny algorytm rozstawienia: dla danej liczby miejsc (potęga dwójki) zwraca
// kolejność numerów rozstawienia tak, żeby np. 1 i 2 mogli się spotkać dopiero
// w finale (dla 8 miejsc: 1-8, 4-5, 2-7, 3-6).
export function buildSeedOrder(size) {
  let seedList = [1, 2];
  while (seedList.length < size) {
    const s = seedList.length * 2;
    const next = [];
    for (const x of seedList) next.push(x, s + 1 - x);
    seedList = next;
  }
  return seedList;
}

export function stageLabel(roundIndex, totalRounds) {
  const fromEnd = totalRounds - roundIndex;
  if (fromEnd <= 1) return "Finał";
  if (fromEnd === 2) return "Półfinał";
  if (fromEnd === 3) return "Ćwierćfinał";
  return `1/${Math.pow(2, fromEnd - 1)} finału`;
}

// Buduje pełną strukturę meczów drabinki (wszystkie rundy, łącznie z pustymi
// „miejscami" na przyszłych zwycięzców) na podstawie listy ID drużyn w kolejności
// rozstawienia (pierwsza drużyna = rozstawienie nr 1, itd.).
export function generateBracketMatches(seedTeamIds) {
  const size = nextPowerOfTwo(seedTeamIds.length);
  const totalRounds = Math.log2(size);
  const order = buildSeedOrder(size);
  const bySeed = [...seedTeamIds];
  while (bySeed.length < size) bySeed.push(null); // null = wolny los
  const slots = order.map((seedNo) => bySeed[seedNo - 1] ?? null);

  const matches = [];
  let prevRoundIds = [];
  for (let i = 0; i < slots.length; i += 2) {
    const id = uid();
    matches.push({
      id, round: stageLabel(0, totalRounds), date: "", time: "", venue: "",
      homeId: slots[i], awayId: slots[i + 1], sets: [],
      bracket: { roundIndex: 0, nextMatchId: null, nextSlot: null, loserNextMatchId: null, loserNextSlot: null },
    });
    prevRoundIds.push(id);
  }

  for (let r = 1; r < totalRounds; r++) {
    const thisRoundIds = [];
    for (let i = 0; i < prevRoundIds.length / 2; i++) {
      const id = uid();
      matches.push({
        id, round: stageLabel(r, totalRounds), date: "", time: "", venue: "",
        homeId: null, awayId: null, sets: [],
        bracket: { roundIndex: r, nextMatchId: null, nextSlot: null, loserNextMatchId: null, loserNextSlot: null },
      });
      thisRoundIds.push(id);
      const srcA = matches.find((m) => m.id === prevRoundIds[i * 2]);
      const srcB = matches.find((m) => m.id === prevRoundIds[i * 2 + 1]);
      if (srcA) { srcA.bracket.nextMatchId = id; srcA.bracket.nextSlot = "home"; }
      if (srcB) { srcB.bracket.nextMatchId = id; srcB.bracket.nextSlot = "away"; }
    }
    prevRoundIds = thisRoundIds;
  }

  // Mecz o 3. miejsce — przegrani obu półfinałów (jeśli jest więcej niż jedna runda).
  if (totalRounds >= 2) {
    const semiIds = matches.filter((m) => m.bracket.roundIndex === totalRounds - 2).map((m) => m.id);
    if (semiIds.length === 2) {
      const bronzeId = uid();
      matches.push({
        id: bronzeId, round: "Mecz o 3. miejsce", date: "", time: "", venue: "",
        homeId: null, awayId: null, sets: [],
        bracket: { roundIndex: totalRounds - 1, isBronze: true, nextMatchId: null, nextSlot: null, loserNextMatchId: null, loserNextSlot: null },
      });
      const semiA = matches.find((m) => m.id === semiIds[0]);
      const semiB = matches.find((m) => m.id === semiIds[1]);
      if (semiA) { semiA.bracket.loserNextMatchId = bronzeId; semiA.bracket.loserNextSlot = "home"; }
      if (semiB) { semiB.bracket.loserNextMatchId = bronzeId; semiB.bracket.loserNextSlot = "away"; }
    }
  }

  return matches;
}

// Wynik meczu drabinki: jeśli jedna strona to wolny los (brak drużyny), mecz jest
// automatycznie rozstrzygnięty bez rozgrywania.
export function bracketMatchOutcome(match, setsToWin = 3, pointsPerSet = 25) {
  const allowBye = !(match.bracket && match.bracket.noBye);
  if (allowBye) {
    const homeIsBye = !match.homeId;
    const awayIsBye = !match.awayId;
    if (homeIsBye && awayIsBye) return { played: false, winner: null, loser: null };
    if (homeIsBye) return { played: true, winner: match.awayId, loser: null, bye: true };
    if (awayIsBye) return { played: true, winner: match.homeId, loser: null, bye: true };
  } else if (!match.homeId || !match.awayId) {
    // System brazylijski nie zna "wolnych losów" — brak drużyny oznacza po
    // prostu, że poprzedni mecz jeszcze nie wyłonił zwycięzcy/przegranego.
    return { played: false, winner: null, loser: null };
  }
  const o = matchOutcome(match, setsToWin, pointsPerSet);
  if (!o.played) return { played: false, winner: null, loser: null };
  return {
    played: true,
    winner: o.winner === "home" ? match.homeId : match.awayId,
    loser: o.winner === "home" ? match.awayId : match.homeId,
    bye: false,
  };
}

// Po każdej zmianie wyniku „przepycha" zwycięzców (i przegranych półfinałów do
// meczu o 3. miejsce) do kolejnych rund drabinki.
export function advanceBracket(allMatches, setsToWin = 3, pointsPerSet = 25) {
  const byId = {};
  for (const m of allMatches) byId[m.id] = m;
  let changed = true;
  let guard = 0;
  while (changed && guard < allMatches.length + 5) {
    changed = false;
    guard++;
    for (const m of allMatches) {
      if (!m.bracket) continue;
      const o = bracketMatchOutcome(m, setsToWin, pointsPerSet);
      if (!o.played) continue;
      if (m.bracket.nextMatchId) {
        const next = byId[m.bracket.nextMatchId];
        if (next) {
          const field = m.bracket.nextSlot === "home" ? "homeId" : "awayId";
          if (next[field] !== o.winner) { next[field] = o.winner; changed = true; }
        }
      }
      if (m.bracket.loserNextMatchId && o.loser) {
        const next = byId[m.bracket.loserNextMatchId];
        if (next) {
          const field = m.bracket.loserNextSlot === "home" ? "homeId" : "awayId";
          if (next[field] !== o.loser) { next[field] = o.loser; changed = true; }
        }
      }
    }
  }
  return allMatches.map((m) => ({ ...m }));
}

// ---- SYSTEM BRAZYLIJSKI (pełna klubowa drabinka z miejscówkami) ----
// W odróżnieniu od zwykłej drabinki pucharowej powyżej, tu KAŻDY zespół gra
// dalej niezależnie od wyniku — zwycięzca idzie w górę drabinki, przegrany
// w dół, do meczów o miejsca. Kolejność i parowania meczów są tu ustalone
// na stałe (tak jak w klubowych tabelach systemu brazylijskiego) dla 4
// wariantów: 8, 12, 16 i 24 drużyny.
function seed(n) { return { type: "seed", n }; }
function win(m) { return { type: "winner", m }; }
function lose(m) { return { type: "loser", m }; }

export const BRAZYLIJSKI_CONFIGS = {
  8: {
    championId: 14, thirdPlaceId: 13,
    matches: [
      { id: 1, slotA: seed(0), slotB: seed(7) },
      { id: 2, slotA: seed(5), slotB: seed(2) },
      { id: 3, slotA: seed(3), slotB: seed(4) },
      { id: 4, slotA: seed(6), slotB: seed(1) },
      { id: 5, slotA: win(1), slotB: win(2) },
      { id: 7, slotA: lose(1), slotB: lose(2) },
      { id: 8, slotA: lose(3), slotB: lose(4) },
      { id: 6, slotA: win(3), slotB: win(4) },
      { id: 10, slotA: win(8), slotB: lose(5) },
      { id: 9, slotA: lose(6), slotB: win(7) },
      { id: 11, slotA: win(5), slotB: win(9) },
      { id: 12, slotA: win(6), slotB: win(10) },
      { id: 14, slotA: win(11), slotB: win(12) },
      { id: 13, slotA: lose(11), slotB: lose(12) },
    ],
  },
  12: {
    championId: 22, thirdPlaceId: 21,
    matches: [
      { id: 1, slotA: seed(7), slotB: seed(8) },
      { id: 2, slotA: seed(4), slotB: seed(11) },
      { id: 3, slotA: seed(5), slotB: seed(10) },
      { id: 4, slotA: seed(6), slotB: seed(9) },
      { id: 5, slotA: seed(0), slotB: win(1) },
      { id: 6, slotA: win(2), slotB: seed(3) },
      { id: 7, slotA: seed(2), slotB: win(3) },
      { id: 8, slotA: win(4), slotB: seed(1) },
      { id: 12, slotA: lose(1), slotB: lose(8) },
      { id: 11, slotA: lose(2), slotB: lose(7) },
      { id: 10, slotA: lose(3), slotB: lose(6) },
      { id: 9, slotA: lose(4), slotB: lose(5) },
      { id: 13, slotA: win(5), slotB: win(6) },
      { id: 15, slotA: win(12), slotB: win(11) },
      { id: 16, slotA: win(10), slotB: win(9) },
      { id: 14, slotA: win(7), slotB: win(8) },
      { id: 18, slotA: lose(13), slotB: win(16) },
      { id: 17, slotA: lose(14), slotB: win(15) },
      { id: 19, slotA: win(13), slotB: win(17) },
      { id: 20, slotA: win(14), slotB: win(18) },
      { id: 22, slotA: win(19), slotB: win(20) },
      { id: 21, slotA: lose(19), slotB: lose(20) },
    ],
  },
  16: {
    championId: 30, thirdPlaceId: 29,
    matches: [
      { id: 1, slotA: seed(0), slotB: seed(15) },
      { id: 2, slotA: seed(8), slotB: seed(7) },
      { id: 3, slotA: seed(4), slotB: seed(11) },
      { id: 4, slotA: seed(12), slotB: seed(3) },
      { id: 5, slotA: seed(2), slotB: seed(13) },
      { id: 6, slotA: seed(10), slotB: seed(5) },
      { id: 7, slotA: seed(6), slotB: seed(9) },
      { id: 8, slotA: seed(14), slotB: seed(1) },
      { id: 9, slotA: win(1), slotB: win(2) },
      { id: 10, slotA: win(3), slotB: win(4) },
      { id: 11, slotA: win(5), slotB: win(6) },
      { id: 12, slotA: win(7), slotB: win(8) },
      { id: 13, slotA: lose(8), slotB: lose(7) },
      { id: 14, slotA: lose(6), slotB: lose(5) },
      { id: 15, slotA: lose(4), slotB: lose(3) },
      { id: 16, slotA: lose(2), slotB: lose(1) },
      { id: 17, slotA: win(13), slotB: lose(9) },
      { id: 18, slotA: win(14), slotB: lose(10) },
      { id: 19, slotA: win(15), slotB: lose(11) },
      { id: 20, slotA: win(16), slotB: lose(12) },
      { id: 21, slotA: win(9), slotB: win(10) },
      { id: 22, slotA: win(11), slotB: win(12) },
      { id: 23, slotA: win(17), slotB: win(18) },
      { id: 24, slotA: win(19), slotB: win(20) },
      { id: 25, slotA: lose(22), slotB: win(23) },
      { id: 26, slotA: lose(21), slotB: win(24) },
      { id: 27, slotA: win(21), slotB: win(25) },
      { id: 28, slotA: win(22), slotB: win(26) },
      { id: 29, slotA: lose(27), slotB: lose(28) },
      { id: 30, slotA: win(27), slotB: win(28) },
    ],
  },
  24: {
    championId: 46, thirdPlaceId: 45,
    matches: [
      { id: 1, slotA: seed(16), slotB: seed(15) },
      { id: 2, slotA: seed(8), slotB: seed(23) },
      { id: 3, slotA: seed(20), slotB: seed(11) },
      { id: 4, slotA: seed(12), slotB: seed(19) },
      { id: 5, slotA: seed(18), slotB: seed(13) },
      { id: 6, slotA: seed(10), slotB: seed(21) },
      { id: 7, slotA: seed(22), slotB: seed(9) },
      { id: 8, slotA: seed(14), slotB: seed(17) },
      { id: 9, slotA: seed(0), slotB: win(1) },
      { id: 10, slotA: win(2), slotB: seed(7) },
      { id: 11, slotA: seed(4), slotB: win(3) },
      { id: 12, slotA: win(4), slotB: seed(3) },
      { id: 13, slotA: seed(2), slotB: win(5) },
      { id: 14, slotA: win(6), slotB: seed(5) },
      { id: 15, slotA: seed(6), slotB: win(7) },
      { id: 16, slotA: win(8), slotB: seed(1) },
      { id: 17, slotA: lose(8), slotB: lose(9) },
      { id: 18, slotA: lose(10), slotB: lose(7) },
      { id: 19, slotA: lose(6), slotB: lose(11) },
      { id: 20, slotA: lose(12), slotB: lose(5) },
      { id: 21, slotA: lose(4), slotB: lose(13) },
      { id: 22, slotA: lose(14), slotB: lose(3) },
      { id: 23, slotA: lose(2), slotB: lose(15) },
      { id: 24, slotA: lose(16), slotB: lose(1) },
      { id: 25, slotA: win(9), slotB: win(10) },
      { id: 26, slotA: win(11), slotB: win(12) },
      { id: 27, slotA: win(13), slotB: win(14) },
      { id: 28, slotA: win(15), slotB: win(16) },
      { id: 29, slotA: win(23), slotB: win(24) },
      { id: 30, slotA: win(22), slotB: win(21) },
      { id: 31, slotA: win(20), slotB: win(19) },
      { id: 32, slotA: win(17), slotB: win(18) },
      { id: 33, slotA: win(29), slotB: lose(23) },
      { id: 34, slotA: win(30), slotB: lose(26) },
      { id: 35, slotA: win(31), slotB: lose(27) },
      { id: 36, slotA: win(32), slotB: lose(28) },
      { id: 37, slotA: win(25), slotB: win(26) },
      { id: 38, slotA: win(27), slotB: win(28) },
      { id: 39, slotA: win(33), slotB: win(34) },
      { id: 40, slotA: win(35), slotB: win(36) },
      { id: 41, slotA: lose(38), slotB: win(39) },
      { id: 42, slotA: win(40), slotB: lose(37) },
      { id: 43, slotA: win(37), slotB: win(41) },
      { id: 44, slotA: win(38), slotB: win(42) },
      { id: 45, slotA: lose(43), slotB: lose(44) },
      { id: 46, slotA: win(43), slotB: win(44) },
    ],
  },
};

// Buduje pełną listę meczów (ze wzajemnymi powiązaniami "zwycięzca/przegrany
// idzie do meczu X") dla wybranego wariantu systemu brazylijskiego, na
// podstawie listy ID drużyn w kolejności rozstawienia (R1, R2, ... od góry).
export function generateBrazylijskiMatches(seedTeamIds, size) {
  const cfg = BRAZYLIJSKI_CONFIGS[size];
  if (!cfg) return [];

  const uidByCfgId = {};
  const matches = cfg.matches.map((cm) => {
    const id = uid();
    uidByCfgId[cm.id] = id;
    return {
      id, round: "", date: "", time: "", venue: "",
      homeId: null, awayId: null, sets: [],
      bracket: { cfgId: cm.id, roundIndex: 0, nextMatchId: null, nextSlot: null, loserNextMatchId: null, loserNextSlot: null, noBye: true },
    };
  });
  const byUid = {};
  matches.forEach((m) => { byUid[m.id] = m; });

  cfg.matches.forEach((cm) => {
    const match = byUid[uidByCfgId[cm.id]];
    [["home", cm.slotA], ["away", cm.slotB]].forEach(([field, slot]) => {
      if (slot.type === "seed") {
        match[field === "home" ? "homeId" : "awayId"] = seedTeamIds[slot.n] ?? null;
      } else if (slot.type === "winner") {
        const src = byUid[uidByCfgId[slot.m]];
        src.bracket.nextMatchId = match.id;
        src.bracket.nextSlot = field === "home" ? "home" : "away";
      } else if (slot.type === "loser") {
        const src = byUid[uidByCfgId[slot.m]];
        src.bracket.loserNextMatchId = match.id;
        src.bracket.loserNextSlot = field === "home" ? "home" : "away";
      }
    });
  });

  // Głębokość (numer rundy) każdego meczu — najdłuższa ścieżka zależności od
  // meczów rozstawienia — używana wyłącznie do grupowania w kolumny/rundy.
  const byCfgId = {};
  cfg.matches.forEach((cm) => { byCfgId[cm.id] = cm; });
  const depthCache = {};
  function depthOf(cfgId) {
    if (depthCache[cfgId] !== undefined) return depthCache[cfgId];
    depthCache[cfgId] = 0; // zabezpieczenie przed cyklem (nie powinno wystąpić)
    const cm = byCfgId[cfgId];
    let d = 0;
    [cm.slotA, cm.slotB].forEach((slot) => {
      if (slot.type !== "seed") d = Math.max(d, depthOf(slot.m) + 1);
    });
    depthCache[cfgId] = d;
    return d;
  }
  cfg.matches.forEach((cm) => depthOf(cm.id));

  cfg.matches.forEach((cm) => {
    const match = byUid[uidByCfgId[cm.id]];
    match.bracket.roundIndex = depthCache[cm.id];
    if (cm.id === cfg.championId) match.round = "Finał";
    else if (cm.id === cfg.thirdPlaceId) match.round = "Mecz o 3. miejsce";
    else match.round = `Runda ${depthCache[cm.id] + 1}`;
  });

  return matches;
}
