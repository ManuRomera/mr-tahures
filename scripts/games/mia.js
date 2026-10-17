// Mia / Meyer (Mäxle): dos dados bajo el cubilete, se anuncia (a veces mintiendo) algo mayor que lo anterior.
// Motor puro en ../engine/mia.js; aquí el flujo con Foundry. Vidas = dadosRestantes.
import * as Engine from "../engine/mia.js";
import * as core from "../core.js";

const { ID, SOCKET, t, esc, getSession, loadFull, saveFull } = core;
const { DialogV2 } = foundry.applications.api;

const plain = dados => (dados ?? []).map(value => ({ value }));
const label = c => c === Engine.MIA ? t("QM.mia.mia") : Engine.isDouble(c) ? t("QM.mia.double", { n: c[0] }) : `${c[0]}-${c[1]}`;
const diceImgs = dice => dice.map(d => core.dieHtml(d)).join("");
const rng = () => CONFIG.Dice.randomUniform();
const warnInvalid = (S, ix) => {
  const j = S.jugadores[ix];
  if (j.type === "gm") ui.notifications.warn(t("QM.mia.invalid"));
  else core.notifyActor(j.actorId, t("QM.mia.invalid"));
};

function announcedView(S) {
  const a = S.anuncio;
  return a && { label: label(a.codigo), by: S.jugadores[a.jugadorIx]?.name, diceData: plain(Engine.diceFromCode(a.codigo)) };
}

