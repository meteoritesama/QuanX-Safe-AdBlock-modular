/*
 * QuanX Safe AdBlock V3 - Bilibili minimal cleaner
 *
 * Security properties:
 * - No network requests ($task.fetch / $httpClient)
 * - No cookies or request headers are read
 * - No persistent storage ($prefs / $persistentStore)
 * - No eval / Function / dynamic code loading
 * - Only parses the current response JSON, removes explicit ad objects,
 *   and returns the modified JSON with $done()
 */

"use strict";

const url = $request.url;
const originalBody = $response.body;

function own(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function adToken(value) {
  if (typeof value !== "string") return false;
  const s = value.toLowerCase();
  return /(^|[_-])ad([_-]|$)/.test(s) || s === "ad";
}

function isExplicitAd(item) {
  if (!item || typeof item !== "object") return false;

  if (own(item, "ad_info") && item.ad_info) return true;
  if (item.is_ad === true || item.is_ad === 1) return true;
  if (item.is_ad_loc === true || item.is_ad_loc === 1) return true;
  if (item.cm_mark === 1) return true;

  if (adToken(item.card_goto)) return true;
  if (adToken(item.goto)) return true;

  if (item.source_content &&
      typeof item.source_content === "object" &&
      item.source_content.ad_content) {
    return true;
  }

  return false;
}

function cleanBannerArray(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.filter((banner) => {
    if (!banner || typeof banner !== "object") return true;
    if (banner.type === "ad") return false;
    if (banner.static_banner &&
        (banner.static_banner.is_ad_loc === true ||
         banner.static_banner.is_ad_loc === 1)) {
      return false;
    }
    return !isExplicitAd(banner);
  });
}

function cleanFeed(obj) {
  if (!obj || !obj.data || !Array.isArray(obj.data.items)) return;

  const cleaned = [];
  for (const item of obj.data.items) {
    if (!item || typeof item !== "object") {
      cleaned.push(item);
      continue;
    }

    if (isExplicitAd(item)) continue;

    if (Array.isArray(item.banner_item)) {
      const originalLength = item.banner_item.length;
      item.banner_item = cleanBannerArray(item.banner_item);

      // If this container was only an advertisement banner, remove the empty container.
      if (originalLength > 0 && item.banner_item.length === 0) continue;
    }

    cleaned.push(item);
  }
  obj.data.items = cleaned;
}

function cleanSplashList(obj) {
  if (!obj || !obj.data || !Array.isArray(obj.data.list)) return;

  // Do not reject the whole preload API. Move every preloaded ad outside
  // the usable time window and set its display duration to zero.
  for (const item of obj.data.list) {
    if (!item || typeof item !== "object") continue;
    item.duration = 0;
    item.begin_time = 2240150400; // 2040-12-29 UTC, intentionally far future.
    item.end_time = 2240150400;
  }
}

function cleanLiveRoom(obj) {
  if (!obj || !obj.data || typeof obj.data !== "object") return;
  if (own(obj.data, "activity_banner_info")) {
    obj.data.activity_banner_info = null;
  }
}

function cleanPgcPage(obj) {
  if (!obj || !obj.result || !Array.isArray(obj.result.modules)) return;

  for (const module of obj.result.modules) {
    if (!module || typeof module !== "object" || !Array.isArray(module.items)) continue;
    module.items = module.items.filter((item) => !isExplicitAd(item));
  }
}

function cleanRelated(obj) {
  const candidates = [];
  if (obj && obj.data && typeof obj.data === "object") candidates.push(obj.data);
  if (obj && obj.result && typeof obj.result === "object") candidates.push(obj.result);

  for (const container of candidates) {
    for (const key of ["items", "list", "recommend", "cards"]) {
      if (Array.isArray(container[key])) {
        container[key] = container[key].filter((item) => !isExplicitAd(item));
      }
    }
  }
}

try {
  const obj = JSON.parse(originalBody);

  if (/\/x\/v2\/splash\/list(?:\?|$)/.test(url)) {
    cleanSplashList(obj);
  } else if (/\/x\/v2\/feed\/index(?:\?|$)/.test(url)) {
    cleanFeed(obj);
  } else if (/\/xlive\/app-room\/v1\/index\/getInfoByRoom/.test(url)) {
    cleanLiveRoom(obj);
  } else if (/\/pgc\/page\/(bangumi|cinema\/tab)/.test(url)) {
    cleanPgcPage(obj);
  } else if (/\/pgc\/season\/app\/related\/recommend/.test(url)) {
    cleanRelated(obj);
  }

  $done({ body: JSON.stringify(obj) });
} catch (e) {
  // Fail open: if Bilibili changes its JSON format, return the original body
  // instead of breaking the application.
  $done({ body: originalBody });
}
