# dsh-plugin-mopass

在 DeepSeek Harness 中一键接入乐其 **Mopass 网关**（`https://mopass.leqeegroup.com`）的安装式插件。

安装后无需手写任何 YAML：打开 **设置 → 模型**，在 "Mopass (Leqee)" 卡片里填入你的 Mopass API Key，拉取网关返回的模型列表，保存后即可在会话中选择使用。每个用户能用的模型不一样，以你填入的 Key 从网关拉到的为准。

---

## 安装

插件是一个 DSH profile bundle 包，安装 = 把它加进 profile 的依赖和 `dsh.profile.bundles`。

### 方式一：本地打包安装（推荐先试用）

```sh
cd dsh-plugin-mopass
pnpm pack                      # 生成 dsh-plugin-mopass-0.1.0.tgz

# 装进 web profile（也支持 npm 包名或 GitHub 地址）
dsh plugin --profile web add file:./dsh-plugin-mopass-0.1.0.tgz
```

`dsh plugin add` 会自动把包加进 profile 依赖，并把声明了 `dsh.bundle.patch` 的包追加到 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles` 列表，无需手改。重启 `dsh web` 即可（若用 dshmarket 安装，通常刷新页面即可）。

### 方式二：从 GitHub 安装

仓库：[https://github.com/mercy719/dsh-plugin-mopass](https://github.com/mercy719/dsh-plugin-mopass)（public）

```sh
dsh plugin --profile web add github:mercy719/dsh-plugin-mopass#main
```

> 注意：仓库为 public，任何能访问 GitHub 的人都可直接安装这条命令；`dsh plugin add` 会自动追加 `dsh.profile.bundles`。发布到 npm 后也可直接用包名安装；dshmarket 用户可在 **设置 → 插件市场** 输入仓库地址或包名一键安装。

> 提示：直接用 `pnpm`（不经 `dsh plugin`）在 profile 目录里装包不会更新 `dsh.profile.bundles`，需要自己把包名加进该列表。

## 使用（三步）

1. **打开 设置 → 模型**，找到 "Mopass (Leqee)" 卡片（Provider 路由 id 是 `mopass`）。
2. **填入你的 Mopass API Key**，点应用。Key 只写入 `$DSH_HOME/.credentials.yaml` 的 `MOPASS_API_KEY`，不会出现在任何配置里。
3. 展开卡片里的 **自定义设置**，点 **获取可用模型**（用你刚填的 Key 请求网关 `GET /models`），勾选你的 Key 有权限的模型并应用。没有模型权限信息时也可以手动添加模型 id。

之后在会话的模型选择器里选择 Mopass 的模型即可；每个用户拉到的列表不同，互不影响。

## 每个用户的模型与 thinking 级别

插件默认带的 4 个模型（`deepseek-v4-flash` / `deepseek-v4-pro` / `glm-5.2` / `kimi-k3`）已经在 `cordis.patch.yml` 里配好了 `reasoningEfforts`，所以**直接用默认模型时 thinking 级别开箱即用**，模型选择器里就能选。

但如果你（或某个用户）在 Models 页面点 **获取可用模型** 用自己 Key 拉取并替换了模型列表，有一个注意点：**网关 `GET /models` 返回的候选通常只有 `{id, name, contextWindow}`，不带 `reasoningEfforts`**。一旦用拉取结果替换了默认列表，那些模型就不会再显示 thinking 级别选择器（适配器对没有 `reasoningEfforts` 元数据的模型不提供级别）。Models 页面也没有 reasoning 级别的输入框，所以需要手动改 `$DSH_HOME/settings.yaml` 补上。

在 `settings.yaml` 的 `llm-pi-ai.providers.mopass.models` 里给拉取到的模型补 `reasoningEfforts`，例如：

```yaml
llm-pi-ai:
  providers:
    mopass:
      models:
        - id: deepseek-v4-flash
          # 其他字段（name / contextWindow / maxTokens）可按页面保存的补上
          reasoningEfforts:
            low: low
            high: high
            max: max
        - id: glm-5.2
          reasoningEfforts:
            high: high
            max: max
```

参考级别（dsh-plugin-mopass 对已知模型声明的值）：

| 模型 | `reasoningEfforts` |
| --- | --- |
| `deepseek-v4-flash` | `low: low` / `high: high` / `max: max` |
| `deepseek-v4-pro` | `high: high` / `max: max` |
| `glm-5.2` | `high: high` / `max: max` |
| `kimi-k3` | `low: low` / `high: high` / `max: max` |

> 说明：`reasoningEfforts` 的每个键是可选级别、值是网关线上拼写。这里网关对 DeepSeek 系模型用的是同名直传（`high: high`），`kimi-k3` 也同此规则。若某个模型在你的 Key 下实际只支持部分级别，只声明那几档即可。改动保存后重启 `dsh web`（或等待配置热重载）生效。

## 工作原理

- 插件的 `cordis.patch.yml` 是 profile 的一个 bundle patch 层，它把 `mopass` 路由作为 `llm-pi-ai` 适配器的 **composition base** 注入：`api: openai-completions`、`baseURL: https://mopass.leqeegroup.com`、`apiKeyEnv: MOPASS_API_KEY`，以及该网关需要的 DeepSeek 方言 `compat`（`thinkingFormat: deepseek` + `supportsReasoningEffort`，`kimi-k3` 在模型级覆盖为 openai 方言）。
- 内置的模型列表只是默认起点（参考 Leqee 内部配置）：`deepseek-v4-flash`、`deepseek-v4-pro`、`glm-5.2`、`kimi-k3`。用户在 Models 页面保存的模型列表会**整体替换**这份默认列表，所以每个用户最终生效的模型就是自己 Key 能用的那批。
- 未填 Key 时请求会以 `MISSING_CREDENTIAL` 明确失败，而不是静默走别的认证。

## 常见问题

| 现象 | 原因与处理 |
| --- | --- |
| `MISSING_CREDENTIAL` | 还没在 Models 页面保存 Key（或环境里没有 `MOPASS_API_KEY`）。 |
| 拉取模型返回 401 / `DISCOVERY_FAILED` | Key 无效或没有权限；检查 Key，或手动在模型列表里输入 id。 |
| `UNKNOWN_MODEL` | 模型不在你的模型列表里；重新拉取或手动添加。 |
| 选了模型但报错 | 你的 Key 可能用不了该模型；换成网关返回列表里的模型。 |

## 开发

- `cordis.patch.yml` 是唯一的运行时事实；它只扩展现有的 `llm-pi-ai` 配置，不挂载独立运行时插件。`lib/index.js` 仅作为合法包入口供工具读取，因此 Mopass 不会成为 Web profile 的运行时强依赖。
- 结构参考了 DSH 社区插件约定：`package.json` 声明 `dsh.bundle.patch` 指向 patch 文件，bundle 名加入 profile 的 `dsh.profile.bundles` 后即生效。
- 注意 patch 语义：对已有行（如 `llm-pi-ai`）的 patch 会**整体替换**该行 `config`，因此本插件完整声明了自己的配置，不依赖其他层。

## License

MIT
