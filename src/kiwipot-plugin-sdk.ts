// Kiwipot plugin SDK: https://kiwipot.com/developers/plugins
// One file: add it to your plugin's project and import { connect } from it.

// What Kiwipot and a sandboxed plugin say to each other (docs/PLUGINS.md §6), and what a plugin's manifest holds. The
// app (the host) and the SDK the plugin runs (sdk.ts) both use it: nothing here touches the DOM or the app.

// The protocol this app speaks: a plugin built for a newer one is not started. 2 has permissions (network hosts, the
// account through api.request): a plugin that asks for any speaks 2, so an app that can't grant them never runs it.
export const PROTOCOL_VERSION = 2;
export const PERMISSIONS_PROTOCOL = 2;

// The handshake, over window.postMessage: the plugin's frame says hello (its origin is opaque, "null", so the app knows
// it by its window), and the app answers with the plugin's code and the port that every later message goes through
export const HELLO = 'kiwipot:hello';
export const START = 'kiwipot:start';
// Where the frame's loader leaves that port for the SDK: Symbol.for(PORT_KEY) on the plugin's global object
export const PORT_KEY = 'kiwipot.port';

// Where the plugin is shown: in the note (a block, sized by the plugin) or on a page of its own (the whole screen)
export type PluginView = 'block' | 'page';

export type PluginTheme = 'light' | 'dark';

// The app's colours as CSS colours. The SDK sets them on the plugin's page as --kiwipot-<name> variables
// (--kiwipot-surface, --kiwipot-ink-2…), so a plugin looks like the app in either theme.
export interface PluginColors {
  surface: string;
  sunken: string;
  ink: string;
  'ink-2': string;
  'ink-3': string;
  line: string;
  'line-strong': string;
  accent: string;
  'accent-soft': string;
  'accent-text': string;
  danger: string;
}

export const PLUGIN_COLOR_NAMES: (keyof PluginColors)[] = [
  'surface',
  'sunken',
  'ink',
  'ink-2',
  'ink-3',
  'line',
  'line-strong',
  'accent',
  'accent-soft',
  'accent-text',
  'danger',
];

// How the plugin is shown, which can change while it runs (the theme, the language, whether the note can be edited)
export interface PluginUI {
  view: PluginView;
  theme: PluginTheme;
  // The app's language ("en", "pt"…)
  locale: string;
  // The note can't be edited here: the plugin shows its block, and the app refuses its changes
  readOnly: boolean;
  colors: PluginColors;
}

// A block's data: a JSON object, the plugin's own format (at most 4 MB as JSON, docs/PLUGINS.md §3)
export type BlockData = Record<string, unknown>;

// What a plugin may do beyond its blocks, granted by installing it
export interface PluginPermissions {
  // Hosts its frame may reach over https (fetch, pictures, fonts, media): api.example.com, *.example.com
  network?: string[];
  // The account, through the app (api.request): read, or write too, as an access token (docs/MCP.md)
  account?: 'read' | 'write';
}

// A setting's value, and the user's values by key (each field's default where they set none)
export type SettingValue = string | number | boolean;
export type PluginSettings = Record<string, SettingValue>;

// A field of a plugin's settings, which the app draws in Settings → Plugins (protocol 2)
export interface PluginSettingField {
  // A letter, then letters, digits or _ (at most 32)
  key: string;
  type: 'string' | 'number' | 'integer' | 'boolean';
  // English; translations by language below
  title: string;
  description?: string;
  default?: SettingValue;
  // A choice of values, with their names
  enum?: (string | number)[];
  enumTitles?: string[];
  // Of a number
  minimum?: number;
  maximum?: number;
  // Of a text (500 at most)
  maxLength?: number;
  translations?: Record<string, { title?: string; description?: string; enumTitles?: string[] }>;
}

// What the plugin gets first: its block's data, how it is shown, what it was granted and the user's settings
export interface PluginInit extends PluginUI {
  protocol: number;
  pluginId: string;
  data: BlockData;
  permissions: PluginPermissions;
  settings: PluginSettings;
  // The version of the kit (kp- classes) the app put in the frame (kit/kit.ts); absent in apps before it
  kit?: number;
  // The methods this app answers (kiwipot.ui.supports); absent in apps before ui.toast, ui.confirm and ui.menu
  methods?: PluginMethod[];
}

// What the app draws for a plugin, over the note (docs/PLUGINS.md §6 "UI the app draws"): plain text only, named after
// the plugin. A confirmation and a menu only right after the user did something in the plugin, one at a time.
export type ToastKind = 'info' | 'success' | 'error';

