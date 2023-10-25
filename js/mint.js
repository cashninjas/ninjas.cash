import SignClient from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { Contract, ElectrumNetworkProvider, SignatureTemplate } from "cashscript";
import contractArtifact from "/js/mint.json";
import { decodeCashAddress, binToHex, hexToBin, vmNumberToBigInt, bigIntToVmNumber, encodeCashAddress, decodeTransaction, cashAddressToLockingBytecode, stringify } from "@bitauth/libauth";
import { ElectrumCluster, ElectrumTransport } from 'electrum-cash';
import { projectId, urlApiServer, tokenId, collectionSize, mintPriceSats, payoutAddress, numberOfThreads, network, wcMetadata } from "/js/mintingParams.js";

const updateAmountMinted = async () => {
  try {
    const fetchPromise = await fetch(urlApiServer);
    const fetchResult = await fetchPromise.json();
    document.getElementById("nftsMinted").textContent = fetchResult.nftsMinted;
  } catch (error) { console.log(error); }
};
updateAmountMinted();
// update amount minted each 20 seconds
setInterval(updateAmountMinted, 20_000);

// 1. Setup Client with relay server
const signClient = await SignClient.init({
  projectId,
  // optional parameters
  relayUrl: 'wss://relay.walletconnect.com',
  metadata: wcMetadata
});

// Get last WalletConnect session from local storage is there is any
const lastKeyIndex = signClient.session.getAll().length - 1;
const lastSession = signClient.session.getAll()[lastKeyIndex];

// Handle session events
signClient.on('session_event', ({ event }) => {
  console.log('session_event');
  console.log(event);
});

signClient.on('session_update', ({ topic, params }) => {
  console.log('session_update');
  console.log(params);
});

signClient.on('session_delete', () => {
  console.log('session_delete');
});

// Connect Client.
const walletConnectModal = new WalletConnectModal({
  projectId: projectId,
  themeMode: 'dark',
  themeVariables: {
    '--wcm-background-color': '#20c997',
    '--wcm-accent-color': '#20c997',
  },
  explorerExcludedWalletIds: 'ALL',
});

const connectedChain = network == "mainnet" ? "bch:bitcoincash" : "bch:bchtest";
const requiredNamespaces = {
  bch: {
    chains: [connectedChain],
    methods: ['bch_getAddresses', 'bch_signTransaction', 'bch_signMessage'],
    events: ['addressesChanged'],
  },
};

let session;
if (lastSession) setTimeout(() => {
  const confirmReuse = confirm("The minting app is going to re-use your previous WalletConnect session");
  if (confirmReuse) {
    session = lastSession;
    document.getElementById('my-button').style.display = "none";
    document.getElementById('connectInfo').style.display = "none";
    document.getElementById('mintSection').style.display = "block";
  }
}, 500);

try {
  document.getElementById('my-button').addEventListener('click', async () => {
    const { uri, approval } = await signClient.connect({ requiredNamespaces });
    console.log(uri);
    if (session) return;
    await walletConnectModal.openModal({ uri });
    // Await session approval from the wallet.
    session = await approval();
    // Handle the returned session (e.g. update UI to "connected" state).
    document.getElementById('my-button').style.display = "none";
    document.getElementById('connectInfo').style.display = "none";
    document.getElementById('mintSection').style.display = "block";
    console.log(session);
    //onSessionConnect(session)
    // Close the QRCode modal in case it was open.
    walletConnectModal.closeModal();
  });

} catch (error) { console.log(error); }

// Convert payoutAddress to payoutLockingBytecode
const addressInfo = decodeCashAddress(payoutAddress);
const pkhPayout = binToHex(addressInfo.payload);

// The array of parameters to use for generating the contract
const contractParams = [
  BigInt(mintPriceSats),
  BigInt(numberOfThreads),
  pkhPayout,
  BigInt(collectionSize - 1),
];

// Create a custom 1-of-1 electrum cluster for bch-mainnet
const electrumCluster = new ElectrumCluster('Electrum cluster example', '1.4.1', 1, 1);
electrumCluster.addServer('electrum.imaginary.cash', ElectrumTransport.WSS.Port, ElectrumTransport.WSS.Scheme);
const electrum = network == "mainnet" ? electrumCluster : undefined;
// Initialise cashscript ElectrumNetworkProvider
const electrumServer = new ElectrumNetworkProvider(network, electrum);

// Instantiate a new minting contract
const options = { provider: electrumServer };
const contract = new Contract(contractArtifact, contractParams, options);
console.log(`P2sh32 smart contract address is ${contract.address}`);

