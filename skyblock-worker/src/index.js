const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const HYPIXEL_API = "https://api.hypixel.net/v2";
const MOJANG_PROFILE_API = "https://api.mojang.com/users/profiles/minecraft";
const OFFICIAL_WIKI_BASE = "https://wiki.hypixel.net";

const MP_BY_RARITY = {
  COMMON: 3,
  UNCOMMON: 5,
  RARE: 8,
  EPIC: 12,
  LEGENDARY: 16,
  MYTHIC: 22,
  SPECIAL: 3,
  VERY_SPECIAL: 5,
};

const METHOD_LABELS = {
  auction: "Auction House",
  bazaar: "Bazaar",
  craft: "Crafted",
  upgrade: "Upgrade",
  npc: "NPC",
  other: "Other",
};

// Manual rules are intentionally small overlays. The live Hypixel item catalog,
// Bazaar API, and Auction House API still drive the main data; these rules cover
// official-wiki special cases and shop/craft prices that are not exposed in the
// item resource endpoint.
const ACCESSORY_OVERRIDES = {
  HEGEMONY_ARTIFACT: {
    magicPower: 32,
    note: "The official wiki lists this as doubling its own Magical Power.",
  },
  RIFT_PRISM: {
    unpriced: true,
    reason: "Consumed item with special Magical Power behavior, not a normal market accessory.",
    obtain: "Rift progression and special obtainment.",
    magicPower: 11,
  },
  JACOBUS_REGISTER: {
    unpriced: true,
    reason: "Profile progression reward with no stable market purchase.",
    obtain: "Accessory Bag slot purchases from Jacobus.",
  },
  MELODY_HAIR: {
    unpriced: true,
    reason: "Soulbound quest reward.",
    obtain: "Complete Melody's Harp songs.",
  },
  KING_TALISMAN: {
    unpriced: true,
    reason: "Profile progression reward or Rusty recovery item.",
    obtain: "Dwarven Mines King reward.",
  },
  PIGS_FOOT: {
    unpriced: true,
    reason: "One-time race reward or Rusty recovery item.",
    obtain: "End Race reward.",
  },
  FROZEN_CHICKEN: {
    unpriced: true,
    reason: "One-time race reward or Rusty recovery item.",
    obtain: "Chicken Race reward.",
  },
  WOLF_PAW: {
    unpriced: true,
    reason: "One-time race reward or Rusty recovery item.",
    obtain: "Woods Race reward.",
  },
  ARCHAEOLOGIST_COMPASS: {
    unpriced: true,
    reason: "Soulbound quest reward.",
    obtain: "Archaeologist relic progression.",
  },
};

const NPC_PRICE_OVERRIDES = {
  ZOMBIE_TALISMAN: {
    cost: 500,
    obtain: "Adventurer shop.",
  },
  SKELETON_TALISMAN: {
    cost: 500,
    obtain: "Adventurer shop.",
  },
  VILLAGE_AFFINITY_TALISMAN: {
    cost: 2500,
    obtain: "Adventurer shop.",
  },
  MINE_AFFINITY_TALISMAN: {
    cost: 2500,
    obtain: "Adventurer shop.",
  },
  INTIMIDATION_TALISMAN: {
    cost: 10000,
    obtain: "Adventurer shop.",
  },
  SCAVENGER_TALISMAN: {
    cost: 10000,
    obtain: "Adventurer shop.",
  },
};

const RECIPE_OVERRIDES = {
  SPEED_TALISMAN: {
    method: "craft",
    materials: [{ id: "SUGAR_CANE", amount: 108 }],
  },
  VACCINE_TALISMAN: {
    method: "craft",
    materials: [{ id: "POISONOUS_POTATO", amount: 9 }],
  },
  FARMING_TALISMAN: {
    method: "craft",
    materials: [
      { id: "WHEAT", amount: 144 },
      { id: "SEEDS", amount: 144 },
    ],
  },
};

const SPECIAL_NAME_PATTERNS = [
  /campfire/i,
  /soul campfire/i,
  /ring of love/i,
  /broken love/i,
  /odger/i,
  /kuudra follower/i,
  /tiny dancer/i,
  /vampire dentist/i,
  /blood donor/i,
  /agarimoo/i,
  /crux/i,
  /lush (talisman|ring|artifact)/i,
  /future calories/i,
  /hocus-pocus/i,
  /bluetooth ring/i,
  /test bucket please ignore/i,
];

