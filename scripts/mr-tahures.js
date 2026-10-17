/****************************************************
 * MR- Tahúres – v3.0.0 (juegos de dados de taberna)
 * • Registro de juegos (core.js + games/*): Dado del Mentiroso y Mia/Meyer. API: game.modules.get("mr-tahures").api
 * • v2.1: calzar/palifico clásicos, IA con personalidad, bote con dinero.
 * • v2.0: ApplicationV2, manos privadas por socket dirigido, revelación en el chat, V13/V14.
 ****************************************************/
import * as core from "./core.js";
import * as Engine from "./engine/liars-dice.js";
import "./games/liars-dice.js";
import "./games/mia.js";

const { ID, SOCKET, GAMES, DEFAULT_GAME, t, getSession, gameOf, isActiveGM, OWNER } = core;
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const templateOf = (kind) => {
  const def = gameOf(getSession()) ?? GAMES.get(DEFAULT_GAME);
  return kind === "gm" ? def.gmTemplate : def.trayTemplate;
};

// ===================================================================================
// 1. VENTANAS (ApplicationV2)
// ===================================================================================

class PlayerSelectApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static get singleton() { return this._inst ??= new this(); }

  static DEFAULT_OPTIONS = {
    id: "qm-select",
    tag: "form",
    classes: ["qm-dialog"],
    position: { width: 600, height: "auto" },
    window: { title: "QM.select.title", icon: "fas fa-cheese" },
    form: { handler: PlayerSelectApp.onSubmit, closeOnSubmit: true }
  };

  static PARTS = { form: { template: `modules/${ID}/templates/select-actors.html` } };

  async _prepareContext() {
    const actors = new Map();
    canvas.tokens?.placeables.forEach(tk => { if (tk.actor) actors.set(tk.actor.id, tk.actor); });
    const last = game.settings.get(ID, "lastGame");
    const ctx = {
      actors: [...actors.values()].sort((a, b) => a.name.localeCompare(b.name)).map(a => ({ id: a.id, name: a.name, img: a.img })),
      games: [...GAMES.values()].map(g => ({ id: g.id, name: t(g.title), selected: g.id === last })),
      skins: core.SKINS.map(k => ({ id: k, name: t(`QM.skin.${k}`), selected: k === game.settings.get(ID, "skin") })),
      ante: game.settings.get(ID, "ante"),
      hasCurrency: !!core.fundsPath()
    };
    for (const def of GAMES.values()) Object.assign(ctx, def.optionsContext?.());
    return ctx;
  }

  _onRender() {
    // Solo se muestran las opciones del juego elegido.
    const picker = this.element.querySelector('select[name="game"]');
    const ico = this.element.querySelector("#qm-game-ico");
    const showGame = () => {
      this.element.querySelectorAll("[data-game]").forEach(el => { el.hidden = el.dataset.game !== picker.value; });
      if (ico) ico.dataset.ico = picker.value;
    };
    picker.addEventListener("change", showGame);
    showGame();
    // La casilla de trampa solo vale para humanos.
    for (const sel of this.element.querySelectorAll('select[name^="actor-"]')) {
      const box = this.element.querySelector(`input[name="${sel.name.replace(/-mode$/, "-cheats")}"]`);
      const update = () => { if (!box) return; box.disabled = sel.value !== "humano"; if (box.disabled) box.checked = false; };
      sel.addEventListener("change", update);
      update();
    }
  }

  static async onSubmit(event, form, formData) {
    const data = formData.object;
    const gms = Object.entries(data).filter(([k, v]) => k.endsWith("-mode") && v === "gm").length;
    if (gms > 1) {
      ui.notifications.error(t("QM.notify.oneGmOnly"));
      return this.render({ force: true });
    }
    if (core.SKINS.includes(data.skin)) await game.settings.set(ID, "skin", data.skin);
    GAMES.get(data.game)?.startGame(data);
  }
}

/** Botones de acción de las bandejas (data-action); cada juego decide qué significan. */
function trayAction(event, target) { return this.onAction(target.dataset.action); }
const ACTIONS = Object.fromEntries(["raise", "lie", "spoton", "doubt", "accept", "announce"].map(a => [a, trayAction]));

class DiceTrayApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    classes: ["qm-dialog", "qm-dice-tray"],
    position: { width: 450, height: "auto" },
    window: { title: "QM.tray.title", icon: "fas fa-dice", resizable: false },
    actions: ACTIONS
  };

  static get PARTS() { return { tray: { template: templateOf("player") } }; }

  constructor(actorId, options = {}) {
    super({ id: `qm-dice-tray-${actorId}`, ...options });
    this.actorId = actorId;
  }

  async _prepareContext() {
    const S = getSession();
    const me = S?.jugadores.find(p => p.actorId === this.actorId);
    if (!S || !me) return { session: null };
    return { session: S, pot: S.pot, ...gameOf(S).trayContext(S, me, core.hands) };
  }

  onAction(action) {
    const S = getSession();
    const ix = S?.jugadores.findIndex(p => p.actorId === this.actorId);
    if (ix == null || ix < 0) return;
    return gameOf(S).onTrayAction(action, ix, { gm: false });
  }
}

class GMDiceTrayApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "qm-gm-dice-tray",
    classes: ["qm-dialog", "qm-dice-tray"],
    position: { width: 450, height: "auto" },
    window: { title: "QM.gmTray.title", icon: "fas fa-eye", resizable: true },
    actions: { ...ACTIONS, "toggle-gm-view": trayAction }
  };

  static get PARTS() { return { tray: { template: templateOf("gm") } }; }

  async _prepareContext() {
    const S = core.loadFull();
    if (!S) return { session: null };
    return { session: S, pot: S.pot, ...gameOf(S).gmContext(S) };
  }

  async onAction(action) {
    if (action === "toggle-gm-view") return game.settings.set(ID, "gmAsPlayer", !game.settings.get(ID, "gmAsPlayer"));
    const S = getSession();
    const ix = S?.jugadores.findIndex(p => p.type === "gm");
    if (ix == null || ix < 0) return;
    return gameOf(S).onTrayAction(action, ix, { gm: true });
  }
}

// ===================================================================================
// 2. MÓDULO
// ===================================================================================

class Tahures {
  static openApps = {};

  static initialize() {
    core.registerSettings();
    for (const def of GAMES.values()) def.registerSettings?.();
    core.bridge.refresh = () => this.refreshUI();
    core.bridge.openGMTray = () => this.openGMTray();
    core.bridge.openTray = actorId => this.openTray(actorId);
    game.modules.get(ID).api = { registerGame: core.registerGame, GAMES, core };
    this.setupHooks();
    this.setupSocket();
  }

  static setupHooks() {
    Hooks.on("getSceneControlButtons", controls => {
      const tokens = controls.tokens;
      if (!tokens || tokens.tools[ID]) return;
      tokens.tools[ID] = {
        name: ID,
        title: "QM.title",
        icon: "fas fa-cheese",
        order: Object.keys(tokens.tools).length,
        button: true,
        visible: game.user.isGM,
        onChange: () => PlayerSelectApp.singleton.render({ force: true })
      };
    });

    Hooks.on("renderChatMessageHTML", (msg, html) => {
      if (msg.getFlag(ID, "qm")) html.classList.add("qm-chat");
      const buttons = html.querySelectorAll(".qm-btn-gm");
      if (!buttons.length) return;
      if (!game.user.isGM) return buttons.forEach(b => b.remove());
      buttons.forEach(btn => btn.addEventListener("click", ev => {
        ev.preventDefault();
        const { action, actorId } = ev.currentTarget.dataset;
        if (action === "gm-remove-die") core.removeLife(actorId);
        if (action === "gm-end-game") core.endGame();
      }));
    });

    Hooks.once("ready", () => {
      core.applySkin();
      const S = getSession();
      if (!S?.active) return;
      if (game.user.isGM) this.openGMTray();
      else game.socket.emit(SOCKET, { type: "REQUEST_HANDS" });
    });
  }

  static setupSocket() {
    game.socket.on(SOCKET, (data, senderId) => {
      const { type, payload, targetUser } = data;
      if (targetUser && targetUser !== game.user.id) return;

      switch (type) {
        case "PLAYER_ACTION": {
          // Solo procesa el GM activo, y solo si quien envía es dueño del actor al que le toca.
          if (!isActiveGM()) return;
          const S = getSession();
          const ix = payload?.callerIx ?? payload?.betData?.jugadorIx;
          const sender = game.users.get(senderId);
          const owns = id => !!sender && !!game.actors.get(id)?.testUserPermission(sender, OWNER());
          if (!Engine.canAct(S, ix, owns) || S.jugadores[ix].type !== "humano") return;
          gameOf(S).onPlayerAction(S, ix, payload.action, payload);
          return;
        }
        case "REQUEST_HANDS": {
          if (!isActiveGM()) return;
          const S = core.loadFull();
          const user = game.users.get(senderId);
          if (S?.active && user) core.sendHands(S, [user]);
          return;
        }
        case "HANDS":
          core.setHands(payload);
          for (const actorId of Object.keys(core.hands.own)) this.openTray(actorId);
          this.refreshUI();
          return;
        case "NOTIFY_ERROR":
          ui.notifications.warn(payload);
          return;
      }
    });
  }

  static openTray(actorId) {
    let tray = this.openApps[actorId];
    if (!tray?.rendered) {
      tray = new DiceTrayApp(actorId);
      this.openApps[actorId] = tray;
    }
    tray.render({ force: true });
  }

  static openGMTray() {
    let tray = this.openApps.gm_tray;
    if (!tray?.rendered) {
      tray = new GMDiceTrayApp();
      this.openApps.gm_tray = tray;
    }
    tray.render({ force: true });
  }

  /** Repinta las ventanas abiertas; si ya no hay partida, las cierra. */
  static refreshUI() {
    const S = getSession();
    for (const [key, app] of Object.entries(this.openApps)) {
      if (!S) { app.close(); delete this.openApps[key]; }
      else if (app.rendered) app.render();
    }
    if (!S) core.setHands(null);
  }
}

Hooks.once("setup", () => Tahures.initialize());
