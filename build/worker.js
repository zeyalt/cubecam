import { cfop } from "@moishy/cfop";
const fmt = ms => (ms || []).map(m => m.family + (m.amount === 3 ? "'" : m.amount === 2 ? "2" : "")).join(" ");
self.onmessage = async e => {
  try {
    const r = await cfop.solve(e.data.scramble);
    self.postMessage({ ok: true, orientation: fmt(r.orientation), solution: r.solutionString, segments: r.segments.map(s => ({ id: s.unitId, n: s.moves.length })) });
  } catch (err) { self.postMessage({ ok: false, error: String((err && err.message) || err) }); }
};