export interface ToastRequest {
  text: string;
  kind?: ToastKind;
}

export interface ConfirmRequest {
  title: string;
  message?: string;
  // The confirm button's words; the other button is Cancel unless `cancel` names it
  confirm: string;
  cancel?: string;
  // Destructive: a red button, and Cancel has the focus
  danger?: boolean;
}

export interface MenuItem {
  // Answered when chosen: letters, digits, - and _
  id: string;
  label: string;
  danger?: boolean;
  // An option that is on (a check beside it)
  checked?: boolean;
  disabled?: boolean;
}

export interface MenuRequest {
  items: MenuItem[];
  // Where it opens, in the plugin's page (CSS pixels from its top left): below that, or above when there is no room.
  // None: under the block's top left. On phones it is a bottom sheet either way.
  anchor?: { x: number; y: number; width: number; height: number };
}

// A note the user picked (ui.pickNote): its UUID, to keep in the block's data, and its title as it is now
export interface PickedNote {
  uuid: string;
  title: string;
}

// A day, as YYYY-MM-DD (ui.pickDate)
export type PickedDate = string;

// How long each text may be, and how many items a menu has
export const UI_LIMITS = { toast: 140, title: 80, message: 300, label: 40, items: 12, id: 64 } as const;

// A request to Kiwipot's API, made by the app for the plugin, within its grant (permissions.account)
export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  // The API's path: /notes, /notes/<uuid>, /tasks, /search…
  path: string;
  query?: Record<string, string | number | boolean>;
  // A JSON body
  body?: unknown;
}

// The API's answer: its status and JSON body, whatever the status (a 404 is an answer)
export interface ApiResponse {
  status: number;
  body: unknown;
}

// The plugin's requests: each is answered by a response with its id
export type PluginRequest =
  // Saves the block's data, with the picture public pages show (an SVG document, at most 1 MB; null removes it)
  | { type: 'request'; id: number; method: 'block.setData'; params: { data: BlockData; preview?: string | null } }
  // The height the block needs in the note, in CSS pixels (in the note only)
  | { type: 'request'; id: number; method: 'ui.resize'; params: { height: number } }
  // Opens the block on a page of its own (in the note only)
  | { type: 'request'; id: number; method: 'ui.openPage'; params?: undefined }
  // The plugin has something open that back (Android's button or gesture) should close, or no longer: while it has,
  // the app sends ui.back instead of going back. An app without it answers unknown-method: back leaves, as before.
  | { type: 'request'; id: number; method: 'ui.catchBack'; params: { active: boolean } }
  // Asks the API (protocol 2, with permissions.account): answered with an ApiResponse
  | { type: 'request'; id: number; method: 'api.request'; params: ApiRequest }
  // A toast in the app's notification stack, named after the plugin
  | { type: 'request'; id: number; method: 'ui.toast'; params: ToastRequest }
  // A question the user confirms or cancels: answered with true or false
  | { type: 'request'; id: number; method: 'ui.confirm'; params: ConfirmRequest }
  // A menu: answered with the chosen item's id, or null when it was closed
  | { type: 'request'; id: number; method: 'ui.menu'; params: MenuRequest }
  // The app's note picker: answered with a PickedNote, or null when it was closed
  | { type: 'request'; id: number; method: 'ui.pickNote'; params: { title?: string } }
  // The app's date picker: answered with the day picked (YYYY-MM-DD), or null
  | { type: 'request'; id: number; method: 'ui.pickDate'; params: { title?: string; value?: PickedDate } }
  // Opens one of the user's notes in the app (one the plugin was given by ui.pickNote, say)
  | { type: 'request'; id: number; method: 'ui.openNote'; params: { uuid: string } };

export type PluginMethod = PluginRequest['method'];

// What reaches the app from the frame: requests, and the errors the plugin did not catch (its frame's loader reports
// them)
export type PluginMessage = PluginRequest | { type: 'crash'; message: string };

export type PluginErrorCode =
  // The note can't be edited here
  | 'read-only'
  // Over the size limits
  | 'too-large'
  // Not what the method takes
  | 'invalid'
  // Not possible in this view (a page has no height to ask for)
  | 'unavailable'
  // The app could not do it (the save failed)
  | 'failed'
  // A method this app doesn't have (a plugin built for a newer one)
  | 'unknown-method'
  // Not granted: the account was not, or the API refused this request for the plugin
  | 'forbidden'
  // No connection: the API is online only
  | 'offline'
  // A confirmation or a menu not right after the user did something in the plugin
  | 'not-allowed'
  // One is open already, or toasts came too fast
  | 'busy';

