<p align="center">
<p align="center">
<img width="100%" src="../../public/github_readme.jpg"/>

<center>

[Erste Schritte](https://revert.dev) · [Dokumente](https://docs.revert.dev/) · [Probleme](https://github.com/revertinc/revert/issues) · [Discord](https://discord.gg/q5K5cRhymW) · [Kontaktieren Sie uns](mailto:team@revert.dev)

</center>

[![Star uns auf GitHub](https://img.shields.io/github/stars/revertinc/revert?color=FFD700&label=Stars&logo=Github)](https://github.com/revertinc/revert)
![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=revert-client-git-main-revertdev) [![](https://dcbadge.vercel.app/api/server/q5K5cRhymW?style=flat)](https://discord.gg/q5K5cRhymW) [![twitter](https://img.shields.io/twitter/follow/Revertdotdev?style=social)](https://twitter.com/intent/follow?screen_name=RevertdotDev) ![Revert API](https://cronitor.io/badges/HnK0d9/production/OR5NlgURLI1wAT148KU6ycCBSSk.svg) [![PRs begrüßen](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://docs.revert.dev/) <a href="https://github.com/revertinc/revert/pulse"><img src="https://img.shields.io/github/commit-activity/m/revertinc/revert" alt="Commits-per-month"></a>
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

### ⭐ Über Revert

Revert macht es unglaublich einfach, Integrationen mit APIs von Drittanbietern zu erstellen, z

-   Go-to-Market-Tools wie CRMs (Salesforce, Hubspot).
-   Kommunikationstools (Slack, MS Teams)
-   Ticketing-Tools wie (Jira, Asana)

> Wir sind davon überzeugt, dass eine **einheitliche Open-Source-API** es uns ermöglicht, den langen Schwanz der APIs von Drittanbietern abzudecken und gleichzeitig Ingenieuren die Möglichkeit zu geben, den von uns angebotenen Integrationscode sofort anzupassen. Auf diese Weise können Ingenieure uns nutzen, anstatt alles von Grund auf neu zu bauen.

### Warum Revert?

Vielleicht möchten Sie bei uns vorbeischauen, wenn

-   Sie sind Entwickler und entwickeln ein B2B-Produkt
-   Sie haben eine Menge Integrationen auf Ihrer Roadmap
-   Ihr Fokus liegt auf der Entwicklung Ihres Kernprodukts und nicht auf der Pflege des Integrationscodes
-   Sie wollen schnell vorankommen und nichts kaputt machen

[Melden Sie sich](https://revert.dev) für ein Konto an oder lesen Sie unsere Dokumente [hier](https://docs.revert.dev)!

### 🚀 Was uns schneller und zuverlässiger macht.

-   **Nahtlose Integration**: Revert verfügt auf allen diesen Plattformen über vorkonfigurierte Apps, sodass Sie diese nicht erstellen und sich mit den Nuancen auf jeder Plattform auseinandersetzen müssen.
-   **Graceful Failure Handling**: Gewährleistet eine reibungslose Handhabung abgelaufener Berechtigungen durch Kunden und verhindert so Serviceunterbrechungen.
-   **Automatische OAuth-Token-Aktualisierung**: OAuth-Tokens werden automatisch aktualisiert, um eine kontinuierliche API-Funktionalität sicherzustellen.
-   **API-Wiederholungsmechanismus**: Revert werden fehlgeschlagene API-Aufrufe automatisch wiederholt, wodurch die Zuverlässigkeit verbessert und potenzielle Probleme minimiert werden.
-   **SDKs für gängige Frameworks**: Gebrauchsfertige SDKs verfügbar für React, Vue und Angular, die eine schnelle und einfache Integration ermöglichen.
-   **Selbst gehostet**: Bietet die Flexibilität, die Integrationslösung selbst zu hosten, sodass Sie die volle Kontrolle über Bereitstellung und Daten haben.

## Schnellstart

#### Revert Cloud

Der einfachste Einstieg ist die Erstellung eines [Revert Cloud-Kontos](https://app.revert.dev/sign-up). Die Cloud-Version bietet die gleiche Funktionalität wie die selbst gehostete Version.

Wenn Sie Revert jedoch selbst hosten möchten, können Sie dies noch heute mit Docker-Compose tun, wie unten beschrieben.

#### Revert mit Docker-Compose starten

Der einfachste Weg, mit selbstgehostetem Revert zu beginnen, besteht darin, es über Docker-Compose auszuführen:

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

Die Benutzeroberfläche ist jetzt unter http://localhost:3000 und das Backend unter http://localhost:4001 verfügbar.

## Architecture

### Verbindungsfluss für die Benutzer Ihrer App mit Revert.

<img src="../../public/connection_flow.png"/>

### Architekturüberblick

<img src="https://res.cloudinary.com/dfcnic8wq/image/upload/v1697107526/Revert/how4gj3vp2wch4kw2akb.png" />

## Pakete

Dieses Repo enthält eine Reihe von Paketen unter dem Namensraum „@reverdotdev/“, wie zum Beispiel:

-   [`@revertdotdev/backend`](./packages/backend): Die zentrale Revert-API, die die Frontend-SDKs unterstützt.
-   [`@revertdotdev/revert-react`](./packages/react): Offizielles SDK für React.
-   [`@revertdotdev/revert-vue`](./packages/vue): Offizielles SDK für Vue.
-   [`@revertdotdev/js`](./packages/js): Offizielles SDK für Javascript.
-   ...

## Beispiele

Das Repo [`revert-example-apps`](https://github.com/revertinc/revert-example-apps) enthält eine Reihe von Beispielen für die Verwendung von Revert mit verschiedenen Frameworks.

## 📞 Unterstützung

Bei Fragen/Feedback können Sie sich wie folgt an uns wenden

-   Öffnen Sie ein Github-Support-Problem
-   Kontaktieren Sie uns unter [E-Mail](mailto:team@revert.dev)
-   Stellen Sie eine Frage in unserem [Discord](https://discord.gg/q5K5cRhymW)
-   Wenn Sie möchten, können Sie unten einen Anruf mit unserem Team vereinbaren

<a href="https://cal.com/jatinsandilya/chat-with-jatin-from-revert?utm_source=banner&utm_campaign=oss"><img alt="Buchen Sie uns bei Cal.com" src="https://cal.com/book-with -cal-dark.svg" /></a>

## 🔒 Sicherheit

Wir nehmen Sicherheit ernst.

**Bitte melden Sie keine GitHub-Probleme und posten Sie keine Beiträge in unserem öffentlichen Forum zu Sicherheitslücken**.

Senden Sie eine E-Mail an „security@revert.dev“, wenn Sie glauben, eine Schwachstelle entdeckt zu haben. Versuchen Sie, in der Nachricht eine Beschreibung des Problems und eine Möglichkeit zur Reproduktion bereitzustellen.

## 🗺️ Roadmap

CRMs:

-   [x] **Salesforce**
-   [x] **Hubspot**

-   [x] **Zoho CRM**

-   [x] **Pipedrive**

-   [x] **Close CRM**
-   [ ] Andere CRMs wie Zendesk Sell, MS 365

Communication tools:

-   [x] Slack
-   [x] Discord
-   [ ] Microsoft Teams

Accounting software:

-   [ ] Xero
-   [ ] Quickbooks

...[und mehr](https://github.com/revertinc/revert/issues?q=is%3Aissue+is%3Aopen+label%3AIntegration)

-   [ ] Möglichkeit, Revert selbst in Ihrer eigenen Cloud zu hosten
-   [ ] SOC 2 (Im Gange)

Sie können gerne ein Problem erstellen, wenn Sie eine Integration wünschen, die uns fehlt [Hier](https://github.com/revertinc/revert)

## 💪 Mitwirkende

Ich bin der Community dankbar, dass sie Revert jeden Tag besser macht ❤️

<a href="https://github.com/revertinc/revert/graphs/contributors">
   <img src="https://contrib.rocks/image?repo=revertinc/revert" />
</a>
