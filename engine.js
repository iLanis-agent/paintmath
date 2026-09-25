/* PaintMath engine - paint quantity and cost-minimizing can combos. Pure math, no DOM. */
(function (root) {
  'use strict';

  const DOOR_M2 = 1.9, WINDOW_M2 = 1.5;

  function num(v, name) {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    if (typeof n !== 'number' || !isFinite(n) || isNaN(n)) throw new Error(name + ' must be a number');
    return n;
  }

  function plan(o) {
    if (!o || typeof o !== 'object') throw new Error('options required');
    const length = num(o.length, 'length'), width = num(o.width, 'width'), height = o.height === undefined ? 2.6 : num(o.height, 'height');
    const doors = o.doors === undefined ? 1 : num(o.doors, 'doors');
    const windows = o.windows === undefined ? 1 : num(o.windows, 'windows');
    const coats = o.coats === undefined ? 2 : num(o.coats, 'coats');
    const coverage = o.coverage === undefined ? 10 : num(o.coverage, 'coverage');
    const wastePct = o.wastePct === undefined ? 10 : num(o.wastePct, 'wastePct');
    const ceiling = !!o.ceiling;

    for (const [v, n, lo, hi] of [[length, 'length', 0.5, 40], [width, 'width', 0.5, 40], [height, 'height', 1.5, 6]]) {
      if (v < lo || v > hi) throw new Error(n + ' must be in [' + lo + ', ' + hi + ']');
    }
    if (doors < 0 || doors > 20 || windows < 0 || windows > 40 || doors % 1 || windows % 1) throw new Error('doors/windows must be whole numbers in range');
    if (coats < 1 || coats > 5 || coats % 1) throw new Error('coats must be a whole number 1-5');
    if (coverage <= 0 || coverage > 30) throw new Error('coverage must be in (0, 30]');
    if (wastePct < 0 || wastePct > 100) throw new Error('wastePct must be in [0, 100]');

    const wallArea = 2 * (length + width) * height;
    const openings = doors * DOOR_M2 + windows * WINDOW_M2;
    const ceilingArea = ceiling ? length * width : 0;
    const netArea = Math.max(0, wallArea - openings) + ceilingArea;
    const liters = netArea * coats * (1 + wastePct / 100) / coverage;

    const result = {
      wallArea: round2(wallArea), openingsArea: round2(openings), ceilingArea: round2(ceilingArea),
      netArea: round2(netArea), liters: round2(liters)
    };

    if (Array.isArray(o.canSizes) && o.canSizes.length) {
      if (o.canSizes.length > 4) throw new Error('at most 4 can sizes');
      const sizes = o.canSizes.map(function (c, i) {
        const size = num(c.size, 'can ' + (i + 1) + ' size');
        const price = num(c.price, 'can ' + (i + 1) + ' price');
        if (size <= 0 || size > 25) throw new Error('can size must be in (0, 25]');
        if (price <= 0 || price > 10000) throw new Error('can price must be in (0, 10000]');
        return { size: size, price: price };
      });
      result.combo = bestCombo(liters, sizes);
      result.totalCost = round2(result.combo.cost);
      result.boughtLiters = round2(result.combo.volume);
      result.leftoverLiters = round2(result.combo.volume - liters);
      result.costPerM2 = netArea > 0 ? round2(result.combo.cost / netArea) : null;
    }
    return result;
  }

  function round2(x) { return Math.round(x * 100) / 100; }

  // DP over 0.25L units: min cost to reach at least `liters`.
  function bestCombo(liters, sizes) {
    const unit = 0.25;
    const scaled = sizes.map(function (s) { return { u: Math.max(1, Math.round(s.size / unit)), price: s.price, size: s.size }; });
    const target = Math.ceil(liters / unit);
    const maxU = target + Math.max.apply(null, scaled.map(function (s) { return s.u; }));
    const INF = Infinity;
    const dp = new Array(maxU + 1).fill(INF);
    const pick = new Array(maxU + 1).fill(-1);
    dp[0] = 0;
    for (let v = 0; v <= maxU; v++) {
      if (dp[v] === INF) continue;
      for (let i = 0; i < scaled.length; i++) {
        const nv = Math.min(maxU, v + scaled[i].u);
        const nc = dp[v] + scaled[i].price;
        if (nc < dp[nv]) { dp[nv] = nc; pick[nv] = i; }
      }
    }
    // cheapest state covering at least target
    let best = -1;
    for (let v = target; v <= maxU; v++) {
      if (dp[v] === INF) continue;
      if (best === -1 || dp[v] < dp[best] || (dp[v] === dp[best] && v < best)) best = v;
    }
    if (best === -1) throw new Error('no combination found');
    const counts = new Array(sizes.length).fill(0);
    let v = best;
    while (v > 0) {
      const i = pick[v];
      if (i < 0) break;
      counts[i]++;
      v = Math.max(0, v - scaled[i].u);
    }
    const cans = {};
    let volume = 0, cost = 0;
    sizes.forEach(function (s, i) {
      if (counts[i] > 0) cans[s.size] = counts[i];
      volume += counts[i] * s.size;
      cost += counts[i] * s.price;
    });
    return { cans: cans, volume: volume, cost: cost };
  }

  const api = { plan: plan, bestCombo: bestCombo, DOOR_M2: DOOR_M2, WINDOW_M2: WINDOW_M2 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PaintMathEngine = api;
})(typeof self !== 'undefined' ? self : this);
