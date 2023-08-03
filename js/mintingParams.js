// Configure minting params

// Wallet Connect projectId
const projectId = "2aca272d18deb10ff748260da5f78bfd";

// Url of the API server
const urlApiServer = "https://api.ninjas.cash";

// Contract Params mint
const tokenId = "77a95410a07c2392c340384aef323aea902ebfa698a35815c4ef100062c6d8ac";
const collectionSize = 5_000;
const numberOfThreads = 25;
const mintPriceSats = 5_000_000;
const payoutAddress = "bitcoincash:qqds0h006djrnast7ktvf7y3lrmvu0d7yqzhuzgvaa"; // with bitcoincash: or bchtest: prefix
const network = "mainnet";

// Wallet Connect Metadata
const wcMetadata = {
  name: 'Cash-Ninjas',
  description: 'CashTokens NFT Collection',
  url: 'https://ninjas.cash/',
  icons: ['https://ninjas.cash/images/logo.png']
}

export { projectId, urlApiServer, tokenId, collectionSize, mintPriceSats, payoutAddress, numberOfThreads, network, wcMetadata };