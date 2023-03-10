# ChampR

![champ-r](https://socialify.git.ci/cangzhang/champ-r/image?description=1&font=KoHo&forks=1&logo=https%3A%2F%2Fraw.githubusercontent.com%2Fcangzhang%2Fchamp-r%2Fmain%2Fsrc-tauri%2Ficons%2F128x128.png&owner=1&stargazers=1&theme=Auto)

[![](https://img.shields.io/github/v/release/cangzhang/champ-r?label=LATEST%20VERSION&style=for-the-badge)](https://github.com/cangzhang/champ-r/releases/latest)
[![](https://img.shields.io/github/downloads/cangzhang/champ-r/total?style=for-the-badge)](https://github.com/cangzhang/champ-r/releases)
[![](https://img.shields.io/github/workflow/status/cangzhang/champ-r/release?style=for-the-badge&color=65C0A3)](https://github.com/cangzhang/champ-r/actions)

[中文文档](./README_zh.md)

Yet another League of Legends helper.

[App icon](https://www.flaticon.com/free-icon/dog_2767976), credits to [flaticon.com](https://www.flaticon.com/).

> ❤ Special thanks to [JetBrains](https://www.jetbrains.com/?from=champ-r) for sponsoring opensource license to this project.

|                                                                   Home                                                                   |                                                                   Import Builds                                                                  |                                                                   Apply Runes                                                                   |
|:----------------------------------------------------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------------------------------------------------------:|:-----------------------------------------------------------------------------------------------------------------------------------------------:|
| <img src="https://user-images.githubusercontent.com/1357073/180357424-36edd450-a3b9-42ab-9e68-e60fb5f43bb8.png" width="220" alt="home"/> | <img src="https://user-images.githubusercontent.com/1357073/180357492-776dae3a-8ad2-4f92-bb6b-999b521bae4d.png" width="220" alt="import builds"/> | <img src="https://user-images.githubusercontent.com/1357073/180359086-f479afdf-e3db-481f-a4fc-28a43452d25c.png" width="220" alt="apply runes"/> |

## Features

- 📦 Auto generate recommend champion builds
- 🎉 Popup runes list & apply on the fly
- ✨ i18n support
    - 🇨🇳 `Chinese`
    - 🇺🇸 `English`
    - 🇫🇷 `French`
- ℹ️ Update notifier
- 😎 Multiple data sources for **Summoner's Rift** / **ARAM** / **URF**
    - `op.gg`
    - `lolalytics.com`
    - `u.gg`
    - `champion.gg`
    - `murderbridge.com`
    - `101.qq.com`
    - ...

## Download

> 🎗️ (For v2 users) If you cannot run ChampR v2 directly, install [webview2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section) first.

- `v2 nightly` `~10Mb` [Link](https://github.com/cangzhang/champ-r/releases)
- `v1 Stable` `~70Mb` [Download](https://github.com/cangzhang/champ-r/releases)

## How to

### Import builds

1. Run ChampR as **administrator**
1. Choose the **installation folder** of League of Legends
1. Select data sources
1. Hit `Import` button
1. You can find them in the shop menu when playing game

### Apply Runes

1. Run ChampR as **administrator**
1. Choose the **installation folder** of League of Legends
1. Start pvp game, the rune popup would show in the screen
1. Press `Apply` icon

## FAQ

Check https://github.com/cangzhang/champ-r/wiki/FAQ

## Development

### Prerequisite

- [Node.js](https://nodejs.org/en/) >= 14

### Install dependencies

```console
pnpm install
```

### Start

```console
pnpm run start
```

### Build

```console
pnpm run build:local
```

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cangzhang/champ-r&type=Date)](https://star-history.com/#cangzhang/champ-r&Date)

## Donation

[![](./docs/afdian.jpeg)](https://afdian.net/a/alcheung)
