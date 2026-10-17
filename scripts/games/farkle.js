// Diez Mil / Farkle: se tiran seis dados a la vista, se aparta lo que puntúa y se decide entre seguir o plantarse.
// Motor puro en ../engine/farkle.js; aquí el flujo con Foundry. No hay información secreta: el estado es público.
import * as Engine from "../engine/farkle.js";
import * as core from "../core.js";

const { ID, SOCKET, t, esc, getSession, loadFull, saveFull } = core;

const rng = () => CONFIG.Dice.randomUniform();
const diceHtml = dice => dice.map(d => core.dieHtml(d)).join("");
const warn = (S, ix, key) => {
  const j = S.jugadores[ix];
  if (j.type === "gm") ui.notifications.warn(t(key));
  else core.notifyActor(j.actorId, t(key));
};

// Selección de dados de ESTE cliente (no se guarda en la partida); se reinicia sola cuando cambia la mesa.
const sel = { key: "", set: new Set() };
const syncSel = S => {
  const key = `${S.ronda}|${S.turno}|${S.mesa.join("")}|${S.turnoPts}`;
  if (sel.key !== key) { sel.key = key; sel.set = new Set(); }
  return sel.set;
};

function view(S, me) {
  const mine = !!me && S.jugadores[S.turno]?.actorId === me.actorId;
  const set = mine ? syncSel(S) : new Set();
  const chosen = [...set].map(i => S.mesa[i]);
  const selScore = chosen.length ? Engine.scoreSet(chosen) : null;
  const entrada = mine && selScore !== null && (me.enTablero || S.turnoPts + selScore >= S.entrada);
  return {
    isMyTurn: mine,
    turnName: S.jugadores[S.turno]?.name,
    tirar: mine && S.fase === "tirar",
    elegir: mine && S.fase === "elegir",
    mesa: S.mesa.map((v, i) => ({ v, i, selected: set.has(i) })),
    apartados: S.apartados.flat().map(value => ({ value })),
    turnoPts: S.turnoPts,
    dadosLibres: S.dadosLibres,
    selScore, selValid: selScore !== null, canBank: !!entrada,
    meta: S.meta, entrada: S.entrada,
    ultimaVuelta: S.ultimaVuelta != null,
    marcador: S.jugadores.map((p, k) => ({
      name: p.name, puntos: p.puntos, enTablero: p.enTablero, turno: k === S.turno, ultima: k === S.ultimaVuelta,
      pct: Math.min(100, Math.round(100 * p.puntos / S.meta))
    }))
  };
}

