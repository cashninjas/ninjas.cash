# Cash-Ninjas Minting Frontend

Repo for the [Cash-Ninjas](https://ninjas.cash) website - including wallet connect and minting logic.

## Overview

The logic for the minting page can be found in `js/mint.js` with configuration in `js/mintingParams.js`.

The CashScript artifact of the minting smart contract is provided in `js/mint.json`.

The minting app relies on `walletconnect/sign-client`, `walletconnect/modal`, `libauth`, `cashscript` and `electrum-cash` libraries.

Vite is used as bundler for the code, the `public` folder that goes with it is used to avoid jQuery bundling issues and have a consistent image path on production deploys. Vite is configured to allow top-level-await for libauth-v2, specific Vite configuration can be found in `vite.config.js`. Top-level-await support of by the user's browser is necessary to use the minting page.

To implement the wallet connect functionality the following guide was used: '[Docs: Dapp Usage](https://docs.walletconnect.com/api/sign/dapp-usage)'.

The Wallet Connect V2 standard for BCH is supported by [Cashonize](https://cashonize.com/), the [Zapit](https://zapit.io/) wallet and the [Paytaca](https://www.paytaca.com/) wallet is at the time of writing.

## Installation

```sh
git clone https://github.com/cashninjas/ninjas.cash

npm install
```

## Usage

You need to make an account at [cloud.walletconnect.com](https://cloud.walletconnect.com) to get a WalletConnect `projectId`. To simplify implementation you can turn off the Verify API in the project's settings.

Update `js/mintingParams.js` with your specific configuration.

Then startup the web server!

```sh
npm run dev
```

Profit!