const FAMILY_SUFFIX_RANK = {
  TALISMAN: 1,
  RING: 2,
  ARTIFACT: 3,
  RELIC: 4,
  HEIRLOOM: 5,
  CHRONOMICON: 6,
};

const jsonResponse = (payload, status = 200, origin = "") => {
  const headers = new Headers(JSON_HEADERS);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return new Response(JSON.stringify(payload), { status, headers });
};

const getAllowedOrigin = (request, env) => {
  const origin = request.headers.get("Origin") || "";
  if (!origin) return "";

  const allowedOrigins = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return allowedOrigins.includes(origin) ? origin : null;
};

const ttl = (env, key, fallback) => {
  const parsed = Number(env[key] || fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const cacheJson = async (key, seconds, producer, ctx) => {
  const cache = caches.default;
  const request = new Request(`https://skyblock-cache.local/${key}`);
  const cached = await cache.match(request);
  if (cached) return cached.json();

  const value = await producer();
  const response = new Response(JSON.stringify(value), {
    headers: {
      "Cache-Control": `s-maxage=${seconds}`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
  ctx.waitUntil(cache.put(request, response));
  return value;
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (response.status === 204) {
    throw new Error("204: empty response");
  }
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText || "request failed"}`);
  }
  return response.json();
};

const normalizeUuid = (value) => value.replace(/-/g, "").toLowerCase();

const dashedUuid = (value) => {
  const uuid = normalizeUuid(value);
  return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
};

const isUuid = (value) => /^[0-9a-fA-F-]{32,36}$/.test(value.trim());

const wikiUrlForName = (name) =>
  `${OFFICIAL_WIKI_BASE}/${encodeURIComponent(name.replace(/\s+/g, "_"))}`;

const normalizeRarity = (rarity) => {
  const normalized = String(rarity || "COMMON")
    .replace(/_/g, " ")
    .toUpperCase();
  return MP_BY_RARITY[normalized] ? normalized : "COMMON";
};

const normalizeName = (value) =>
  String(value || "")
    .replace(/§./g, "")
    .replace(/[✪➊➋➌➍➎]/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const makeFamily = (name, id) => {
  // Item matching: Hypixel stores exact item IDs in NBT, but upgrade chains
  // should be compared as a family. If a player owns Speed Artifact, the lower
  // Speed Talisman/Ring tiers are already covered and should not be suggested.
  const compactId = String(id || "");
  const personalMatch = compactId.match(/^(PERSONAL_(?:COMPACTOR|DELETOR))_(\d+)$/);
  if (personalMatch) {
    return {
      key: personalMatch[1],
      rank: Number(personalMatch[2]),
    };
  }

  const masterSkullMatch = name.match(/^Master Skull - Tier (\d+)/i);
  if (masterSkullMatch) {
    return {
      key: "MASTER_SKULL",
      rank: Number(masterSkullMatch[1]),
    };
  }

  const suffixMatch = name.match(/^(.+?)\s+(Talisman|Ring|Artifact|Relic|Heirloom|Chronomicon)$/i);
  if (!suffixMatch) {
    return {
      key: compactId || normalizeName(name),
      rank: 1,
    };
  }

  const suffix = suffixMatch[2].toUpperCase();
  return {
    key: normalizeName(suffixMatch[1]).replace(/[^a-z0-9]+/g, "_"),
    rank: FAMILY_SUFFIX_RANK[suffix] || 1,
  };
};

const getAccessoryMagicPower = (accessory) => {
  // Magical Power comes from rarity, with a small number of official special
  // cases. Recombobulated personal copies are not priced here; recommendations
  // use the normal obtainable accessory rarity from the live item catalog.
  const override = ACCESSORY_OVERRIDES[accessory.id];
  if (Number.isFinite(override?.magicPower)) return override.magicPower;
  return MP_BY_RARITY[accessory.rarity] || 0;
};

const resolvePlayer = async (username, env, ctx) => {
  if (isUuid(username)) {
    return {
      uuid: normalizeUuid(username),
      dashedUuid: dashedUuid(username),
      username: username,
    };
  }

  const cleanName = username.trim();
  if (!/^[A-Za-z0-9_]{2,16}$/.test(cleanName)) {
    throw new UserError("That Minecraft username is not valid.", 400);
  }

  const profile = await cacheJson(
    `mojang-${cleanName.toLowerCase()}`,
    ttl(env, "RESOURCE_CACHE_TTL", 21600),
    async () => fetchJson(`${MOJANG_PROFILE_API}/${encodeURIComponent(cleanName)}`),
    ctx,
  ).catch((error) => {
    if (String(error.message).startsWith("204")) {
      throw new UserError("Mojang could not find that Minecraft username.", 404);
    }
    throw error;
  });

  if (!profile?.id) {
    throw new UserError("Mojang could not find that Minecraft username.", 404);
  }

  return {
    uuid: normalizeUuid(profile.id),
    dashedUuid: dashedUuid(profile.id),
    username: profile.name || cleanName,
  };
};

const hypixelHeaders = (env) => ({
  Accept: "application/json",
  "API-Key": env.HYPIXEL_API_KEY,
});

const fetchProfiles = async (uuid, env, ctx) => {
  if (!env.HYPIXEL_API_KEY) {
    throw new UserError("The Hypixel API key is not configured on the backend.", 503);
  }

  const payload = await cacheJson(
    `profiles-${uuid}`,
    ttl(env, "MARKET_CACHE_TTL", 60),
    async () =>
      fetchJson(`${HYPIXEL_API}/skyblock/profiles?uuid=${encodeURIComponent(uuid)}`, {
        headers: hypixelHeaders(env),
      }),
    ctx,
  ).catch((error) => {
    if (String(error.message).startsWith("403")) {
      throw new UserError("Hypixel rejected the API key.", 503);
    }
    if (String(error.message).startsWith("429")) {
      throw new UserError("Hypixel API rate limit reached. Try again shortly.", 429);
    }
    throw error;
  });

  if (!payload.success) {
    throw new UserError("Hypixel did not return SkyBlock profile data.", 502);
  }
  if (!Array.isArray(payload.profiles) || payload.profiles.length === 0) {
    throw new UserError("No SkyBlock profiles were found for this player.", 404);
  }

  return payload.profiles;
};

const selectProfile = (profiles, uuid, requestedProfile) => {
  const normalizedRequest = normalizeName(requestedProfile);
  const selected =
    normalizedRequest &&
    profiles.find((profile) => {
      return (
        normalizeName(profile.cute_name) === normalizedRequest ||
        normalizeName(profile.profile_id) === normalizedRequest
      );
    });

  if (selected) return selected;

  return profiles
    .slice()
    .sort((left, right) => {
      const leftMember = left.members?.[uuid] || {};
      const rightMember = right.members?.[uuid] || {};
      return Number(rightMember.last_save || 0) - Number(leftMember.last_save || 0);
    })[0];
};

const serializeProfiles = (profiles) =>
  profiles.map((profile) => ({
    profileId: profile.profile_id,
    cuteName: profile.cute_name || profile.profile_id,
  }));

const fetchItemCatalog = async (env, ctx) => {
  const payload = await cacheJson(
    "hypixel-items-v1",
    ttl(env, "RESOURCE_CACHE_TTL", 21600),
    async () => fetchJson(`${HYPIXEL_API}/resources/skyblock/items`),
    ctx,
  );

  const items = Array.isArray(payload.items) ? payload.items : [];
  const itemNames = new Map(items.map((item) => [item.id, item.name || item.id]));

  const accessories = items
    .filter((item) => item.category === "ACCESSORY")
    .filter((item) => item.id && item.name)
    .map((item) => {
      const rarity = normalizeRarity(item.tier);
      const family = makeFamily(item.name, item.id);
      return {
        id: item.id,
        name: item.name,
        rarity,
        baseMagicPower: getAccessoryMagicPower({ id: item.id, rarity }),
        familyKey: family.key,
        familyRank: family.rank,
        npcBuyPrice: item.npc_buy_price,
        soulbound: Boolean(item.soulbound),
        wikiUrl: wikiUrlForName(item.name),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    accessories,
    byId: new Map(accessories.map((item) => [item.id, item])),
    itemNames,
  };
};

const fetchBazaar = async (env, ctx) => {
  const payload = await cacheJson(
    "hypixel-bazaar-v1",
    ttl(env, "MARKET_CACHE_TTL", 60),
    async () => fetchJson(`${HYPIXEL_API}/skyblock/bazaar`),
    ctx,
  );
  return payload.products || {};
};

const hashNames = async (names) => {
  const bytes = new TextEncoder().encode(names.sort().join("|"));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
};

const fetchAuctionPriceIndex = async (accessories, env, ctx) => {
  const names = accessories.map((item) => normalizeName(item.name)).filter(Boolean);
  const hash = await hashNames(names);
  const nameSet = new Set(names);

  return cacheJson(
    `auction-index-${hash}`,
    ttl(env, "AUCTION_CACHE_TTL", 300),
    async () => {
      const firstPage = await fetchJson(`${HYPIXEL_API}/skyblock/auctions?page=0`);
      const totalPages = Math.min(
        Number(firstPage.totalPages || 1),
        ttl(env, "AUCTION_PAGE_LIMIT", 80),
      );
      const index = {};

      const processPage = (page) => {
        const auctions = Array.isArray(page.auctions) ? page.auctions : [];
        auctions.forEach((auction) => {
          if (!auction.bin || auction.claimed) return;
          const normalized = normalizeName(auction.item_name);
          if (!nameSet.has(normalized)) return;

          const price = Number(auction.starting_bid);
          if (!Number.isFinite(price) || price <= 0) return;
          if (!index[normalized] || price < index[normalized].cost) {
            index[normalized] = {
              cost: price,
              auctionUuid: auction.uuid,
              itemName: auction.item_name,
            };
          }
        });
      };

      processPage(firstPage);

      const pages = [];
      for (let page = 1; page < totalPages; page += 1) pages.push(page);
      for (let indexStart = 0; indexStart < pages.length; indexStart += 5) {
        const batch = pages.slice(indexStart, indexStart + 5);
        const results = await Promise.allSettled(
          batch.map((page) => fetchJson(`${HYPIXEL_API}/skyblock/auctions?page=${page}`)),
        );
        results.forEach((result) => {
          if (result.status === "fulfilled") processPage(result.value);
        });
      }

      return index;
    },
    ctx,
  );
};

const priceFromBazaar = (productId, bazaar) => {
  const product = bazaar[productId];
  const price = Number(product?.quick_status?.sellPrice);
  return Number.isFinite(price) && price > 0 ? price : null;
};

const materialName = (id, itemNames) => itemNames.get(id) || id.replace(/_/g, " ").toLowerCase();

const calculateRecipeCost = (recipe, bazaar, itemNames) => {
  const materials = [];
  let total = 0;

  for (const material of recipe.materials || []) {
    const unitPrice = priceFromBazaar(material.id, bazaar);
    if (!Number.isFinite(unitPrice)) {
      return null;
    }
    const amount = Number(material.amount || 0);
    total += unitPrice * amount;
    materials.push({
      id: material.id,
      name: materialName(material.id, itemNames),
      amount,
      unitPrice,
    });
  }

  return {
    cost: total,
    materials,
  };
};

const specialReasonFor = (accessory) => {
  // Special-case handling: soulbound, quest, event, and profile-progression
  // accessories are kept out of the priced table unless a reliable live market
  // source is available. They still appear with obtainment notes and wiki links.
  const override = ACCESSORY_OVERRIDES[accessory.id];
  if (override?.unpriced) return override;
  if (accessory.soulbound) {
    return {
      reason: "Soulbound item with no reliable market price.",
      obtain: "Profile-specific progression or reward.",
    };
  }
  const patternMatch = SPECIAL_NAME_PATTERNS.find((pattern) => pattern.test(accessory.name));
  if (patternMatch) {
    return {
      reason: "Quest, event, profile progression, or soulbound-style obtainment.",
      obtain: "See the official wiki page for the current obtainment details.",
    };
  }
  return null;
};

const priceAccessory = (accessory, bazaar, auctionIndex, itemNames) => {
  // Pricing order is deliberately conservative:
  // 1. official-wiki/manual unpriced overrides
  // 2. known NPC prices
  // 3. maintained Bazaar recipe overlays
  // 4. Hypixel item-resource NPC prices
  // 5. direct Bazaar products
  // 6. live Auction House lowest BIN
  // Anything still unresolved is moved to the special/unpriced section.
  const override = ACCESSORY_OVERRIDES[accessory.id];
  const npcOverride = NPC_PRICE_OVERRIDES[accessory.id];
  const recipeOverride = RECIPE_OVERRIDES[accessory.id];

  if (override?.unpriced) {
    return {
      special: true,
      reason: override.reason,
      obtain: override.obtain,
    };
  }

  if (npcOverride) {
    return {
      method: "npc",
      methodLabel: METHOD_LABELS.npc,
      cost: npcOverride.cost,
      materialsText: npcOverride.obtain,
      source: npcOverride.obtain,
    };
  }

  if (recipeOverride) {
    const recipe = calculateRecipeCost(recipeOverride, bazaar, itemNames);
    if (recipe) {
      return {
        method: recipeOverride.method || "craft",
        methodLabel: METHOD_LABELS[recipeOverride.method || "craft"],
        cost: recipe.cost,
        materials: recipe.materials,
        source: "Crafting recipe priced from live Bazaar sell offers.",
      };
    }
  }

  const npcPrice = Number(accessory.npcBuyPrice);
  if (Number.isFinite(npcPrice) && npcPrice > 0) {
    return {
      method: "npc",
      methodLabel: METHOD_LABELS.npc,
      cost: npcPrice,
      materialsText: "NPC shop purchase.",
      source: "Hypixel item metadata NPC buy price.",
    };
  }

  const directBazaar = priceFromBazaar(accessory.id, bazaar);
  if (Number.isFinite(directBazaar)) {
    return {
      method: "bazaar",
      methodLabel: METHOD_LABELS.bazaar,
      cost: directBazaar,
      materialsText: "Direct Bazaar product.",
      source: "Live Bazaar sell offer.",
    };
  }

  const auction = auctionIndex[normalizeName(accessory.name)];
  if (auction?.cost) {
    return {
      method: "auction",
      methodLabel: METHOD_LABELS.auction,
      cost: auction.cost,
      materialsText: "Lowest BIN found in current Auction House data.",
      source: "Live Auction House lowest BIN.",
    };
  }

  const special = specialReasonFor(accessory);
  if (special) {
    return {
      special: true,
      reason: special.reason,
      obtain: special.obtain,
    };
  }

  return {
    special: true,
    reason: "No live Auction House, Bazaar, NPC, or maintained recipe price was found.",
    obtain: "Drop, event, collection, progression, or wiki-specific obtainment.",
  };
};

const buildOwnedFamilyState = (ownedIds, catalog) => {
  const ownedFamilies = new Map();
  const ownedAccessories = [];

  ownedIds.forEach((id) => {
    const accessory = catalog.byId.get(id);
    if (!accessory) return;
    ownedAccessories.push(accessory);
    const current = ownedFamilies.get(accessory.familyKey);
    if (!current || accessory.familyRank > current.rank) {
      ownedFamilies.set(accessory.familyKey, {
        rank: accessory.familyRank,
        magicPower: accessory.baseMagicPower,
      });
    }
  });

  return {
    ownedFamilies,
    ownedAccessories,
  };
};

const estimateMagicPowerFromFamilies = (ownedIds, catalog) => {
  const { ownedFamilies } = buildOwnedFamilyState(ownedIds, catalog);
  return [...ownedFamilies.values()].reduce(
    (total, family) => total + Number(family.magicPower || 0),
    0,
  );
};

const getInitialDelta = (accessory, ownedFamilies) => {
  // Magic Power gained is the delta from the player's current highest owned
  // tier in the same accessory family, not always the item's full rarity value.
  const owned = ownedFamilies.get(accessory.familyKey);
  if (!owned) return accessory.baseMagicPower;
  if (owned.rank >= accessory.familyRank) return 0;
  return Math.max(0, accessory.baseMagicPower - owned.magicPower);
};

const buildRecommendations = (catalog, ownedIds, bazaar, auctionIndex) => {
  const { ownedFamilies, ownedAccessories } = buildOwnedFamilyState(ownedIds, catalog);
  const recommendations = [];
  const special = [];

  catalog.accessories.forEach((accessory) => {
    const magicPower = getInitialDelta(accessory, ownedFamilies);
    if (magicPower <= 0) return;

    const price = priceAccessory(accessory, bazaar, auctionIndex, catalog.itemNames);
    const common = {
      id: accessory.id,
      name: accessory.name,
      rarity: accessory.rarity,
      baseMagicPower: accessory.baseMagicPower,
      magicPower,
      familyKey: accessory.familyKey,
      familyRank: accessory.familyRank,
      wikiUrl: accessory.wikiUrl,
    };

    if (price.special) {
      special.push({
        ...common,
        reason: price.reason,
        obtain: price.obtain,
      });
      return;
    }

    const costPerMp = price.cost / magicPower;
    recommendations.push({
      ...common,
      method: price.method,
      methodLabel: price.methodLabel,
      cost: price.cost,
      costPerMp,
      materials: price.materials || [],
      materialsText: price.materialsText || "",
      priceNote: price.source || "",
    });
  });

  recommendations.sort((left, right) => left.costPerMp - right.costPerMp);
  special.sort((left, right) => left.name.localeCompare(right.name));

  return {
    recommendations,
    special,
    ownedAccessories,
  };
};

const buildTargetPath = (recommendations, ownedIds, catalog, targetMagicPower, currentMagicPower) => {
  const { ownedFamilies } = buildOwnedFamilyState(ownedIds, catalog);
  const familyState = new Map(ownedFamilies);
  const remaining = recommendations.slice();
  const items = [];
  let gained = 0;
  let totalCost = 0;

  while (currentMagicPower + gained < targetMagicPower) {
    let best = null;
    let bestIndex = -1;

    remaining.forEach((candidate, index) => {
      const current = familyState.get(candidate.familyKey);
      const currentMp = Number(current?.magicPower || 0);
      const currentRank = Number(current?.rank || 0);
      if (currentRank >= candidate.familyRank) return;

      const delta = Math.max(0, candidate.baseMagicPower - currentMp);
      if (!delta) return;

      const effectiveCostPerMp = candidate.cost / delta;
      if (!best || effectiveCostPerMp < best.effectiveCostPerMp) {
        best = {
          ...candidate,
          magicPower: delta,
          costPerMp: effectiveCostPerMp,
          effectiveCostPerMp,
        };
        bestIndex = index;
      }
    });

    if (!best) break;

    items.push(best);
    gained += best.magicPower;
    totalCost += best.cost;
    familyState.set(best.familyKey, {
      rank: best.familyRank,
      magicPower: best.baseMagicPower,
    });
    remaining.splice(bestIndex, 1);
  }

  return {
    targetMagicPower,
    currentMagicPower,
    magicPowerGained: gained,
    totalCost,
    items,
    message:
      currentMagicPower + gained >= targetMagicPower
        ? "Target reached by priced recommendations."
        : "Not enough priced recommendations are available to reach this target.",
  };
};

const findMagicPowerValue = (value) => {
  const found = [];
  const walk = (node, path = "") => {
    if (!node || typeof node !== "object") return;
    Object.entries(node).forEach(([key, child]) => {
      const nextPath = `${path}.${key}`.toLowerCase();
      if (
        typeof child === "number" &&
        Number.isFinite(child) &&
        (nextPath.includes("magical_power") || nextPath.includes("magic_power"))
      ) {
        found.push(child);
      }
      if (child && typeof child === "object") walk(child, nextPath);
    });
  };
  walk(value);
  return found.length ? Math.max(...found) : null;
};

const collectAccessoryInventoryBlobs = (member) => {
  // Profile parsing: Hypixel inventory fields are base64-encoded gzipped NBT.
  // The exact path has changed over time, so this searches member data for
  // talisman/accessory bag data fields instead of relying on one brittle path.
  const blobs = [];
  const walk = (node, path = "") => {
    if (!node || typeof node !== "object") return;

    Object.entries(node).forEach(([key, child]) => {
      const nextPath = `${path}.${key}`;
      const lowerPath = nextPath.toLowerCase();
      if (
        key === "data" &&
        typeof child === "string" &&
        (lowerPath.includes("talisman") || lowerPath.includes("accessory"))
      ) {
        blobs.push(child);
        return;
      }
      if (child && typeof child === "object") walk(child, nextPath);
    });
  };
  walk(member);
  return [...new Set(blobs)];
};

const gunzip = async (bytes) => {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This runtime does not support gzip decompression.");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const decodeBase64Bytes = (value) => {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

class NbtReader {
  constructor(bytes) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.offset = 0;
    this.decoder = new TextDecoder();
  }

  byte() {
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  unsignedByte() {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  short() {
    const value = this.view.getInt16(this.offset, false);
    this.offset += 2;
    return value;
  }

  int() {
    const value = this.view.getInt32(this.offset, false);
    this.offset += 4;
    return value;
  }

  long() {
    const value = this.view.getBigInt64(this.offset, false);
    this.offset += 8;
    return Number(value);
  }

  float() {
    const value = this.view.getFloat32(this.offset, false);
    this.offset += 4;
    return value;
  }

  double() {
    const value = this.view.getFloat64(this.offset, false);
    this.offset += 8;
    return value;
  }

  string() {
    const length = this.view.getUint16(this.offset, false);
    this.offset += 2;
    const bytes = new Uint8Array(this.view.buffer, this.view.byteOffset + this.offset, length);
    this.offset += length;
    return this.decoder.decode(bytes);
  }

  payload(type) {
    switch (type) {
      case 1:
        return this.byte();
      case 2:
        return this.short();
      case 3:
        return this.int();
      case 4:
        return this.long();
      case 5:
        return this.float();
      case 6:
        return this.double();
      case 7: {
        const length = this.int();
        const values = [];
        for (let index = 0; index < length; index += 1) values.push(this.byte());
        return values;
      }
      case 8:
        return this.string();
      case 9: {
        const childType = this.unsignedByte();
        const length = this.int();
        const values = [];
        for (let index = 0; index < length; index += 1) {
          values.push(this.payload(childType));
        }
        return values;
      }
      case 10: {
        const value = {};
        while (true) {
          const childType = this.unsignedByte();
          if (childType === 0) return value;
          const name = this.string();
          value[name] = this.payload(childType);
        }
      }
      case 11: {
        const length = this.int();
        const values = [];
        for (let index = 0; index < length; index += 1) values.push(this.int());
        return values;
      }
      case 12: {
        const length = this.int();
        const values = [];
        for (let index = 0; index < length; index += 1) values.push(this.long());
        return values;
      }
      default:
        throw new Error(`Unsupported NBT tag type ${type}.`);
    }
  }

  root() {
    const type = this.unsignedByte();
    if (type !== 10) throw new Error("Expected an NBT compound root.");
    this.string();
    return this.payload(type);
  }
}

const parseNbt = (bytes) => new NbtReader(bytes).root();

const collectExtraAttributeIds = (node, ids = new Set()) => {
  if (!node || typeof node !== "object") return ids;
  if (typeof node.ExtraAttributes?.id === "string") {
    ids.add(node.ExtraAttributes.id);
  }
  if (typeof node.tag?.ExtraAttributes?.id === "string") {
    ids.add(node.tag.ExtraAttributes.id);
  }
  if (Array.isArray(node)) {
    node.forEach((child) => collectExtraAttributeIds(child, ids));
  } else {
    Object.values(node).forEach((child) => collectExtraAttributeIds(child, ids));
  }
  return ids;
};

const extractOwnedAccessoryIds = async (member, catalog) => {
  const blobs = collectAccessoryInventoryBlobs(member);
  const ids = new Set();
  const warnings = [];

  if (!blobs.length) {
    throw new UserError(
      "Accessory bag data was not present. The player's inventory API may be disabled or private.",
      403,
    );
  }

  for (const blob of blobs) {
    try {
      const inflated = await gunzip(decodeBase64Bytes(blob));
      const nbt = parseNbt(inflated);
      collectExtraAttributeIds(nbt, ids);
    } catch (error) {
      warnings.push("One accessory bag inventory blob could not be decoded.");
    }
  }

  if (warnings.length === blobs.length) {
    throw new UserError("Accessory bag data was present but could not be decoded.", 502);
  }

  const accessoryIds = new Set(
    [...ids]
      .map((id) => String(id).toUpperCase())
      .filter((id) => catalog.byId.has(id)),
  );

  return {
    ids: accessoryIds,
    warnings,
  };
};

class UserError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const handleRecommendations = async (request, env, ctx, origin) => {
  const url = new URL(request.url);
  const username = url.searchParams.get("username") || "";
  const requestedProfile = url.searchParams.get("profile") || "";
  const targetMagicPower = Number(url.searchParams.get("target") || 500);

  if (!username.trim()) {
    throw new UserError("Username is required.", 400);
  }

  const player = await resolvePlayer(username, env, ctx);
  const [profiles, catalog, bazaar] = await Promise.all([
    fetchProfiles(player.uuid, env, ctx),
    fetchItemCatalog(env, ctx),
    fetchBazaar(env, ctx),
  ]);

  const selectedProfile = selectProfile(profiles, player.uuid, requestedProfile);
  const member = selectedProfile?.members?.[player.uuid];
  if (!member) {
    throw new UserError("This player is not a member of the selected SkyBlock profile.", 404);
  }

  const profileList = serializeProfiles(profiles);

  const owned = await extractOwnedAccessoryIds(member, catalog);
  const missingAccessoriesForAh = catalog.accessories.filter((accessory) => !owned.ids.has(accessory.id));
  const auctionIndex = await fetchAuctionPriceIndex(missingAccessoriesForAh, env, ctx);
  const priced = buildRecommendations(catalog, owned.ids, bazaar, auctionIndex);
  const estimatedMagicPower = estimateMagicPowerFromFamilies(owned.ids, catalog);
  const apiMagicPower = findMagicPowerValue(member);
  const currentMagicPower = Number.isFinite(apiMagicPower)
    ? apiMagicPower
    : estimatedMagicPower;

  const safeTarget = [500, 1000, 1500].includes(targetMagicPower)
    ? targetMagicPower
    : 500;
  const path = buildTargetPath(
    priced.recommendations,
    owned.ids,
    catalog,
    safeTarget,
    currentMagicPower,
  );

  const warnings = [
    ...owned.warnings,
    ...(Number.isFinite(apiMagicPower)
      ? []
      : ["Current Magical Power is estimated because the API did not expose a direct value."]),
  ];

  return jsonResponse(
    {
      player: {
        username: player.username,
        uuid: player.dashedUuid,
      },
      profile: {
        profileId: selectedProfile.profile_id,
        cuteName: selectedProfile.cute_name || selectedProfile.profile_id,
      },
      profiles: profileList,
      summary: {
        currentMagicPower,
        estimatedMagicPower,
        totalAccessories: catalog.accessories.length,
        ownedAccessoryCount: priced.ownedAccessories.length,
        pricedMissingCount: priced.recommendations.length,
        specialMissingCount: priced.special.length,
      },
      path,
      recommendations: priced.recommendations,
      special: priced.special,
      warnings,
    },
    200,
    origin,
  );
};

const handleProfiles = async (request, env, ctx, origin) => {
  const url = new URL(request.url);
  const username = url.searchParams.get("username") || "";

  if (!username.trim()) {
    throw new UserError("Username is required.", 400);
  }

  const player = await resolvePlayer(username, env, ctx);
  const profiles = await fetchProfiles(player.uuid, env, ctx);

  return jsonResponse(
    {
      player: {
        username: player.username,
        uuid: player.dashedUuid,
      },
      profiles: serializeProfiles(profiles),
    },
    200,
    origin,
  );
};

export default {
  async fetch(request, env, ctx) {
    const allowedOrigin = getAllowedOrigin(request, env);
    if (allowedOrigin === null) {
      return jsonResponse({ error: "Origin not allowed." }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin || "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "Method not allowed." }, 405, allowedOrigin);
    }

    const url = new URL(request.url);
    if (url.pathname.endsWith("/profiles")) {
      try {
        return await handleProfiles(request, env, ctx, allowedOrigin);
      } catch (error) {
        const status = error instanceof UserError ? error.status : 500;
        return jsonResponse(
          {
            error:
              error.message ||
              "The SkyBlock profile service could not complete this lookup.",
          },
          status,
          allowedOrigin,
        );
      }
    }

    if (!url.pathname.endsWith("/recommendations")) {
      return jsonResponse({ ok: true, service: "SkyBlock Magic Power backend" }, 200, allowedOrigin);
    }

    try {
      return await handleRecommendations(request, env, ctx, allowedOrigin);
    } catch (error) {
      const status = error instanceof UserError ? error.status : 500;
      return jsonResponse(
        {
          error:
            error.message ||
            "The SkyBlock recommendation service could not complete this lookup.",
        },
        status,
        allowedOrigin,
      );
    }
  },
};
