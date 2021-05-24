# ChampR

[![](https://img.shields.io/github/v/release/cangzhang/champ-r?label=LATEST%20VERSION&style=for-the-badge)](https://github.com/cangzhang/champ-r/releases/latest)
[![](https://img.shields.io/github/downloads/cangzhang/champ-r/total?style=for-the-badge)](https://github.com/cangzhang/champ-r/releases)
[![](https://img.shields.io/github/workflow/status/cangzhang/champ-r/release?style=for-the-badge&color=65C0A3)](https://github.com/cangzhang/champ-r/actions)

<img src="https://user-images.githubusercontent.com/1357073/119310269-15b77300-bca2-11eb-92d1-20305f6a7f48.png" height="400" /> <img src="https://user-images.githubusercontent.com/1357073/119310086-da1ca900-bca1-11eb-9d1e-73cae2b36c0c.png" height="400" />

Yet another League of Legends helper.

[App icon](https://www.flaticon.com/free-icon/dog_2767976), credits to [flaticon.com](https://www.flaticon.com/).

## Features

- 📦 Auto generate recommend champion builds
- 🎉 Popup runes list & apply on the fly
- ✨ i18n support
    - 🇨🇳 `Chinese`
    - 🇺🇸 `English`
    - 🇫🇷 `French`
- ℹ️ Update notifier
- 😎 Multiple data sources
  - `op.gg`
  - `lolalytics.com`
  - `murderbridge.com`
  - `101.qq.com`

## Download

https://github.com/cangzhang/champ-r/releases

## How to use

### Import builds

1. Run ChampR as **administrator**
1. Choose the installation folder of League of Lengends
1. Select data sources
1. Hit `Import` button, they will appear in the shop when open it

### Apply Runes

1. Run ChampR as **administrator**
1. Choose the installation folder of League of Lengends
1. Start pvp game, the rune popup would show in the screen
1. Press `Apply` icon

## FAQ

1. [Start ChampR & LOL/WeGame with one click](https://github.com/cangzhang/champ-r/issues/63)
1. [Fix app installation stuck](https://github.com/cangzhang/champ-r/issues/64)

## Development

### Prerequisite

- [Node.js](https://nodejs.org/en/) >= 10
- [yarn](https://classic.yarnpkg.com/lang/en/)

### Install dependencies

```console
yarn
```

### Start

```console
yarn start
```

### Build

```console
yarn build:local
```