export const Farkle = core.registerGame({
  id: "diez-mil",
  title: "QM.game.farkle",
  icon: "fas fa-dice-five",
  hasLives: false,
  trayTemplate: `modules/${ID}/templates/farkle-tray.html`,
  gmTemplate: `modules/${ID}/templates/farkle-tray.html`,

  registerSettings() {
    game.settings.register(ID, "farkleMeta", { scope: "world", config: false, type: Number, default: 10000 });
    game.settings.register(ID, "farkleEntrada", { scope: "world", config: false, type: Number, default: 0 });
  },

  optionsContext() {
    return { farkleMeta: game.settings.get(ID, "farkleMeta"), farkleEntrada500: game.settings.get(ID, "farkleEntrada") === 500 };
  },

  statusRow: j => `<b class="qm-pts">${j.puntos}</b>`,

  // ---------- partida ----------
  async startGame(formData) {
    if (!game.user.isGM) return;
    const meta = Math.max(500, Number(formData["farkle-meta"]) || 10000);
    const entrada = Number(formData["farkle-entrada"]) === 500 ? 500 : 0;
    await game.settings.set(ID, "farkleMeta", meta);
    await game.settings.set(ID, "farkleEntrada", entrada);
    const ante = await core.readAnte(formData);
    const jugadores = core.parsePlayers(formData, 1).map(j => ({ ...j, puntos: 0, enTablero: false }));
    if (jugadores.length < 2) { ui.notifications.warn(t("QM.notify.twoTokensNeeded")); return; }
    const S = {
      game: this.id, jugadores, ronda: 0, turno: null, meta, entrada, ultimaVuelta: null, startDice: 1,
      active: true, ante: 0, pot: 0, payers: [], memoria: {}
    };
    Engine.newTurn(S);
    core.beginGame(this, S, ante);
  },

  intro: S => `<h2 class="qm-msg">${t("QM.farkle.begins")}</h2><p class="qm-msg">${t("QM.farkle.rules", { meta: S.meta })}${S.entrada ? " " + t("QM.farkle.entryRule", { n: S.entrada }) : ""}</p>`,

  async startRound() {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active) return;
    S.ronda = 1;
    Engine.newTurn(S);
    await saveFull(S);
    core.say({ content: `<i class="qm-msg">${t("QM.farkle.turnOf", { name: esc(S.jugadores[S.turno].name) })}</i>` });
    core.say({ content: core.statusHtml(S), flags: { core: { canPopout: true } } });
    core.sendHands(S);
    core.bridge.openGMTray();
    core.promptTurn();
  },

  // ---------- acciones (GM) ----------
  async roll(ix) {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active || S.turno !== ix || S.fase !== "tirar") return;
    const j = S.jugadores[ix];
    let dice = Engine.rollHand(S.dadosLibres, rng);
    let cheated = false;
    if (j.level === "tramposa" && !Engine.hasScoring(dice)) { dice = Engine.rollHand(S.dadosLibres, rng); cheated = true; }
    const lost = S.turnoPts;
    const { farkle } = Engine.applyRoll(S, dice);
    core.playSound("roll.ogg", 0.6);
    await core.say({ content: `<b>${esc(j.name)}</b> ${t("QM.farkle.rolls")} <span class="qm-reveal-row">${diceHtml(dice)}</span>${cheated ? ` <i class="qm-msg">${t("QM.farkle.cheats")}</i>` : ""}` });
    if (!farkle) { await saveFull(S); return core.promptTurn(); }

    await core.say({ content: `<h3 class="qm-msg">${t("QM.farkle.farkle")}</h3><p class="qm-msg"><b>${esc(j.name)}</b> ${lost ? t("QM.farkle.loses", { pts: lost }) : t("QM.farkle.loses0")}</p>` });
    core.playSound("lose.ogg", 0.5);
    await this.passTurn(S);
  },

  async keep(ix, indices, bank) {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active || S.turno !== ix) return;
    const j = S.jugadores[ix];
    const dice = (indices ?? []).map(i => S.mesa[i]);
    const r = Engine.applyKeep(S, indices ?? [], !!bank);
    if (!r.ok) return warn(S, ix, r.error === "entrada" ? "QM.farkle.entryNeeded" : "QM.farkle.invalid");
    let msg = `<b>${esc(j.name)}</b> ${t("QM.farkle.keeps")} <span class="qm-reveal-row">${diceHtml(dice)}</span> <b>+${r.score}</b>`;
    if (r.hot) msg += ` <i class="qm-msg">${t("QM.farkle.hot")}</i>`;
    await core.say({ content: msg });
    if (!bank) { await saveFull(S); return core.promptTurn(); }

    core.playSound("bet.ogg");
    await core.say({ content: `<p class="qm-msg"><b>${esc(j.name)}</b> ${t("QM.farkle.banks", { pts: r.banked, total: j.puntos })}</p>` });
    if (S.ultimaVuelta === ix) await core.say({ content: `<h3 class="qm-msg">${t("QM.farkle.lastRound")}</h3><p class="qm-msg">${t("QM.farkle.reached", { name: esc(j.name), meta: S.meta })}</p>` });
    await this.passTurn(S);
  },

  /** Pasa el turno (o cierra la partida tras la última vuelta) y guarda. */
  async passTurn(S) {
    const end = Engine.endTurn(S);
    if (end.ended) return core.finishGame(S, end.winner);
    S.ronda++;
    await saveFull(S);
    core.say({ content: `<i class="qm-msg">${t("QM.farkle.turnOf", { name: esc(S.jugadores[S.turno].name) })}</i>` });
    core.promptTurn();
  },

  aiPlay() {
    const S = loadFull();
    if (!S?.active) return;
    const j = S.jugadores[S.turno];
    const a = Engine.decide(S, j);
    core.speak(j, a.type === "keep" && a.bank ? "lie" : "bet");
    if (a.type === "roll") this.roll(S.turno);
    else this.keep(S.turno, a.indices, a.bank);
  },

  /** GM, tras validar dueño y turno. */
  onPlayerAction(S, ix, action, payload) {
    if (action === "roll") this.roll(ix);
    if (action === "keep") this.keep(ix, payload.indices, payload.bank);
  },

  /** Botón pulsado en una bandeja (jugador o GM). */
  onTrayAction(action, ix, { gm, target }) {
    const S = getSession();
    if (action === "pick") {
      const set = syncSel(S);
      const i = Number(target?.dataset.i);
      if (set.has(i)) set.delete(i); else set.add(i);
      return core.bridge.refresh();
    }
    let payload = { action: "roll", callerIx: ix };
    if (action === "keep" || action === "bank") {
      const set = syncSel(S);
      if (!set.size) return ui.notifications.warn(t("QM.farkle.pickHint"));
      payload = { action: "keep", callerIx: ix, indices: [...set], bank: action === "bank" };
    }
    if (gm) return this.onPlayerAction(null, ix, payload.action, payload);
    game.socket.emit(SOCKET, { type: "PLAYER_ACTION", payload });
  },

  // ---------- contexto de las bandejas ----------
  trayContext(S, me) { return { player: { ...me }, ...view(S, me) }; },

  gmContext(S) {
    const gmActor = S.jugadores.find(p => p.type === "gm");
    return { gmActor, ...view(S, gmActor) };
  }
});
