# QuanX Safe AdBlock V3.3.1 Modular

## 目标

V3.1 把「所有 App 规则堆进一个文件」改为：

```text
modules/*.conf
      +
config/enabled_apps.txt
      ↓
tools/build.py
      ↓
rewrite/AdBlock.conf
      ↓
Quantumult X 只订阅这 1 个文件
```

QuanX 主配置仍然只需要一条：

```ini
[rewrite_remote]
https://raw.githubusercontent.com/meteoritesama/QuanX-Safe-AdBlock/main/QuanX-Safe-AdBlock/rewrite/AdBlock.conf, tag=自用重写规则, update-interval=-1, opt-parser=false, enabled=true
```

## 为什么这样更适合扩展

- 每个 App 独立模块，不互相污染。
- `rewrite/AdBlock.conf` 只包含 `enabled_apps.txt` 中启用的 App。
- MITM hostname 自动合并、去重，只保留已启用 App。
- 新增 App 时，不需要手工改 QuanX 主配置。
- Bilibili 等脚本型模块继续只调用你自己的 GitHub。
- `build.py` 会阻止第三方 `script-*` URL 进入生成文件。

## 新安装一个已经有模块的 App

例如以后安装 `zhihu`：

1. 打开 `QuanX-Safe-AdBlock/config/enabled_apps.txt`
2. 增加一行：

```text
zhihu
```

3. GitHub Workflow 自动重建 `rewrite/AdBlock.conf`
4. QuanX 手动刷新你的 Rewrite 订阅（如果 `update-interval=-1`）

卸载 App 时删除/注释对应一行即可。

### 重要限制

iOS/Quantumult X 不提供一个适合这种配置使用的“自动读取已安装 App 清单”接口，因此无法在不扩大权限/复杂度的情况下做到真正的自动识别安装。V3.1 用“一行启用清单”替代自动检测。

## 新增一个项目中还没有的 App

只需要：

1. 新建 `modules/new-app.conf`
2. 写最小规则与该 App 所需 `hostname = ...`
3. 在 `catalog.json` 登记
4. 在 `enabled_apps.txt` 增加 `new-app`
5. 运行 `python3 QuanX-Safe-AdBlock/tools/build.py`，或让 GitHub Workflow 自动构建

## YouTube

默认新增 `youtube-lite`：

- 只使用原生 URL Rewrite；
- 不解析 `youtubei` 的大型响应；
- 不执行 YouTube JavaScript；
- 更适合优先考虑续航/内存的设备。

它主要处理 GoogleVideo 广告流 URL 和 YouTube 的广告统计/跟踪端点。

**限制：** 当前 YouTube 更完整的首页、Shorts、搜索页、播放器广告清理通常需要处理 `youtubei.googleapis.com/youtubei/v1/...` 的响应；这类方案涉及二进制/Proto 响应脚本，运行成本和代码体积明显更高，因此 V3.1 默认不加入。

## GitHub 自动构建

仓库根目录：

```text
.github/workflows/build-active.yml
```

不调用第三方 Action。它只：

1. 使用 GitHub 自己的 `GITHUB_TOKEN` clone 当前仓库；
2. 运行仓库内的 `tools/build.py`；
3. 如果生成文件变化，则提交回当前分支。

如果不想使用 GitHub Actions，可以删除 `.github/workflows/`，本地运行 `build.py` 即可。

## 续航优化原则

1. 只启用实际安装的 App。
2. 原生 `reject/rewrite` 优先于 `script-response-body`。
3. 只有必须修改混合响应时才启用 JS。
4. MITM hostname 只由启用模块生成。
5. 不要使用 `hostname = *`。
6. 不要把大型通用广告仓库整包塞进 Rewrite。
7. YouTube 默认使用 Lite。
8. Bilibili 保留现有最小 JSON 脚本，不扩大到 protobuf/gRPC。

## QUIC / YouTube

如果 YouTube 广告仍绕过 HTTPS Rewrite，可能与 QUIC/UDP 有关。不要默认写 `udp_drop_list=443`。
更保守的故障排查是先临时测试：

```ini
udp_drop_list = QUIC
```

确认确实改善后再决定是否长期保留，因为它会影响所有使用 QUIC 的应用，而不仅是 YouTube。


## V3.2 新增但默认未启用的模块

### 微博 `weibo`

- 原生 Reject：开屏/预加载、首页弹窗、推荐用户弹窗、搜索默认词等独立广告端点。
- 自有脚本：`scripts/weibo_clean.js`
- 脚本只删除 JSON 中具有明确广告标记的对象，不做 VIP、皮肤、Tab、账号或会员相关修改。
- 默认不启用，因此不会增加你当前手机的 Rewrite/MITM 开销。

启用：

```text
weibo
```

### QQ音乐 `qqmusic`

- 纯原生 Rewrite。
- 处理 `t_splash_info`、`kg_ad`、`targeted_ads`、Tencent Music 独立广告域名。
- 不使用 JavaScript。
- 默认不启用。

启用：

```text
qqmusic
```

### 当前 enabled_apps 行为

V3.2 **不改变原有 15 个启用模块**。`weibo` 与 `qqmusic` 只以注释形式出现在 `enabled_apps.txt`，需要时取消注释/新增模块名即可。


## V3.3 新增常用 App（默认均未启用）

V3.3 不改变现有 `enabled_apps.txt` 的 15 个活动模块。新增模块只进入仓库目录，不会进入手机实际加载的 `rewrite/AdBlock.conf`，除非主动取消注释/加入模块名。

| 模块 | App | 模式 | 设计边界 |
|---|---|---|---|
| `wechat` | 微信 | script-light | 只处理公众号文章广告和商品推广，不碰聊天/支付/登录/朋友圈核心 API |
| `qq` | QQ | native-lite | 只拦较独立的开屏/GDT/视频广告资源，不做 `*.qq.com` 大范围屏蔽 |
| `jd` | 京东 | native-lite | 避免修改完整 startup JSON，只处理较独立广告/营销端点 |
| `xianyu` | 闲鱼 | native | 开屏和明确营销/推荐 MTop 接口 |
| `eleme` | 饿了么 | native-media | 已知开屏媒体特征，默认关闭以降低 CDN 误杀风险 |
| `amap` | 高德地图 | native-lite | value-added/alimama 开屏和广告上传资源 |

### 微信特别说明

微信模块的 MITM 只有：

```text
mp.weixin.qq.com
```

不会加入：

```text
tenpay.com
weixin110.qq.com
security.wechat.com
*.weixin.qq.com
```

因此项目不会为了去公众号广告而扩大到支付、登录、消息或安全跳转链路。

微信 `getappmsgad` 使用仓库自有 `scripts/wechat_clean.js`，只把响应中的：

```text
advertisement_num
advertisement_info
```

清空，不进行其他功能修改。

### 启用示例

例如需要微信、QQ 和高德：

```text
wechat
qq
amap
```

加入 `config/enabled_apps.txt` 后运行：

```bash
python3 tools/build.py
```

QuanX 最终仍只加载单一的：

```text
rewrite/AdBlock.conf
```


## V3.3.1：自动维护模块清单

`config/enabled_apps.txt` 现在由 `tools/build.py` 自动维护三段：

- `Enabled modules`：当前实际加载到手机的模块；
- `All available modules`：`modules/` 目录中全部可用模块；
- `Optional modules available but NOT enabled`：全部模块减去已启用模块。

以后新增 `modules/foo.conf` 后，不需要手工修改 Optional 清单；运行一次 `python3 tools/build.py` 即会自动出现。
