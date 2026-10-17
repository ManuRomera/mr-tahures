// Núcleo compartido por todos los juegos de taberna: registro, estado, manos privadas, dinero y flujo de turnos.
// Un juego es un objeto registrado con registerGame() (ver games/*.js y docs/JUEGOS.md).
import * as Engine from "./engine/liars-dice.js";

export const ID = "mr-queso-o-mentira";
export const SOCKET = `module.${ID}`;
export const DEFAULT_GAME = "liars-dice";
export const OWNER = () => CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;

export const esc = s => Handlebars.escapeExpression(s);
export const t = (key, data) => data ? game.i18n.format(key, data) : game.i18n.localize(key);
export const getSession = () => game.settings.get(ID, "session");
export const isActiveGM = () => game.users.activeGM?.id === game.user.id;
export const tokenOf = actorId => canvas.tokens?.placeables.find(tk => tk.actor?.id === actorId);

export const SKINS = ["garito", "taberna", "pirata", "oeste", "neon"];
export const applySkin = () => { document.body.dataset.qmSkin = game.settings.get(ID, "skin"); };

/** Dado dibujado en CSS (tema por skin): value 1-6, wild = «1 comodín», hit = resaltado en revelaciones. */
export const dieHtml = (v, { wild = false, hit = false } = {}) =>
  `<span class="qm-die" data-v="${v}"${wild ? " data-wild" : ""}${hit ? " data-hit" : ""} role="img" aria-label="${game.i18n.format("QM.tray.dieAlt", { value: v })}"></span>`;
export const diceData = (dados, S) => (dados ?? []).map(value => ({ value, wild: value === 1 && !!S?.onesWild }));

/** Mensaje de chat de la partida (lleva marca para pintarlo con la skin). */
export const say = data => ChatMessage.create(foundry.utils.mergeObject({ flags: { [ID]: { qm: true } } }, data));

// ---------- registro de juegos ----------
export const GAMES = new Map();
export const registerGame = def => { GAMES.set(def.id, def); return def; };
export const gameOf = S => GAMES.get(S?.game ?? DEFAULT_GAME);

/** Puente con las ventanas (lo rellena mr-queso-o-mentira.js). */
export const bridge = { refresh() {}, openGMTray() {}, openTray() {} };

/** Lo que ESTE cliente puede ver: { own: {actorId: dados}, all: {actorId: dados} | null } */
export const hands = { own: {}, all: null };
export const setHands = p => { hands.own = p?.own ?? {}; hands.all = p?.all ?? null; };

// ---------- ajustes comunes ----------
export function registerSettings() {
  const refresh = () => bridge.refresh();
  game.settings.register(ID, "session", { scope: "world", config: false, type: Object, default: null, onChange: refresh });
  game.settings.register(ID, "gmAsPlayer", { scope: "world", config: false, type: Boolean, default: false, onChange: refresh });
  game.settings.register(ID, "ante", { scope: "world", config: false, type: Number, default: 0 });
  game.settings.register(ID, "lastGame", { scope: "world", config: false, type: String, default: DEFAULT_GAME });
  game.settings.register(ID, "skin", {
    name: "QM.settings.skin.name", hint: "QM.settings.skin.hint", scope: "world", config: true, type: String, default: "garito",
    choices: Object.fromEntries(SKINS.map(k => [k, `QM.skin.${k}`])), onChange: applySkin
  });
  game.settings.register(ID, "currencyPath", { name: "QM.settings.currencyPath.name", hint: "QM.settings.currencyPath.hint", scope: "world", config: true, type: String, default: "" });
  // Manos del GM: ajuste de CLIENTE, nunca viaja a los jugadores.
  game.settings.register(ID, "hands", { scope: "client", config: false, type: Object, default: {} });
}

// ---------- dinero ----------
// Ruta (ajuste del módulo) al campo numérico del actor, p. ej. system.monedas.value. Vacía = sin apuestas.
export const fundsPath = () => game.settings.get(ID, "currencyPath")?.trim();
export const getFunds = actor => { const path = fundsPath(); if (!path || !actor) return null; const v = foundry.utils.getProperty(actor, path); return Number.isFinite(v) ? v : null; };
export const addFunds = (actor, delta) => actor.update({ [fundsPath()]: getFunds(actor) + delta });

/** Entrada del formulario (0 si no hay ruta de dinero configurada); se recuerda para la próxima partida. */
export async function readAnte(formData) {
  const ante = fundsPath() ? Math.max(0, Number(formData.ante) || 0) : 0;
  await game.settings.set(ID, "ante", ante);
  return ante;
}

/** Cobra la entrada a los actores con fondos; los que no tienen el campo juegan por la casa. false si alguien no llega. */
export async function collectAnte(S, ante) {
  const payers = S.jugadores.map(j => game.actors.get(j.actorId)).filter(a => getFunds(a) !== null);
  const poor = payers.find(a => getFunds(a) < ante);
  if (poor) { ui.notifications.warn(t("QM.notify.noFunds", { name: poor.name, amount: ante })); return false; }
  for (const a of payers) await addFunds(a, -ante);
  S.ante = ante; S.payers = payers.map(a => a.id); S.pot = ante * S.jugadores.length;
  say({ content: `<p class="qm-msg">${t("QM.chat.antePaid", { amount: ante, pot: S.pot })}</p>` });
  return true;
}

