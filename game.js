// Protocol Arena: does a cheap habit you skip cost more than a pricey one you keep?
// Deterministic 52-week adherence-cost simulation. Logic is DOM-free; the page
// calls runDuel(). Model is deliberately simple: fixed costs accrue whether or
// not you show up, variable costs only on completed sessions.
"use strict";

function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

var DUELS = {
  sauna: {
    label: "Home sauna vs gym lounge",
    home: { name: "Home sauna", fixed: 700.00, per: 1.20, adherence: 0.78,
            note: "one-time unit plus electricity per session" },
    away: { name: "Gym lounge", fixed: 696.00, per: 7.00, adherence: 0.55,
            note: "58 per month all year, plus towel and drop-in fees" }
  },
  bike: {
    label: "Spin bike vs studio classes",
    home: { name: "Spin bike", fixed: 900.00, per: 0.40, adherence: 0.72,
            note: "one-time bike, pennies of power per ride" },
    away: { name: "Studio classes", fixed: 540.00, per: 19.00, adherence: 0.60,
            note: "45 per month plan, 19 per booked class" }
  },
  rack: {
    label: "Home rack vs big-box gym",
    home: { name: "Home rack", fixed: 450.00, per: 0.00, adherence: 0.70,
            note: "one-time rack and bar, no session cost" },
    away: { name: "Big-box gym", fixed: 288.00, per: 3.00, adherence: 0.52,
            note: "24 per month, 3 of commute per visit" }
  }
};

var WEEKS = 52;
var PER_WEEK = 3;
var SLOTS = WEEKS * PER_WEEK;

function simulate(lane, seed) {
  var rnd = mulberry32(seed);
  var spend = lane.fixed;
  var completed = 0;
  for (var i = 0; i < SLOTS; i++) {
    if (rnd() < lane.adherence) {
      completed++;
      spend += lane.per;
    }
  }
  var costPer = completed > 0 ? spend / completed : Infinity;
  return {
    name: lane.name,
    note: lane.note,
    spend: Math.round(spend * 100) / 100,
    completed: completed,
    missed: SLOTS - completed,
    costPer: Math.round(costPer * 100) / 100
  };
}

function runDuel(key, seed) {
  var duel = DUELS[key];
  if (!duel) return null;
  var home = simulate(duel.home, seed);
  var away = simulate(duel.away, seed + 1);
  var verdict;
  if (home.costPer === away.costPer) {
    verdict = "Dead heat on cost per completed session.";
  } else if (home.costPer < away.costPer) {
    verdict = home.name + " wins: " + money(home.costPer) +
      " per completed session versus " + money(away.costPer) + ".";
  } else {
    verdict = away.name + " wins: " + money(away.costPer) +
      " per completed session versus " + money(home.costPer) + ".";
  }
  return { label: duel.label, home: home, away: away, verdict: verdict };
}

function money(n) {
  if (!isFinite(n)) return "no sessions";
  return "$" + n.toFixed(2);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DUELS: DUELS, simulate: simulate, runDuel: runDuel,
                     money: money, SLOTS: SLOTS };
}
