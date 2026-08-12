# V3.3 Static Audit Report

Test date: 2026-08-12

## Active bundle
- Enabled modules: 15
- Active Rewrite rules: 54
- Active MITM hostnames: 40
- New V3.3 modules enabled: NO

The phone-side active bundle therefore remains unchanged until the user explicitly enables a new module.

## Repository
- Available modules: 23
- Module regex/format errors: 0
- Third-party runtime script URLs: 0

## New modules
- wechat: 2 rules / 1 host
- qq: 5 rules / 5 hosts
- jd: 5 rules / 5 hosts
- xianyu: 6 rules / 1 host
- eleme: 6 rules / 4 hosts
- amap: 3 rules / 2 hosts

## JavaScript audit
- bilibili_clean.js: syntax=PASS, forbidden executable capabilities=0
- wechat_clean.js: syntax=PASS, forbidden executable capabilities=0
- weibo_clean.js: syntax=PASS, forbidden executable capabilities=0

## Safety notes
- WeChat does not MITM chat/payment/login/security hosts.
- QQ avoids blanket `*.qq.com` or `*.gdt.qq.com` rejection.
- JD avoids full startup-response modification.
- Ele.me remains optional because CDN dimension patterns can become stale.