export async function payPot(S, winner) {
  if (!S.pot) return;
  const actor = winner && game.actors.get(winner.actorId);
  if (actor && getFunds(actor) !== null) {
    await addFunds(actor, S.pot);
    await say({ content: `<p class="qm-msg">${t("QM.chat.potWon", { name: esc(winner.name), pot: S.pot })}</p>` });
  } else {
    await say({ content: `<p class="qm-msg">${t("QM.chat.potKept", { pot: S.pot })}</p>` });
  }
}

export async function refundPot(S) {
  if (!S?.pot) return;
  for (const id of S.payers ?? []) { const a = game.actors.get(id); if (a && getFunds(a) !== null) await addFunds(a, S.ante); }
  await say({ content: `<p class="qm-msg">${t("QM.chat.potRefund")}</p>` });
}

// ---------- estado: la sesión pública no lleva dados; las manos viven en el ajuste de cliente del GM ----------
export function loadFull() {
  const pub = getSession();
  if (!pub) return null;
  const S = foundry.utils.deepClone(pub);
  const stored = game.settings.get(ID, "hands") ?? {};
  S.jugadores.forEach(j => { j.dados = stored[j.actorId] ?? []; });
  return S;
}

export async function saveFull(S) {
  const pub = foundry.utils.deepClone(S);
  const stored = {};
  pub.jugadores.forEach(j => { stored[j.actorId] = j.dados ?? []; delete j.dados; });
  await game.settings.set(ID, "hands", stored);
  await game.settings.set(ID, "session", pub);
}

export async function clearSession() {
  await game.settings.set(ID, "hands", {});
  await game.settings.set(ID, "session", null);
}

export function handsPayloadFor(user, S) {
  const own = {};
  let all = null;
  for (const j of S.jugadores) {
    if (j.type !== "humano") continue;
    if (!game.actors.get(j.actorId)?.testUserPermission(user, OWNER())) continue;
    own[j.actorId] = j.dados;
    if (j.isCheater) all = Object.fromEntries(S.jugadores.map(p => [p.actorId, p.dados]));
  }
  return Object.keys(own).length ? { own, all } : null;
}

export function sendHands(S, users = game.users.filter(u => u.active && !u.isGM)) {
  for (const user of users) {
    const payload = handsPayloadFor(user, S);
    if (payload) game.socket.emit(SOCKET, { type: "HANDS", payload, targetUser: user.id }, { recipients: [user.id] });
  }
}

// ---------- flujo común ----------
export function getUsersForActor(actorId) {
  const actor = game.actors.get(actorId);
  if (!actor) return [];
  return game.users.filter(u => u.active && !u.isGM && actor.testUserPermission(u, OWNER()));
}

export function notifyActor(actorId, message) {
  getUsersForActor(actorId).forEach(u => game.socket.emit(SOCKET, { type: "NOTIFY_ERROR", payload: message, targetUser: u.id }, { recipients: [u.id] }));
}

export const playSound = (src, vol = 0.8) =>
  foundry.audio.AudioHelper.play({ src: `modules/${ID}/assets/sounds/${src}`, volume: vol, autoplay: true, loop: false }, true);

/** Frase de taberna de una IA con personalidad (la mitad de las veces). */
export function speak(j, kind) {
  const key = `QM.phrase.${j.level}.${kind}`;
  if (j.type === "ia" && game.i18n.has(key) && Math.random() < 0.5) {
    say({ content: `<i class="qm-msg">${esc(j.name)}: «${t(key)}»</i>` });
  }
}

/** Fichas de vida: las que quedan y, apagadas, las perdidas. */
const tokens = (j, S) => '<span class="qm-tok"></span>'.repeat(j.dadosRestantes) +
  '<span class="qm-tok lost"></span>'.repeat(Math.max(0, (S.startDice ?? j.dadosRestantes) - j.dadosRestantes));

/** Mensaje de situación con botones de GM (los jugadores no los ven: se quitan al pintar). */
export function statusHtml(S) {
  const sym = gameOf(S)?.lifeSymbol ?? "●";
  const lines = S.jugadores.map(j => {
    const icon = j.type === "humano" ? "humano" : j.type === "ia" ? "ia" : "gm";
    return `<i class="qm-ico" data-ico="${icon}"></i> <b>${esc(j.name)}</b> <span class="qm-pips">${tokens(j, S)}</span>` +
      ` <button class="qm-btn qm-btn-gm" data-action="gm-remove-die" data-actor-id="${j.actorId}">-1</button>`;
  }).join("<br>");
  const gmControls = `<div class="flexrow" style="gap:.5rem; margin-top: 5px;"><button class="qm-btn qm-btn-gm" data-action="gm-end-game">${t("QM.gm.endGame")}</button></div>`;
  const pot = S.pot ? `<br><b>${t("QM.tray.pot")}:</b> ${S.pot}` : "";
  return `<div class="qm-status"><b>${t("QM.chat.statusTitle")}</b><br>${lines}${pot}${gmControls}</div>`;
}