export interface PluginError {
  code: PluginErrorCode;
  message: string;
}

// The app's messages
export type HostMessage =
  | { type: 'init'; init: PluginInit }
  | { type: 'response'; id: number; error?: PluginError; result?: unknown }
  // The block's data changed elsewhere: on another device, or in another view of it
  | { type: 'block.change'; data: BlockData }
  | { type: 'ui.change'; ui: PluginUI }
  // Back was pressed while the plugin catches it (ui.catchBack)
  | { type: 'ui.back' }
  // The user changed the plugin's settings
  | { type: 'settings.change'; settings: PluginSettings };

// The block a plugin adds to the "/" and insert menus. One per plugin: the block's node names the plugin only.
export interface PluginBlockManifest {
  // English; translations by language below
  title: string;
  description: string;
  // English search words, matched besides the translated title
  keywords: string[];
  // An SVG document whose shape is drawn in the text's colour (its own colours don't count), like the menus' icons
  icon: string;
  translations?: Record<string, { title?: string; description?: string }>;
}

// kiwipot-plugin.json
export interface PluginManifest {
  // Lowercase letters, digits, dots and dashes (a block document's pluginId)
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  // The protocol the plugin speaks: an app that speaks an older one doesn't run it
  protocol: number;
  // The code's entry, relative to the manifest: bundled into one script
  main: string;
  block: PluginBlockManifest;
  // Protocol 2: what it asks for, granted by installing it
  permissions?: PluginPermissions;
  // Protocol 2: its settings' fields, in the order the form shows them
  settings?: PluginSettingField[];
}

/**
 * The plugin SDK (@kiwipot/plugin-sdk, docs/PLUGINS.md §6): what a plugin's code uses to talk to Kiwipot from its
 * sandbox. The plugin runs in a frame of its own, with no access to the app, its storage or the network: its block's
 * data comes and goes through here.
 *
 * ```ts
 * import { connect } from '@kiwipot/plugin-sdk';
 *
 * const kiwipot = await connect<{ count: number }>();
 * render(kiwipot.block.getData());
 * kiwipot.block.onChange(render);
 * button.onclick = () => kiwipot.block.setData({ count: count + 1 }, { preview: svgOf(count + 1) });
 * kiwipot.ui.autoResize();
 * ```
 */


// A request the app refused or could not do
export class PluginRequestError extends Error {
  readonly code: PluginErrorCode;

  constructor({ code, message }: PluginError) {
    super(message);
    this.name = 'PluginRequestError';
    this.code = code;
  }
}

export interface Kiwipot<Data extends BlockData = BlockData> {
  readonly pluginId: string;
  // The version of the kit the app put on the page (kp- classes: kiwipot.com/developers/plugins#h-the-kit); 0 in an app
  // without it
  readonly kit: number;
  // What the user granted by installing the plugin (its manifest's permissions)
  readonly permissions: PluginPermissions;
  block: {
    // The block's data as last saved or received
    getData(): Data;
    // Saves the data (the whole of it), with the picture public pages show instead of the plugin (an SVG document, at
    // most 1 MB; null removes it). Resolves once it is saved on this device; it syncs from there.
    setData(data: Data, options?: { preview?: string | null }): Promise<void>;
    // The data changed elsewhere (another device, the block's other view): never called for this plugin's own saves
    onChange(listener: (data: Data) => void): () => void;
  };
  ui: {
    // How the plugin is shown now
    readonly current: PluginUI;
    onChange(listener: (ui: PluginUI) => void): () => void;
    // The height the block needs in the note, in CSS pixels; ignored on the block's own page
    resize(height: number): void;
    // Keeps the block's height to an element's (the page's body by default) as it changes; returns the stop
    autoResize(element?: HTMLElement): () => void;
    // Opens the block on a page of its own (from the note)
    openPage(): Promise<void>;
    // Back (Android's button or gesture) closes what the plugin has open, a sheet or a menu: while a handler is
    // registered, back calls the latest one instead of leaving the page. Returns its removal.
    onBack(handler: () => void): () => void;
    // Whether this app answers a method ('ui.menu'…): an older one rejects what it doesn't have with unknown-method
    supports(method: PluginMethod): boolean;
    // A short message in the app's notification stack, under the plugin's name (at most 140 characters)
    toast(text: string, options?: { kind?: ToastKind }): Promise<void>;
    // Asks the user, in the app's dialog under the plugin's name: true when confirmed. Only right after the user did
    // something in the plugin (a click, a key): rejects with not-allowed otherwise.
    confirm(request: ConfirmRequest): Promise<boolean>;
    // A menu drawn by the app, so it isn't cut by the block's edges (a bottom sheet on phones): the chosen item's id,
    // or null when it was closed. It opens at `anchor`, an element of the plugin's page or a rectangle in it. Only right
    // after the user did something in the plugin, like confirm.
    menu(
      items: MenuItem[],
      options?: { anchor?: Element | { x: number; y: number; width: number; height: number } }
    ): Promise<string | null>;
    // The app's pickers, under the plugin's name, after the user did something in the plugin like menus: a note of the
    // user's (its UUID and title, to keep in the block's data), or a day (YYYY-MM-DD). null when closed.
    pickNote(options?: { title?: string }): Promise<PickedNote | null>;
    pickDate(options?: { title?: string; value?: PickedDate }): Promise<PickedDate | null>;
    // Opens one of the user's notes in the app, after the user did something in the plugin
    openNote(uuid: string): Promise<void>;
  };
  settings: {
    // The user's settings, each field's default where they set none
    readonly current: PluginSettings;
    // The user changed them (in Settings → Plugins, on any device)
    onChange(listener: (settings: PluginSettings) => void): () => void;
  };
  api: {
    // Kiwipot's API as the user, within what permissions.account grants (as an access token of that scope):
    // `api.request('GET', '/notes', { query: { limit: 5 } })`. Resolves with the status and JSON body; rejects with
    // `forbidden` (not granted, or a request the scope doesn't allow) or `offline`.
    request(
      method: ApiRequest['method'],
      path: string,
      options?: Pick<ApiRequest, 'query' | 'body'>
    ): Promise<ApiResponse>;
  };
}