export const Mia = core.registerGame({
  id: "mia",
  title: "QM.game.mia",
  icon: "fas fa-dice-two",
  lifeSymbol: "●",
  trayTemplate: `modules/${ID}/templates/mia-tray.html`,
  gmTemplate: `modules/${ID}/templates/mia-gm-tray.html`,

  registerSettings() {
    game.settings.register(ID, "miaLives", { scope: "world", config: false, type: Number, default: 3 });
  },

  optionsContext() {
    return { lives: game.settings.get(ID, "miaLives") };
  },

  // ---------- partida ----------
  async startGame(formData) {
    if (!game.user.isGM) return;
    const lives = Math.max(1, Number(formData["mia-lives"]) || 3);
    await game.settings.set(ID, "miaLives", lives);
    const ante = await core.readAnte(formData);
    const jugadores = core.parsePlayers(formData, lives);
    if (jugadores.length < 2) { ui.notifications.warn(t("QM.notify.twoTokensNeeded")); return; }
    const S = {
      game: this.id, jugadores, ronda: 0, turno: null, fase: null, anuncio: null, startDice: lives,
      active: true, ante: 0, pot: 0, payers: [], memoria: {}
    };
    core.beginGame(this, S, ante);
  },

  intro: S => `<h2 class="qm-msg">${t("QM.mia.begins")}</h2><p class="qm-msg">${t("QM.mia.rules", { lives: S.startDice })}</p>`,

  async startRound() {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active) return;
    core.playSound("roll.ogg", 0.6);
    for (const j of S.jugadores) { await core.setDefeated(j.actorId, false); j.dados = []; }
    S.ronda++;
    S.turno = S.turno ?? 0;
    S.anuncio = null;
    S.fase = "anunciar";
    S.jugadores[S.turno].dados = Engine.rollHand(2, rng);
    await saveFull(S);

    core.say({ content: `<i class="qm-msg">${t("QM.chat.roundStarts", { round: S.ronda, name: esc(S.jugadores[S.turno].name) })}</i>` });
    core.say({ content: core.statusHtml(S), flags: { core: { canPopout: true } } });
    core.sendHands(S);
    core.bridge.openGMTray();
    core.promptTurn();
  },

  // ---------- acciones (GM) ----------
  async announce(ix, codigo) {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active || S.turno !== ix || !Engine.isValidAnnouncement(S, codigo)) { if (S?.active) warnInvalid(S, ix); return; }
    S.anuncio = { codigo, jugadorIx: ix };
    S.turno = (ix + 1) % S.jugadores.length;
    S.fase = "decidir";
    await saveFull(S);
    core.playSound("bet.ogg");
    core.say({ content: `<b>${esc(S.jugadores[ix].name)}</b> ${t("QM.mia.announces", { label: label(codigo) })}` });
    core.promptTurn();
  },

  async accept(ix) {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active || S.turno !== ix || !Engine.canAccept(S)) return;
    S.jugadores.forEach(j => { j.dados = []; });
    S.jugadores[ix].dados = Engine.rollHand(2, rng);
    S.fase = "anunciar";
    await saveFull(S);
    core.playSound("roll.ogg", 0.6);
    core.say({ content: `<b>${esc(S.jugadores[ix].name)}</b> ${t("QM.mia.accepts")}` });
    core.sendHands(S);
    core.promptTurn();
  },

  async doubt(ix) {
    if (!game.user.isGM) return;
    const S = loadFull();
    if (!S?.active || S.turno !== ix || S.fase !== "decidir") return;
    core.playSound("lie.ogg");
    const a = S.anuncio;
    const { real, honest, loserIx, lives } = Engine.resolveDoubt(S, ix);
    Engine.recordReveal(S, a.jugadorIx, !honest);
    const announcer = S.jugadores[a.jugadorIx];
    const loser = S.jugadores[loserIx];

    await core.say({
      content: `<h3 class="qm-msg">${t("QM.mia.reveal")}</h3><div class="qm-cup up" aria-hidden="true"></div>` +
        `<p class="qm-msg"><b>${esc(announcer.name)}</b> ${t("QM.mia.announces", { label: label(a.codigo) })}</p>` +
        `<div class="qm-reveal qm-mia-reveal"><div class="qm-reveal-row">${diceImgs(Engine.diceFromCode(real))} <b>${label(real)}</b></div></div>` +
        `<p class="qm-msg">${honest ? t("QM.mia.truth") : t("QM.mia.lie")}</p>` +
        `<p class="qm-msg"><b>${esc(loser.name)}</b> ${t("QM.mia.losesLives", { n: lives, rest: Math.max(0, loser.dadosRestantes - lives) })}</p>`
    });
    S.anuncio = null;
    S.fase = null;
    await saveFull(S);
    core.playSound("lose.ogg", 0.5);
    core.resolveRound(loserIx, lives);
  },

  aiPlay() {
    const S = loadFull();
    if (!S?.active) return;
    const j = S.jugadores[S.turno];
    const a = Engine.decide(S, j);
    core.speak(j, a.type === "doubt" ? "lie" : "bet");
    if (a.type === "doubt") this.doubt(S.turno);
    else if (a.type === "accept") this.accept(S.turno);
    else this.announce(S.turno, a.codigo);
  },

  /** GM, tras validar dueño y turno. */
  onPlayerAction(S, ix, action, payload) {
    if (action === "doubt") this.doubt(ix);
    if (action === "accept") this.accept(ix);
    if (action === "announce") this.announce(ix, payload.codigo);
  },

  /** Diálogo para elegir qué anunciar (las opciones son solo las válidas; la tirada propia va marcada). */
  async promptAnnounce(ix) {
    const S = getSession();
    const j = S.jugadores[ix];
    const own = game.user.isGM ? loadFull().jugadores[ix].dados : core.hands.own[j.actorId];
    const real = own?.length ? Engine.codeFromDice(own) : null;
    const valid = Engine.validAnnouncements(S.anuncio?.codigo);
    const def = valid.includes(real) ? real : valid[0];
    const options = valid.map(c => `<option value="${c}" ${c === def ? "selected" : ""}>${label(c)}${c === real ? " ★" : ""}</option>`).join("");
    return DialogV2.prompt({
      window: { title: t("QM.mia.announceTitle", { name: j.name }) },
      classes: ["qm-dialog"],
      content: `<label>${t("QM.mia.announceLabel")}<select name="codigo">${options}</select></label><p class="qm-option-hint">${t("QM.mia.announceHint")}</p>`,
      rejectClose: false,
      ok: { label: t("QM.mia.announce"), icon: "fas fa-check", callback: (event, button) => button.form.elements.codigo.value }
    });
  },

  async onTrayAction(action, ix, { gm }) {
    const payload = { action, callerIx: ix };
    if (action === "announce") {
      payload.codigo = await this.promptAnnounce(ix);
      if (!payload.codigo) return;
    }
    if (gm) return this.onPlayerAction(null, ix, action, payload);
    game.socket.emit(SOCKET, { type: "PLAYER_ACTION", payload });
  },

  // ---------- contexto de las bandejas ----------
  trayContext(S, me, hands) {
    const isMyTurn = S.jugadores[S.turno]?.actorId === me.actorId;
    const ctx = {
      player: { ...me, diceData: plain(hands.own[me.actorId]) },
      isMyTurn,
      announced: announcedView(S),
      canAnnounce: isMyTurn && S.fase === "anunciar",
      canDoubt: isMyTurn && S.fase === "decidir",
      canAccept: isMyTurn && Engine.canAccept(S)
    };
    if (me.isCheater && hands.all) ctx.allPlayersData = S.jugadores.map(p => ({ ...p, diceData: plain(hands.all[p.actorId]) }));
    return ctx;
  },

  gmContext(S) {
    const gmAsPlayer = game.settings.get(ID, "gmAsPlayer");
    const gmActor = S.jugadores.find(p => p.type === "gm");
    const shown = gmAsPlayer && gmActor ? [gmActor] : S.jugadores;
    const isMyTurn = gmActor ? S.jugadores[S.turno]?.actorId === gmActor.actorId : false;
    return {
      gmActor, gmAsPlayer, isMyTurn,
      players: shown.map(p => ({ ...p, diceData: plain(p.dados) })),
      announced: announcedView(S),
      canAnnounce: isMyTurn && S.fase === "anunciar",
      canDoubt: isMyTurn && S.fase === "decidir",
      canAccept: isMyTurn && Engine.canAccept(S)
    };
  }
});
