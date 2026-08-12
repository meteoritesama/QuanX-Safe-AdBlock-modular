/*
 * QuanX Safe AdBlock - WeChat public-account ad cleaner
 *
 * Only handles the response of:
 *   https://mp.weixin.qq.com/mp/getappmsgad
 *
 * Security properties:
 * - no network requests
 * - no persistent storage
 * - no cookies/header harvesting
 * - no eval / Function / dynamic loading
 * - fail-open on unexpected response formats
 */

"use strict";

const originalBody = $response.body;

try {
  const obj = JSON.parse(originalBody);

  if (Object.prototype.hasOwnProperty.call(obj, "advertisement_num")) {
    obj.advertisement_num = 0;
  }

  if (Object.prototype.hasOwnProperty.call(obj, "advertisement_info")) {
    obj.advertisement_info = [];
  }

  $done({ body: JSON.stringify(obj) });
} catch (e) {
  $done({ body: originalBody });
}