export interface ConnectOptions {
  // Sets the app's colours (--kiwipot-*), color-scheme and data-theme on the page, now and as they change (default)
  applyTheme?: boolean;
}

type PortHolder = Record<symbol, MessagePort | undefined>;

// The app's colours and theme on the plugin's page
const applyUI = (ui: PluginUI) => {
  const root = document.documentElement;
  root.dataset.theme = ui.theme;
  root.lang = ui.locale;
  root.style.colorScheme = ui.theme;
  for (const name of PLUGIN_COLOR_NAMES) {
    root.style.setProperty(`--kiwipot-${name}`, ui.colors[name]);
  }
};

const copy = <T>(value: T): T => structuredClone(value);

/** Connects to Kiwipot: resolves with the block's data and how it is shown, once the app has sent them. */
export const connect = <Data extends BlockData = BlockData>({ applyTheme = true }: ConnectOptions = {}): Promise<
  Kiwipot<Data>
> => {
  const port = (globalThis as unknown as PortHolder)[Symbol.for(PORT_KEY)];
  if (!port) {
    return Promise.reject(new Error('Not running in Kiwipot: plugins run in the frame Kiwipot starts them in'));
  }

  let nextId = 1;
  const pending = new Map<number, { resolve: (result: unknown) => void; reject: (error: Error) => void }>();
  const dataListeners = new Set<(data: Data) => void>();
  const uiListeners = new Set<(ui: PluginUI) => void>();
  let data: Data;
  let ui: PluginUI;
  let permissions: PluginPermissions = {};
  let settings: PluginSettings = {};
  const settingsListeners = new Set<(settings: PluginSettings) => void>();
  let lastHeight = -1;
  // Back's handlers, the latest last: the app is told when there are some, and when no longer
  const backHandlers: (() => void)[] = [];

  const request = (message: Omit<PluginRequest, 'id' | 'type'>) =>
    new Promise<unknown>((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      port.postMessage({ type: 'request', id, ...message });
    });

  // Asked only when it changes, and only in the note
  const resize = (height: number) => {
    const rounded = Math.ceil(height);
    if (ui.view !== 'block' || rounded === lastHeight || !Number.isFinite(rounded)) {
      return;
    }
    lastHeight = rounded;
    request({ method: 'ui.resize', params: { height: rounded } }).catch(() => {});
  };

  // What this app answers: an app from before init.methods answers these
  const BEFORE_METHODS: PluginMethod[] = ['block.setData', 'ui.resize', 'ui.openPage', 'ui.catchBack', 'api.request'];
  let methods: PluginMethod[] = BEFORE_METHODS;

  // A rectangle of the plugin's page, rounded, for the app
  const rectOf = (anchor: Element | { x: number; y: number; width: number; height: number }) => {
    const { x, y, width, height } = anchor instanceof Element ? anchor.getBoundingClientRect() : anchor;
    return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
  };

  const kiwipot = (pluginId: string, kit: number): Kiwipot<Data> => ({
    pluginId,
    kit,
    get permissions() {
      return copy(permissions);
    },
    block: {
      getData: () => copy(data),
      setData: async (next, options = {}) => {
        const saved = copy(next);
        await request({
          method: 'block.setData',
          params: { data: saved, ...(options.preview !== undefined ? { preview: options.preview } : {}) },
        });
        data = saved;
      },
      onChange: (listener) => {
        dataListeners.add(listener);
        return () => dataListeners.delete(listener);
      },
    },
    ui: {
      get current() {
        return copy(ui);
      },
      onChange: (listener) => {
        uiListeners.add(listener);
        return () => uiListeners.delete(listener);
      },
      resize,
      autoResize: (element = document.body) => {
        const measure = () => resize(element.getBoundingClientRect().height);
        const observer = new ResizeObserver(measure);
        observer.observe(element);
        measure();
        return () => observer.disconnect();
      },
      openPage: () => request({ method: 'ui.openPage' }).then(() => undefined),
      onBack: (handler) => {
        backHandlers.push(handler);
        if (backHandlers.length === 1) {
          request({ method: 'ui.catchBack', params: { active: true } }).catch(() => {});
        }
        return () => {
          const index = backHandlers.lastIndexOf(handler);
          if (index === -1) {
            return;
          }
          backHandlers.splice(index, 1);
          if (backHandlers.length === 0) {
            request({ method: 'ui.catchBack', params: { active: false } }).catch(() => {});
          }
        };
      },
      supports: (method) => methods.includes(method),
      toast: (text, options = {}) =>
        request({ method: 'ui.toast', params: { text, ...(options.kind ? { kind: options.kind } : {}) } }).then(
          () => undefined
        ),
      confirm: (question) => request({ method: 'ui.confirm', params: question }).then((result) => result === true),
      menu: (items, options = {}) =>
        request({
          method: 'ui.menu',
          params: { items, ...(options.anchor ? { anchor: rectOf(options.anchor) } : {}) },
        }).then((result) => (typeof result === 'string' ? result : null)),
      pickNote: (options = {}) =>
        request({ method: 'ui.pickNote', params: options }).then((result) => (result ? (result as PickedNote) : null)),
      pickDate: (options = {}) =>
        request({ method: 'ui.pickDate', params: options }).then((result) =>
          typeof result === 'string' ? result : null
        ),
      openNote: (uuid) => request({ method: 'ui.openNote', params: { uuid } }).then(() => undefined),
    },
    settings: {
      get current() {
        return copy(settings);
      },
      onChange: (listener) => {
        settingsListeners.add(listener);
        return () => settingsListeners.delete(listener);
      },
    },
    api: {
      request: (method, path, options = {}) =>
        request({ method: 'api.request', params: { method, path, ...options } }) as Promise<ApiResponse>,
    },
  });

  return new Promise((resolve) => {
    port.onmessage = ({ data: message }: MessageEvent<HostMessage>) => {
      switch (message.type) {
        case 'init': {
          const {
            data: initial,
            protocol: _protocol,
            pluginId,
            permissions: granted,
            settings: values,
            kit,
            methods: answered,
            ...shown
          } = message.init as PluginInit & { data: Data };
          methods = answered ?? BEFORE_METHODS;
          data = initial;
          ui = shown;
          permissions = granted ?? {};
          settings = values ?? {};
          if (applyTheme) {
            applyUI(ui);
          }
          resolve(kiwipot(pluginId, kit ?? 0));
          return;
        }
        case 'response': {
          const request = pending.get(message.id);
          pending.delete(message.id);
          if (message.error) {
            request?.reject(new PluginRequestError(message.error));
          } else {
            request?.resolve(message.result);
          }
          return;
        }
        case 'block.change':
          data = message.data as Data;
          dataListeners.forEach((listener) => listener(copy(data)));
          return;
        case 'settings.change':
          settings = message.settings;
          settingsListeners.forEach((listener) => listener(copy(settings)));
          return;
        case 'ui.back':
          backHandlers[backHandlers.length - 1]?.();
          return;
        case 'ui.change':
          ui = message.ui;
          if (applyTheme) {
            applyUI(ui);
          }
          uiListeners.forEach((listener) => listener(copy(ui)));
          return;
        default:
      }
    };
  });
};

// The protocol this SDK speaks (the manifest's "protocol")
export const SDK_PROTOCOL = PROTOCOL_VERSION;