const mintButton = document.getElementById("mintButton");
const createMintingTxs = async () => {
  // Reset to unkown preview
  document.getElementById("imageMint").src = "/images/unknown.jpg";
  document.getElementById("textImageMint").textContent = "";
  // Call mintNFT as many times as the quantity input
  const quantityNfts = document.getElementById("quantity-nfts").value;
  for (let i = 1; i <= quantityNfts; i++) {
    await mintNFT(i, quantityNfts);
  }
};
mintButton.onclick = createMintingTxs;

let nrsMinted = [];

// Cleanup state when mint fails. Fix button,
// and onclick callback.
const cleanupFailedMint = () => {
  mintButton.textContent = "Mint Now";
  mintButton.onclick = createMintingTxs;
  updateAmountMinted();
}

async function mintNFT(mintIndex, mintTotal) {
  // Visual feedback for user, disable button onclick
  mintButton.textContent = `Building transaction ${mintIndex}/${mintTotal}...`;
  mintButton.onclick = () => { };

  // Get userInput for mint
  const userAddress = await getUserAddress();
  const userUtxos = await electrumServer.getUtxos(userAddress);
  const networkFeeMint = 520;
  const filteredUserUtxos = userUtxos.filter(
    val => !val.token && val.satoshis >= mintPriceSats + networkFeeMint,
  );
  const bchBalanceUser = userUtxos.reduce((total, utxo) => utxo.token ? total : total + utxo.satoshis, 0n);
  const userInput = filteredUserUtxos[0];
  if (!userInput && bchBalanceUser > BigInt(mintPriceSats + networkFeeMint)) {
    alert("No suitable utxos found for minting. You need to consolidate the balance of your utxos.");
    cleanupFailedMint();
    throw ("No suitable utxos found for minting. You need to consolidate the balance of your utxos.");
  }
  if (!userInput && bchBalanceUser <= BigInt(mintPriceSats)) {
    alert("No suitable utxos found for minting. Not enough funds in the wallet to mint!");
    cleanupFailedMint();
    throw ("No suitable utxos found for minting. Not enough funds in the wallet to mint!");
  }
  if (!userInput && bchBalanceUser <= BigInt(mintPriceSats + networkFeeMint)) {
    alert("No suitable utxos found for minting. Need enough BCH for the network fee!");
    cleanupFailedMint();
    throw ("No suitable utxos found for minting. Need enough BCH for the network fee!");
  }

  // Get the minting utxo to use from the api endpoint
  const getAvailableMintUtxo = async () => {
    const contractUtxos = await contract.getUtxos();
    const fetchPromiseMint = await fetch(urlApiServer + "/mint");
    const fetchResultMint = await fetchPromiseMint.json();
    const selectedCommitment = fetchResultMint.availableMintingUtxo;
    let mintUtxo = contractUtxos.find(utxo => utxo.token != undefined && utxo.token.category == tokenId && utxo.token.nft.commitment === selectedCommitment);
    // if mintUtxo is undefined, refetch API server
    if (!mintUtxo) mintUtxo = await getAvailableMintUtxo();
    return mintUtxo;
  };
  const selectedMintUtxo = await getAvailableMintUtxo();
  // create minting transaction
  const newContractBalance = selectedMintUtxo.satoshis + BigInt(mintPriceSats);
  const nftCommitmentMint = selectedMintUtxo.token.nft.commitment;
  const nftNumberMint = vmNumberToBigInt(hexToBin(nftCommitmentMint));
  const nextCommitment = binToHex(bigIntToVmNumber(nftNumberMint + BigInt(numberOfThreads)));
  const tokenDetailsContract = {
    amount: 0n,
    category: tokenId,
    nft: {
      capability: 'minting',
      commitment: nextCommitment
    }
  };
  const tokenDetailsUser = {
    amount: 0n,
    category: tokenId,
    nft: {
      capability: 'none',
      commitment: nftCommitmentMint
    }
  };
  const changeAmount = userInput.satoshis - BigInt(mintPriceSats) - 2000n;

  // empty usersig
  const userSig = new SignatureTemplate(Uint8Array.from(Array(32)));

  function toTokenAddress(address) {
    const addressInfo = decodeCashAddress(address);
    const pkhPayoutBin = addressInfo.payload;
    const prefix = network === "mainnet" ? 'bitcoincash' : 'bchtest';
    const tokenAddress = encodeCashAddress(prefix, "p2pkhWithTokens", pkhPayoutBin);
    return tokenAddress;
  }

  const transaction = contract.functions.mintNFT()
    .from(selectedMintUtxo)
    .fromP2PKH(userInput, userSig)
    .to(contract.tokenAddress, newContractBalance, tokenDetailsContract)
    .to(toTokenAddress(userAddress), 1000n, tokenDetailsUser)
    .withoutChange()
    .withTime(0);
  if (changeAmount > 1000n) transaction.to(userAddress, changeAmount);

  try {
    const rawTransactionHex = await transaction.build();
    const decodedTransaction = decodeTransaction(hexToBin(rawTransactionHex));
    if (typeof decodedTransaction === "string") {
      alert("No suitable utxos found for minting. Try to consolidate your utxos!");
      throw ("No suitable utxos found for minting. Try to consolidate your utxos!");
    }
    decodedTransaction.inputs[1].unlockingBytecode = Uint8Array.from([]);

    // construct new transaction object for SourceOutputs, for stringify & not to mutate current network provider 
    const listSourceOutputs = [{
      ...decodedTransaction.inputs[0],
      lockingBytecode: (cashAddressToLockingBytecode(contract.tokenAddress)).bytecode,
      valueSatoshis: BigInt(selectedMintUtxo.satoshis),
      token: selectedMintUtxo.token && {
        ...selectedMintUtxo.token,
        category: hexToBin(selectedMintUtxo.token.category),
        nft: selectedMintUtxo.token.nft && {
          ...selectedMintUtxo.token.nft,
          commitment: hexToBin(selectedMintUtxo.token.nft.commitment),
        },
      },
      contract: {
        abiFunction: transaction.abiFunction,
        redeemScript: contract.redeemScript,
        artifact: contract.artifact,
      }
    }, {
      ...decodedTransaction.inputs[1],
      lockingBytecode: (cashAddressToLockingBytecode(userAddress)).bytecode,
      valueSatoshis: BigInt(userInput.satoshis),
    }];

    const wcTransactionObj = {
      transaction: decodedTransaction,
      sourceOutputs: listSourceOutputs,
      broadcast: true,
      userPrompt: "Mint Cash-Ninja NFT"
    };

    console.log(wcTransactionObj);
    setTimeout(() => alert('Approve the minting transaction in Cashonize'), 100);
    const signResult = await signTransaction(wcTransactionObj);
    console.log(signResult);
    if (signResult) {
      alert(`Mint succesful! txid: ${signResult.signedTransactionHash}`);
      console.log(`Mint succesful! txid: ${signResult.signedTransactionHash}`);
      mintButton.textContent = "Mint More";
      // fetch image & name
      const nftNumber = nftNumberMint + 1n;
      await fetchInfoNinja(nftNumber);
      nrsMinted.push(nftNumber);
      listMintedNfts();
    } else {
      alert('Minting transaction cancelled');
      console.log('Minting transaction cancelled');
      mintButton.textContent = "Mint Now";
    }
    mintButton.onclick = createMintingTxs;
    updateAmountMinted();
  } catch (error) {
    alert(error);
    console.log(error);
    cleanupFailedMint();
  }
}

