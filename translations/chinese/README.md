<p align="center">
<p align="center">
<img width="100%" src="../../public/github_readme.jpg"/>

<center>

[开始使用](https://revert.dev) · [文档](https://docs.revert.dev/) · [问题](https://github.com/revertinc/revert/issues) · [迪斯科](https://discord.gg/q5K5cRhymW) · [保持联系](mailto:team@revert.dev)

</center>

[![Star us on GitHub](https://img.shields.io/github/stars/revertinc/revert?color=FFD700&label=Stars&logo=Github)](https://github.com/revertinc/revert)
![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=revert-client-git-main-revertdev) [![](https://dcbadge.vercel.app/api/server/q5K5cRhymW?style=flat)](https://discord.gg/q5K5cRhymW) [![twitter](https://img.shields.io/twitter/follow/Revertdotdev?style=social)](https://twitter.com/intent/follow?screen_name=RevertdotDev) ![Revert API](https://cronitor.io/badges/HnK0d9/production/OR5NlgURLI1wAT148KU6ycCBSSk.svg) [![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://docs.revert.dev/) <a href="https://github.com/revertinc/revert/pulse"><img src="https://img.shields.io/github/commit-activity/m/revertinc/revert" alt="Commits-per-month"></a>
<a href="https://github.com/revertinc/revert/tree/main/LICENSE.txt" target="_blank">
<img src="https://img.shields.io/static/v1?label=license&message=AGPL-3.0&color=white" alt="License">
</a>

</p>

#### Hacker News

<a href="https://news.ycombinator.com/item?id=37995761">
  <img
    style="width: 250px; height: 54px;" width="250" height="54"
    alt="Featured on Hacker News"
    src="https://hackernews-badge.vercel.app/api?id=37995761"
  />
</a>
<a href="https://www.producthunt.com/posts/revert-3?utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-revert&#0045;3" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=425023&theme=light&period=weekly&topic_id=267" alt="Revert - Open&#0045;source&#0032;unified&#0032;API&#0032;to&#0032;build&#0032;product&#0032;integrations | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
<a href="https://www.producthunt.com/posts/revert-3?utm_source=badge-top-post-badge&utm_medium=badge&utm_souce=badge-revert&#0045;3" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=425023&theme=light&period=daily" alt="Revert - Open&#0045;source&#0032;unified&#0032;API&#0032;to&#0032;build&#0032;product&#0032;integrations | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>

### ⭐ 关于 Revert

Revert 使得与任何第三方 API 的集成变得异常容易，例如

-   CRM（Salesforce、Hubspot）等上市工具。
-   沟通工具（Slack、MS Teams）
-   票务工具，例如（Jira、Asana）

> 我们相信**开源统一 API** 使我们能够覆盖第三方 API 的长尾，同时使工程师能够定制我们提供的开箱即用的集成代码。 这样工程师就可以使用我们从头开始构建一切。

### 为什么 Revert？

您可能想看看我们是否

-   您是开发 B2B 产品的开发人员
-   你的路线图上有大量的集成
-   您的重点是构建核心产品而不是维护集成代码
-   你想要快速行动而不破坏东西

[报名](https://revert.dev) 注册帐户或阅读我们的文档 [这里](https://docs.revert.dev) !

### 🚀 是什么让我们更快、更可靠。

-   **无缝整合**: Revert 在所有这些平台上都预先配置了应用程序，因此您无需创建它们并处理每个平台上的细微差别。
-   **优雅的故障处理**：确保客户顺利处理过期的权限，防止任何服务中断。
-   **自动 OAuth 令牌刷新**：OAuth 令牌自动刷新，确保持续的 API 功能。
-   **API 重试机制**：自动恢复重试失败的 API 调用，提高可靠性并最大限度地减少潜在问题。
-   **适用于流行框架的 SDK**：可用于 React、Vue 和 Angular 的即用型 SDK，可实现快速轻松的集成。
-   **自托管**：提供自托管集成解决方案的灵活性，让您可以完全控制部署和数据。

＃＃ 快速开始

#### Revert 云

最简单的开始方法是创建一个 [Revert Cloud 帐户](https://app.revert.dev/sign-up)。 云版本提供与自托管版本相同的功能。

如果您想自行托管 Revert，现在可以使用 docker-compose 来实现，如下所示。

#### 使用 docker-compose 启动 Revert

开始使用自托管 Revert 的最简单方法是通过 docker-compose 运行它：

```shell
# Get the code
git clone --depth 1 https://github.com/revertinc/revert

# Copy the example env file
cd revert
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env
cp packages/client/.env.example packages/client/.env
cp packages/js/.env.example packages/js/.env
cp packages/react/.env.example packages/react/.env
cp packages/vue/.env.example packages/vue/.env

# Ensure that clerk is setup in `client` and a user is created by following the instructions here: https://docs.revert.dev/overview/developer-guide/developer-guide#-revertdotdev-client

# Update these .env files with any of your own secrets if you'd like to.

# Then In the root directory run

# When running for the first time to seed the database. (RUN ONLY ONCE)
docker-compose run db-seed

# For subsequent runs
docker-compose up -d

```

UI 现在可在 http://localhost:3000 上使用，后端可在 http://localhost:4001 上使用。

## 建筑学

### 应用程序用户的连接流程 Revert

<img src="../../public/connection_flow.png"/>

### 架构概述

<img src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1697107526/Revert/how4gj3vp2wch4kw2akb.png" />

## 软件包

该存储库包含`@reverdotdev/`命名空间下的一组包，例如：

-   [`@revertdotdev/backend`](./packages/backend)：为前端 SDK 提供支持的核心 Revert API。
-   [`@revertdotdev/revert-react`](./packages/react)：React 官方 SDK。
-   [`@revertdotdev/revert-vue`](./packages/vue)：Vue 的官方 SDK。
-   [`@revertdotdev/js`](./packages/js)：Javascript 官方 SDK。
-   ...

＃＃ 例子

存储库 [`revert-example-apps`](https://github.com/revertinc/revert-example-apps) 包含一组如何在不同框架中使用恢复的示例。

## 📞 支持

如有疑问/反馈，您可以通过以下方式联系

-   打开 Github 支持问题
-   通过 [电子邮件](mailto:team@revert.dev) 联系我们
-   在我们的 [discord](https://discord.gg/q5K5cRhymW) 中提问
-   如果您愿意，可以与我们的团队进行电话预约

<a href="https://cal.com/jatinsandilya/chat-with-jatin-from-revert?utm_source=banner&utm_campaign=oss"><img alt="通过 Cal.com 预订我们" src="https://cal.com/book-with -cal-dark.svg"/></a>

## 🔒 安全

我们非常重视安全。

**请不要提交 GitHub 问题或在我们的公共论坛上发布安全漏洞问题**。

如果您认为自己发现了漏洞，请发送电子邮件至“security@revert.dev”。 在消息中，尝试提供问题的描述以及重现问题的方法。

## 🗺️ 路线图

CRMs:

-   [x] **Salesforce**
-   [x] **Hubspot**

-   [x] **Zoho CRM**

-   [x] **Pipedrive**

-   [x] **Close CRM**
-   [ ] 其他 CRM，例如 Zendesk Sell、MS 365

Communication tools:

-   [x] Slack
-   [x] Discord
-   [ ] Microsoft Teams

Accounting software:

-   [ ] Xero
-   [ ] Quickbooks

...[and more](https://github.com/revertinc/revert/issues?q=is%3Aissue+is%3Aopen+label%3AIntegration)

-   [ ] Ability to self-host Revert inside your own cloud
-   [ ] SOC 2 (In Progress)

## 💪 贡献者

感谢社区让 Revert 每天变得更好 ❤️

<a href="https://github.com/revertinc/revert/graphs/contributors">
   <img src="https://contrib.rocks/image?repo=revertinc/revert" />
</a>
