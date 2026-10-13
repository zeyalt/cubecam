import { cfop } from "@moishy/cfop";
import { createDefaultMoveCostModel } from "@moishy/cubing-core";

// White cross on the bottom: z2 puts white down, then any of the four sides in front.
const WHITE_BOTTOM = [[["z", 2]], [["z", 2], ["y", 1]], [["z", 2], ["y", 2]], [["z", 2], ["y", 3]]]
  .map(seq => seq.map(([family, amount]) => ({ family, amount })));

// Prefer plain face turns: make slice, wide and rotation moves expensive for the solver.
const base = createDefaultMoveCostModel();
const costModel = { cost(m, ctx) {
  const c = base.cost(m, ctx);
  if ("MSE".includes(m.family) || /^[a-z]$/.test(m.family) && !"xyz".includes(m.family)) return c + 3;
  if ("xyz".includes(m.family)) return c + 1;
  return c;
} };

// Rewrite everything as outer-face turns, absorbing the implied cube rotations.
const OPP = { U: "D", D: "U", R: "L", L: "R", F: "B", B: "F" };
const ROT = { // rotation that turns like this face: new[logical] = old[source]
  R: { U: "F", F: "D", D: "B", B: "U" }, U: { F: "R", R: "B", B: "L", L: "F" }, F: { U: "L", L: "D", D: "R", R: "U" },
};
function rotate(frame, likeFace, amount) {
  let axis = likeFace, n = amount;
  if (!ROT[axis]) { axis = OPP[axis]; n = (4 - n) % 4; }
  for (let i = 0; i < n; i++) { const f = { ...frame }; for (const [to, from] of Object.entries(ROT[axis])) f[to] = frame[from]; frame = f; }
  return frame;
}
const sfx = a => (a === 2 ? "2" : a === 3 ? "'" : "");
function flatten(moves, frame) {
  const out = [];
  const face = (f, a) => { a = ((a % 4) + 4) % 4; if (a) out.push([frame[f], a]); };
  for (const { family: fam, amount: a } of moves) {
    if (OPP[fam]) face(fam, a);
    else if ("xyz".includes(fam)) frame = rotate(frame, { x: "R", y: "U", z: "F" }[fam], a);
    else if (fam === "M") { face("R", a); face("L", -a); frame = rotate(frame, "L", a); }
    else if (fam === "E") { face("U", a); face("D", -a); frame = rotate(frame, "D", a); }
    else if (fam === "S") { face("F", -a); face("B", a); frame = rotate(frame, "F", a); }
    else { const X = fam.toUpperCase(); face(OPP[X], a); frame = rotate(frame, X, a); }
  }
  // merge repeated turns of the same face
  const merged = [];
  for (const [f, a] of out) {
    const last = merged[merged.length - 1];
    if (last && last[0] === f) { last[1] = (last[1] + a) % 4; if (!last[1]) merged.pop(); } else merged.push([f, a]);
  }
  return { moves: merged.map(([f, a]) => f + sfx(a)), frame };
}

self.onmessage = async e => {
  try {
    const r = await cfop.solve(e.data.scramble, { colorNeutrality: WHITE_BOTTOM, moveCostModel: costModel });
    let frame = { U: "U", D: "D", R: "R", L: "L", F: "F", B: "B" };
    const segments = [], all = [];
    for (const s of r.segments) { const f = flatten(s.moves, frame); frame = f.frame; segments.push({ id: s.unitId, n: f.moves.length }); all.push(...f.moves); }
    const orientation = r.orientation.map(m => m.family + sfx(m.amount)).join(" ");
    self.postMessage({ ok: true, orientation, solution: all.join(" "), segments });
  } catch (err) { self.postMessage({ ok: false, error: String((err && err.message) || err) }); }
};
