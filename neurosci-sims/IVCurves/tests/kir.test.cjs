// Run with Node: node tests/kir.test.cjs
// Benchmarks for the published Ishihara & Ehara steady-state spermine fit.
const assert = require('node:assert/strict');
const model = require('../model.js');
const near = (a, b, tolerance = 1e-12) => assert(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

// At zero driving voltage, the two published Kd values are 0.7 and 40 µM.
near(model.kirBlock(0, 0), 0.19941520467836257);
// The 2004 Discussion reports approximately 0.16 nM and 0.49 µM at +40 mV.
near(model.kirParameters.highKd * Math.exp(-40 / model.kirParameters.highSlope), 0.00016, 0.00001);
near(model.kirParameters.lowKd * Math.exp(-40 / model.kirParameters.lowSlope), 0.49, 0.01);
// No spermine restores the unblocked conductance. Increasing spermine suppresses it.
for (let u = -220; u <= 220; u += 2) {
  near(model.kirBlock(u, 0, 0), 1);
  const fraction = model.kirBlock(u, 0);
  assert(fraction >= 0 && fraction <= 1);
  assert(fraction >= model.kirBlock(u + 1, 0));
  assert(model.kirBlock(u, 0, 1) >= fraction);
  near(model.kirBlock(u - 90, -90), fraction);
}
const p = {hold: -80, duration: 20, measure: 'peak'};
const c = {channel: 'Kir', g: 10, e: -90};
assert.equal(model.sweep(p, c, -90).measured, 0);
assert(model.sweep(p, c, -120).measured < 0);
assert(model.sweep(p, c, -70).measured > 0);
assert(model.sweep(p, c, -70).measured > model.sweep(p, c, 0).measured);
for (const v of [-120, -90, -70, 0, 100]) {
  const sweep = model.sweep(p, c, v);
  assert(sweep.values.every(Number.isFinite));
  near(sweep.measured, model.sweep({...p, measure: 'end'}, c, v).measured);
  near(model.sweep(p, {...c, g: 20}, v).measured, 2 * sweep.measured);
}
console.log('Kir published-parameter benchmarks, limits, reversal, rectification and sweep checks passed.');