const fetchInfoNinja = async (nftNumber) => {
  try {
    const promiseNinjaInfo = await fetch(urlApiServer + "/nfts/" + nftNumber);
    let respNinjaInfo = await promiseNinjaInfo.json();
    // If empty response, refetch API server after 0.5 sec
    if (Object.keys(respNinjaInfo).length === 0) {
      setTimeout(async () => { respNinjaInfo = await fetchInfoNinja(nftNumber), 500; });
    } else {
      document.getElementById("imageMint").src = urlApiServer + "/images/" + nftNumber;
      document.getElementById("textImageMint").textContent = respNinjaInfo.name;
    }
  } catch (error) { console.log(error); }
};

const listMintedNfts = () => {
  document.getElementById("numbersMinted").style.display = "block";
  const Placeholder = document.getElementById("Placeholder");
  const template = document.getElementById("nr-template");
  const span = document.createElement("span");
  span.setAttribute("id", "Placeholder");
  nrsMinted.forEach((nftNumber, index) => {
    const nrButton = document.importNode(template.content, true);
    const nr = nrButton.querySelector(".nr");
    nr.textContent = "#" + nftNumber;
    if (index != nrsMinted.length - 1) nrButton.querySelector(".comma").style.display = "inline-block";
    else nr.style.textDecoration = "underline";
    nr.addEventListener("click", async () => {
      fetchInfoNinja(nftNumber);
      document.querySelectorAll(".nr").forEach(nr => nr.style.textDecoration = "none");
      nr.style.textDecoration = "underline";
    });
    span.appendChild(nrButton);
  });
  Placeholder.replaceWith(span);
};

async function signTransaction(options) {
  try {
    const result = await signClient.request({
      chainId: connectedChain,
      topic: session.topic,
      request: {
        method: "bch_signTransaction",
        params: JSON.parse(stringify(options)),
      },
    });

    return result;
  } catch (error) {
    return undefined;
  }
}

async function getUserAddress() {
  try {
    const result = await signClient.request({
      chainId: connectedChain,
      topic: session.topic,
      request: {
        method: "bch_getAddresses",
        params: {},
      },
    });
    return result[0];
  } catch (error) {
    return undefined;
  }
};
