# dsh-llm-grok-oauth 0.2.11-dsh2.0.17

本地最终版。基于 wangyaominde/dsh-llm-grok-oauth `0.2.10`，适配 **DSH Desktop 2.0.17**（Windows，dsh-settings 0.2.0-rc.2）。上游 0.2.10 在这个版本上无法启动。

## 前置条件

- DSH Desktop 2.0.17。
- 有效的 SuperGrok 订阅账号。登录走 `auth.x.ai`，聊天走 `cli-chat-proxy.grok.com`。这是 CLI 通道，不是网页聊天，也不是 console.x.ai 的按量 API。
- 能访问 xAI。本机已验证系统代理 `http://127.0.0.1:7890` 会被 DSH 读取；插件自己的请求还读取 `HTTPS_PROXY` / `https_proxy` / `ALL_PROXY` / `all_proxy`。TUN 模式最稳。
- 不需要安装官方 Grok CLI。本机即使装了 `grok.exe`，插件也不调用它。

## 安装

在 DSH 的 desktop profile 下：

```powershell
node "D:\Program Files\DSH Desktop\resources\app\node_modules\@deepseek-ai\dsh\lib\bin.js" plugin --profile desktop add "file:C:/Users/gzgyhjj/.dsh/local/dsh-llm-grok-oauth"
```

安装后确认 `~\.dsh\profiles\desktop\package.json` 的 `dsh.profile.bundles` 含有 `dsh-llm-grok-oauth`，然后**完全退出并重启 DSH Desktop**。客户端模块只在启动时加载。

## 使用

1. 设置 → 模型 → **Grok (xAI 订阅)** → 使用 Grok 账号登录。
2. 浏览器完成授权。不要手动打开 `auth.x.ai`，那不是给人看的页面。
3. 模型选择器会出现账号目录里的模型（本机为 Grok 4.7 / 4.7 Fast / 4.6 / 4.5），每个模型可选 Low / Medium / High / Extra High 推理档。

## 额度

- 消耗的是 **SuperGrok 订阅的 CLI 通道**，与手机 APP 用量页的「聊天 16%」不是同一个池子。
- 不是注册 X 送的一次性额度，也不是 console.x.ai 的 API 余额。
- 每次成功请求会把服务端限流头写入宿主日志，例如：

```text
grok-oauth: /responses limits: x-ratelimit-limit-requests=8300; x-ratelimit-remaining-requests=8300; x-ratelimit-limit-tokens=53000000; x-ratelimit-remaining-tokens=53000000
```

日志：`%APPDATA%\DSH Desktop\logs\host\dsh-当天.log`，搜索 `grok-oauth:`。这些数字是限流窗口，不是一次性额度；响应里没有重置时间，不能把它当成 APP 的周额度。

## 已知限制

- **模型卡片的「编辑」没有用。** DSH 2.0.17 只给 `llm-deepseek` 和 `llm-pi-ai` 写了编辑器，`llm-grok` 会落到 `unknown` 布局，保存按钮被禁用。配置改 `~\.dsh\profiles\desktop\cordis.patch.yml` 里 `id: llm-grok` 的层。
- **不支持上传图片。** 当前 wire 只发文本。
- 服务端最低客户端版本会变。默认上报 `1.0.13`。再被 HTTP 426 拒绝时，在 `llm-grok` 配置层加 `clientVersion: "新版本号"`，保存即可，不必改代码。
- 登录状态回写设置文档仍可能出现 `no volatile fields` 警告，不影响登录和聊天。

## 相对上游 0.2.10 的改动

- `lib/settings-compat.js`：补回 2.0.17 删除的 `settingsNamespace` / `installSettingsSection` / `deepEqualJson`。`setSource` 传入 getter。
- `lib/client.js`：不再读取已不存在的 `ctx.settingsScope`（读取即抛错并让渲染进程启动失败）。登录状态走 `/api/llm-grok/status` 轮询。
- `lib/index.js`：登录状态字段标记 `.volatile()`；新增 `clientVersion` 配置，默认 `1.0.13`。
- `lib/adapter.js`：请求头 `x-grok-client-version` 使用 `clientVersion`；成功和失败响应都记录限流头。
