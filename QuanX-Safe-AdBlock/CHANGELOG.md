# CHANGELOG

## V3.3.1 - 2026-08-12

- Auto-generates all available and optional module lists from `modules/*.conf`.
- Preserves the same 15 enabled modules and active bundle size.
- Prevents future drift between module files and `enabled_apps.txt`.

## V3.3 - 2026-08-12

- Preserved the existing 15 enabled modules unchanged.
- Added optional `wechat` module plus repository-owned `wechat_clean.js`.
- Added optional native-lite `qq` module.
- Added optional `jd`, `xianyu`, `eleme`, and `amap` modules.
- New modules remain disabled by default, so the active bundle has no additional runtime cost.
- WeChat module intentionally limits MITM to `mp.weixin.qq.com`.

## V3.2 - 2026-08-12

- Preserved the existing enabled-app list unchanged.
- Added optional `weibo` module and repository-owned `weibo_clean.js`.
- Added optional native-only `qqmusic` module.
- Neither new module is enabled by default, so the active bundle remains unchanged until explicitly enabled.

