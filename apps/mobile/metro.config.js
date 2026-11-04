// Metro for a pnpm monorepo on a slow disk.
//
// Expo's default watches the whole workspace — every app's build output and
// every package any app installed (node_modules/.pnpm holds ~1,600). On this
// repo's NTFS mount that crawl outlasts Metro's four-minute start-up limit.
// So Metro is pointed at what the app can actually load: the app, the
// shared packages, and only the .pnpm entries reachable from the app's own
// dependencies.
const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const store = path.join(workspaceRoot, "node_modules", ".pnpm");

/** "<store>/<entry>/node_modules/<name>" → "<entry>", or null outside the store. */
const storeEntry = (dir) => {
  const rel = path.relative(store, dir);
  return rel.startsWith("..") ? null : rel.split(path.sep)[0];
};

/** Every package directory under a node_modules folder, scoped ones included. */
const packagesIn = (nodeModules) => {
  let names = [];
  try {
    names = fs.readdirSync(nodeModules);
  } catch {
    return [];
  }
  return names.flatMap((name) => {
    if (name.startsWith(".")) return [];
    const full = path.join(nodeModules, name);
    if (!name.startsWith("@")) return [full];
    try {
      return fs.readdirSync(full).map((sub) => path.join(full, sub));
    } catch {
      return [];
    }
  });
};

/**
 * Walks the dependency graph through pnpm's symlinks: a package's own
 * dependencies are its siblings inside "<store>/<entry>/node_modules".
 */
function reachableStoreEntries() {
  const seen = new Set();
  const queue = [
    ...packagesIn(path.join(projectRoot, "node_modules")),
    ...["types", "utils"].flatMap((p) =>
      packagesIn(path.join(workspaceRoot, "packages", p, "node_modules")),
    ),
  ];
  while (queue.length > 0) {
    let real;
    try {
      real = fs.realpathSync(queue.pop());
    } catch {
      continue;
    }
    const entry = storeEntry(real);
    if (!entry || seen.has(entry)) continue;
    seen.add(entry);
    queue.push(...packagesIn(path.join(store, entry, "node_modules")));
  }
  return seen;
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sep = escape(path.sep);
const allowed = [...reachableStoreEntries()].map(escape).join("|");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  projectRoot,
  path.join(workspaceRoot, "packages"),
  path.join(workspaceRoot, "node_modules"),
];

config.resolver.blockList = [
  // Store entries the app can't reach.
  // The crawler tests folders without a trailing separator, hence "(?:sep|$)".
  new RegExp(`^${escape(store)}${sep}(?!(?:${allowed})(?:${sep}|$)).*`),
  // The other apps, and this app's generated native projects.
  new RegExp(`^${escape(path.join(workspaceRoot, "apps"))}${sep}(?!mobile${sep}).*`),
  new RegExp(`^${escape(projectRoot)}${sep}(?:android|ios|\\.expo)${sep}.*`),
];

module.exports = config;
