// Dado del Mentiroso (Perudo / Dudo). Motor puro en ../engine/liars-dice.js; aquí el flujo con Foundry.
import * as Engine from "../engine/liars-dice.js";
import * as core from "../core.js";

const { ID, SOCKET, t, esc, getSession, loadFull, saveFull, diceData } = core;
const { DialogV2 } = foundry.applications.api;

const betView = S => S?.apuesta ? { ...S.apuesta, wild: S.apuesta.valor === 1 && !!S.onesWild } : null;

/** Manos de toda la mesa para el chat de revelación; resalta los dados que cuentan para `valor`. */
function revealHands(S, valor) {
  const wild = Engine.useWilds(S) && valor !== 1;
  return `<div class="qm-reveal">` + S.jugadores.map(j => {
    const dice = j.dados.map(d => core.dieHtml(d, { hit: d === valor || (wild && d === 1), wild: d === 1 && !!S.onesWild })).join("");
    return `<div class="qm-reveal-row"><b>${esc(j.name)}</b> ${dice}</div>`;
  }).join("") + `</div>`;
}

export const LiarsDice = core.registerGame({
  id: "liars-dice",
  title: "QM.game.liars",
  icon: "fas fa-dice",
  lifeSymbol: "●",
  trayTemplate: `modules/${ID}/templates/dice-tray.html`,
  gmTemplate: `modules/${ID}/templates/gm-dice-tray.html`,

  registerSettings() {
    game.settings.register(ID, "startDice", { scope: "world", config: false, type: Number, default: 5 });
    game.settings.register(ID, "onesWild", { scope: "world", config: false, type: Boolean, default: true });
    game.settings.register(ID, "palificoRule", { scope: "world", config: false, type: Boolean, default: false });
    game.settings.register(ID, "spotOnRule", { scope: "world", config: false, type: String, default: "casa" });
    game.settings.register(ID, "palificoMode", { scope: "world", config: false, type: String, default: "casa" });
  },

  optionsContext() {
    return {
      startDice: game.settings.get(ID, "startDice"),
      onesWild: game.settings.get(ID, "onesWild"),
      palificoRule: game.settings.get(ID, "palificoRule"),
      spotOnClasica: game.settings.get(ID, "spotOnRule") === "clasica",
      palificoClasico: game.settings.get(ID, "palificoMode") === "clasica"
    };
  },

  // ---------- partida ----------
  async startGame(formData) {
    if (!game.user.isGM) return;
    const startDice = Number(formData["start-dice"]) || 5;
    const onesWild = !!formData["qm-ones-wild"];
    const palificoRule = !!formData["qm-palifico-rule"];
    const spotOnRule = formData["qm-spoton-rule"] === "clasica" ? "clasica" : "casa";
    const palificoMode = formData["qm-palifico-mode"] === "clasica" ? "clasica" : "casa";
    await game.settings.set(ID, "startDice", startDice);
    await game.settings.set(ID, "onesWild", onesWild);
    await game.settings.set(ID, "palificoRule", palificoRule);
    await game.settings.set(ID, "spotOnRule", spotOnRule);
    await game.settings.set(ID, "palificoMode", palificoMode);
    const ante = await core.readAnte(formData);

    const jugadores = core.parsePlayers(formData, startDice);
    if (jugadores.length < 2) { ui.notifications.warn(t("QM.notify.twoTokensNeeded")); return; }
    const S = {
      game: this.id, jugadores, ronda: 0, turno: null, apuesta: null, onesWild, palificoRule, palificoMode, spotOnRule, startDice,
      active: true, isPalificoRound: false, ante: 0, pot: 0, payers: [], memoria: {}
    };
    core.beginGame(this, S, ante);
  },

  intro: S => `<h2 class="qm-msg">${t("QM.chat.gameStarts")}</h2><p class="qm-msg">${S.onesWild ? t("QM.chat.wildRule") : t("QM.chat.noWildRule")}</p>`,

  async startRound() {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active) return;
    core.playSound("roll.ogg", 0.6);

    for (const j of S.jugadores) {
      await core.setDefeated(j.actorId, false);
      j.dados = Engine.rollHand(j.dadosRestantes, () => CONFIG.Dice.randomUniform());
    }

    S.totalDados = S.jugadores.reduce((n, j) => n + j.dadosRestantes, 0);
    S.turno = S.turno ?? 0;
    S.apuesta = null;
    S.ronda++;
    S.isPalificoRound = Engine.isPalificoRound(S);
    await saveFull(S);

    if (S.isPalificoRound) core.say({ content: `<h3 class="qm-msg">${t("QM.chat.palificoAnnounce")}</h3>` });
    core.say({ content: `<i class="qm-msg">${t("QM.chat.roundStarts", { round: S.ronda, name: esc(S.jugadores[S.turno].name) })}</i>` });
    core.say({ content: core.statusHtml(S), flags: { core: { canPopout: true } } });

    core.sendHands(S);
    core.bridge.openGMTray();
    core.promptTurn();
  },

  aiPlay() {
    const S = loadFull();
    if (!S?.active) return;
    const j = S.jugadores[S.turno];
    const a = Engine.decide(S, j);
    core.speak(j, a.type === "lie" ? "lie" : "bet");
    if (a.type === "lie") this.resolveLie(S.turno);
    else this.registerBet({ cantidad: a.cantidad, valor: a.valor, jugadorIx: S.turno });
  },

  // ---------- acciones ----------
  async promptRaise(ix) {
    const S = getSession();
    const player = S.jugadores[ix];
    const p = S.apuesta;
    const minC = p ? p.cantidad : 1;
    const locked = S.isPalificoRound && p;
    const defV = locked ? p.valor : Math.min(6, p ? p.valor + 1 : 1);
    const content = `<label>${t("QM.dialog.quantityLabel", { min: minC, max: S.totalDados })}:` +
      `<input name="c" type="number" value="${minC}" min="${minC}" max="${S.totalDados}"></label>` +
      `<label>${t("QM.dialog.valueLabel")}:<input name="v" type="number" value="${defV}" min="1" max="6" ${locked ? "disabled" : ""}></label>`;
    const bet = await DialogV2.prompt({
      window: { title: t("QM.dialog.betTitle", { name: player.name }) },
      classes: ["qm-dialog"],
      content,
      rejectClose: false,
      ok: {
        label: t("QM.dialog.raiseButton"),
        icon: "fas fa-check",
        callback: (event, button) => ({ cantidad: +button.form.elements.c.value, valor: +button.form.elements.v.value })
      }
    });
    if (!bet) return;
    const betData = { ...bet, jugadorIx: ix };
    if (game.user.isGM) this.registerBet(betData);
    else game.socket.emit(SOCKET, { type: "PLAYER_ACTION", payload: { action: "registerBet", callerIx: ix, betData } });
  },

  async registerBet({ cantidad, valor, jugadorIx }) {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active || jugadorIx !== S.turno) return;
    if (!Engine.isValidBet(S, { cantidad, valor })) {
      const msg = t("QM.notify.invalidBet");
      const j = S.jugadores[jugadorIx];
      if (j.type === "gm") ui.notifications.warn(msg);
      else core.notifyActor(j.actorId, msg);
      return;
    }
    S.apuesta = { cantidad, valor, jugadorIx };
    S.turno = (jugadorIx + 1) % S.jugadores.length;
    await saveFull(S);
    core.playSound("bet.ogg");
    core.say({ content: `<b>${esc(S.jugadores[jugadorIx].name)}</b> ${t("QM.chat.bets", { cantidad, valor })}` });
    core.promptTurn();
  },

  async resolveLie(callerIx) {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active || !S.apuesta) return;
    core.playSound("lie.ogg");
    const p = S.apuesta;
    const { total, isLiar, loserIx } = Engine.resolveLie(S, callerIx);
    Engine.recordReveal(S, p.jugadorIx, isLiar);
    const loser = S.jugadores[loserIx];
    const wild = Engine.useWilds(S) && p.valor !== 1 ? ` ${t("QM.chat.wildsIncluded")}` : "";

    await core.say({
      content: `<h3 class="qm-msg">${t("QM.chat.revealTitle")}</h3>${revealHands(S, p.valor)}` +
        `<p class="qm-msg">${t("QM.chat.revealResult", { total, value: p.valor, wild })}</p>` +
        `<p class="qm-msg"><b>${esc(loser.name)}</b> ${t("QM.chat.losesDie", { count: 1, remaining: Math.max(0, loser.dadosRestantes - 1) })}</p>`
    });
    S.apuesta = null;
    await saveFull(S);
    core.playSound("lose.ogg", 0.5);
    core.resolveRound(loserIx, 1);
  },

  async resolveSpotOn(callerIx) {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active || !S.apuesta) return;
    core.playSound("spoton.ogg");
    const p = S.apuesta;
    const caller = S.jugadores[callerIx];
    const { total, correct, loserIxs, gainIx, diceLost } = Engine.resolveSpotOn(S, callerIx);
    const classic = S.spotOnRule === "clasica";
    const wild = Engine.useWilds(S) && p.valor !== 1 ? ` ${t("QM.chat.wildsIncluded")}` : "";
    const verdict = correct
      ? t(classic ? "QM.chat.spotOnSuccessClassic" : "QM.chat.spotOnSuccess")
      : t(classic ? "QM.chat.spotOnFailClassic" : "QM.chat.spotOnFail");

    await core.say({
      content: `<h3 class="qm-msg">${t("QM.chat.spotOnCalled", { name: esc(caller.name) })}</h3>${revealHands(S, p.valor)}` +
        `<p class="qm-msg">${t("QM.chat.revealResult", { total, value: p.valor, wild })}</p>` +
        `<p class="qm-msg"><b>${esc(caller.name)}</b> ${verdict}</p>`
    });
    S.apuesta = null;
    if (gainIx != null) {
      Engine.applyGain(S, gainIx);
      await saveFull(S);
      window.setTimeout(() => this.startRound(), 3000);
      return;
    }
    await saveFull(S);
    core.playSound("lose.ogg", 0.5);
    core.resolveRound(loserIxs, diceLost);
  },

  /** GM, tras validar dueño y turno. */
  onPlayerAction(S, ix, action, payload) {
    if (action === "lie") this.resolveLie(ix);
    if (action === "spoton") this.resolveSpotOn(ix);
    if (action === "registerBet") this.registerBet(payload.betData);
  },

  /** Botón pulsado en una bandeja (jugador o GM). */
  onTrayAction(action, ix, { gm }) {
    if (action === "raise") return this.promptRaise(ix);
    if (gm) return action === "lie" ? this.resolveLie(ix) : this.resolveSpotOn(ix);
    game.socket.emit(SOCKET, { type: "PLAYER_ACTION", payload: { action, callerIx: ix } });
  },

  // ---------- contexto de las bandejas ----------
  trayContext(S, me, hands) {
    const ctx = {
      player: { ...me, diceData: diceData(hands.own[me.actorId], S) },
      isMyTurn: S.jugadores[S.turno]?.actorId === me.actorId,
      bet: betView(S)
    };
    if (me.isCheater && hands.all) ctx.allPlayersData = S.jugadores.map(p => ({ ...p, diceData: diceData(hands.all[p.actorId], S) }));
    return ctx;
  },

  gmContext(S) {
    const gmAsPlayer = game.settings.get(ID, "gmAsPlayer");
    const gmActor = S.jugadores.find(p => p.type === "gm");
    const shown = gmAsPlayer && gmActor ? [gmActor] : S.jugadores;
    return {
      gmActor, gmAsPlayer,
      isMyTurn: gmActor ? S.jugadores[S.turno]?.actorId === gmActor.actorId : false,
      players: shown.map(p => ({ ...p, diceData: diceData(p.dados, S) })),
      bet: betView(S)
    };
  }
});