/** Actores de la escena con su modo elegido en el formulario → lista de jugadores. */
export function parsePlayers(formData, lives) {
  const jugadores = [];
  for (const [k, mode] of Object.entries(formData)) {
    const m = k.match(/^actor-(.*)-mode$/);
    if (!m || !mode) continue;
    const actor = game.actors.get(m[1]);
    if (!actor) continue;
    const isIA = mode.startsWith("ia-");
    jugadores.push({
      name: actor.name, type: isIA ? "ia" : mode, level: isIA ? mode.slice(3) : null,
      actorId: actor.id, dadosRestantes: lives, dados: [], isCheater: !!formData[`actor-${actor.id}-cheats`]
    });
  }
  return jugadores;
}

export async function rollInitiative(jugadores) {
  playSound("init.ogg", 0.6);
  let contenders = [...jugadores];
  let winner = null;
  let chat = `<h3>${t("QM.chat.initiativeTitle")}</h3><p>${t("QM.chat.initiativeInstructions")}</p><ul>`;
  while (!winner) {
    let best = -1, ties = [];
    for (const player of contenders) {
      const roll = await new Roll("1d20").evaluate();
      chat += `<li><b>${esc(player.name)}</b>: ${roll.total}</li>`;
      if (roll.total > best) { best = roll.total; ties = [player]; }
      else if (roll.total === best) ties.push(player);
    }
    if (ties.length === 1) winner = ties[0];
    else { chat += `</ul><p>${t("QM.chat.initiativeTie")}</p><ul>`; contenders = ties; }
  }
  chat += `</ul><hr><p>${t("QM.chat.initiativeWinner", { name: esc(winner.name) })}</p>`;
  say({ content: chat });
  return jugadores.findIndex(p => p.actorId === winner.actorId);
}

/** Alta de una partida: cobra la entrada, guarda, anuncia, sortea quién empieza y arranca la primera ronda del juego. */
export async function beginGame(def, S, ante) {
  if (ante && !(await collectAnte(S, ante))) return;
  await game.settings.set(ID, "gmAsPlayer", false);
  await game.settings.set(ID, "lastGame", def.id);
  await saveFull(S);
  say({ content: def.intro(S) });
  S.turno = await rollInitiative(S.jugadores);
  await saveFull(S);
  def.startRound();
}

export async function setDefeated(actorId, on) {
  const actor = tokenOf(actorId)?.actor;
  if (!actor) return;
  if (on === actor.statuses.has(CONFIG.specialStatusEffects.DEFEATED)) return;
  await actor.toggleStatusEffect(CONFIG.specialStatusEffects.DEFEATED, on ? { active: true, overlay: true } : { active: false });
}

export function promptTurn() {
  if (!game.user.isGM) return;
  const S = getSession();
  if (!S?.active) return;
  const j = S.jugadores[S.turno];
  const token = tokenOf(j.actorId);
  if (token && canvas.ready) canvas.ping(token.center, { style: "pulse" });
  if (j.type === "humano" || j.type === "gm") return;
  window.setTimeout(() => gameOf(getSession())?.aiPlay(), 1500);
}

export async function finishGame(S, winner) {
  playSound("win.ogg", 1);
  await payPot(S, winner);
  await say({ content: `<h2 class="qm-msg">${winner ? t("QM.chat.winsGame", { name: esc(winner.name) }) : t("QM.chat.noWinner")}</h2>` });
  await clearSession();
}

/** Resta vidas/dados, elimina, y o termina la partida o abre la siguiente ronda del juego en curso. */
export async function resolveRound(loserIndices, lives = 1) {
  if (!game.user.isGM) return;
  const S = loadFull();
  if (!S?.active) return;
  const indices = Array.isArray(loserIndices) ? loserIndices : [loserIndices];
  const { eliminated, ended, winner } = Engine.applyLosses(S, indices, lives);
  for (const loser of eliminated) await setDefeated(loser.actorId, true);
  if (ended) return finishGame(S, winner);
  await saveFull(S);
  const def = gameOf(S);
  window.setTimeout(() => def.startRound(), 3000);
}

export async function removeLife(actorId) {
  const S = getSession();
  const ix = S?.jugadores.findIndex(p => p.actorId === actorId);
  if (ix == null || ix < 0) return;
  await say({ content: `<p class="qm-msg">${t("QM.gm.dieRemoved", { name: esc(S.jugadores[ix].name) })}</p>` });
  resolveRound(ix, 1);
}

export async function endGame() {
  await refundPot(getSession());
  await clearSession();
  await say({ content: `<p class="qm-msg">${t("QM.gm.gameEndedManually")}</p>` });
}
