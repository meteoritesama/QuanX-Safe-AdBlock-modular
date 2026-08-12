/*
 * QuanX Safe AdBlock - Weibo conservative cleaner
 *
 * Security boundary:
 * - No $task.fetch / $httpClient
 * - No $prefs / $persistentStore
 * - No cookies or request-header collection
 * - No eval / Function / dynamic code loading
 * - No VIP, skin, tab, subscription, or account modification
 * - Fail-open: unexpected JSON is returned unchanged
 */

"use strict";

const url = $request.url;
const originalBody = $response.body;

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function textHasAd(value) {
  if (typeof value !== "string") return false;
  const s = value.toLowerCase();
  return (
    s === "广告" ||
    s === "廣告" ||
    s === "热推" ||
    s === "推薦" ||
    s === "推荐广告" ||
    s === "ad" ||
    s === "ads" ||
    s.includes("ads_word") ||
    s.includes("res_from:ads")
  );
}

function isExplicitAd(obj) {
  if (!obj || typeof obj !== "object") return false;

  if (textHasAd(obj.mblogtypename)) return true;
  if (textHasAd(obj.adType) || textHasAd(obj.ad_type)) return true;

  if (obj.promotion && textHasAd(obj.promotion.type)) return true;

  const source =
    obj.page_info &&
    obj.page_info.actionlog &&
    obj.page_info.actionlog.source;
  if (textHasAd(source)) return true;

  const authTitle =
    obj.content_auth_info &&
    obj.content_auth_info.content_auth_title;
  if (textHasAd(authTitle)) return true;

  const ext = obj.actionlog && obj.actionlog.ext;
  if (textHasAd(ext)) return true;

  if (typeof obj.itemid === "string" && textHasAd(obj.itemid)) return true;

  return false;
}

function cleanArray(arr) {
  if (!Array.isArray(arr)) return arr;

  const result = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") {
      result.push(item);
      continue;
    }

    if (isExplicitAd(item) || isExplicitAd(item.mblog) || isExplicitAd(item.data)) {
      continue;
    }

    if (Array.isArray(item.card_group)) {
      item.card_group = cleanArray(item.card_group);
    }
    if (Array.isArray(item.items)) {
      item.items = cleanArray(item.items);
    }

    result.push(item);
  }
  return result;
}

function neutralizeSplash(obj) {
  if (!obj || typeof obj !== "object") return;

  if (Array.isArray(obj.ads)) {
    for (const ad of obj.ads) {
      if (!ad || typeof ad !== "object") continue;
      ad.start_time = 2240150400;
      ad.end_time = 2240150400;
      ad.display_duration = 0;
      ad.daily_display_cnt = 0;
      ad.total_display_cnt = 0;
      ad.show_count = 0;
      ad.duration = 0;
    }
  }
}

function cleanObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  // Dedicated top-level ad containers.
  for (const key of ["ad", "ads", "advertises"]) {
    if (hasOwn(obj, key) && !/\/ad\/preload/.test(url)) {
      delete obj[key];
    }
  }

  if (Array.isArray(obj.statuses)) obj.statuses = cleanArray(obj.statuses);
  if (Array.isArray(obj.items)) obj.items = cleanArray(obj.items);
  if (Array.isArray(obj.cards)) obj.cards = cleanArray(obj.cards);
  if (Array.isArray(obj.card_group)) obj.card_group = cleanArray(obj.card_group);

  if (obj.data && typeof obj.data === "object") {
    if (Array.isArray(obj.data.items)) obj.data.items = cleanArray(obj.data.items);
    if (Array.isArray(obj.data.cards)) obj.data.cards = cleanArray(obj.data.cards);
    if (Array.isArray(obj.data.statuses)) obj.data.statuses = cleanArray(obj.data.statuses);
  }

  return obj;
}

try {
  const obj = JSON.parse(originalBody);

  if (/\/ad\/preload/.test(url)) {
    neutralizeSplash(obj);
  } else {
    cleanObject(obj);
  }

  $done({ body: JSON.stringify(obj) });
} catch (e) {
  $done({ body: originalBody });
}
