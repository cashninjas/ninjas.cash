import SignClient from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { ElectrumCluster, ElectrumTransport } from 'electrum-cash';
import { ElectrumNetworkProvider } from "cashscript";
import { projectId, urlApiServer, tokenId, network, wcMetadata } from "/js/mintingParams.js";
import { bigIntToVmNumber, binToHex, hexToBin, vmNumberToBigInt } from '@bitauth/libauth';
import { listMarkings, listWeapons, listBackgrounds, listEyes, listColors, listSpecials } from "/js/attributes.js";

// Read URL Params
const urlParams = new URLSearchParams(window.location.search);
const urlParamAddr = urlParams.get("addr");
const urlParamFullCollection = urlParams.get("fullcollection");
const displayFullCollection = urlParamFullCollection == "";

// Define lists for ninja attributes
const checkboxLists = [listMarkings, listWeapons, listBackgrounds, listEyes, listColors, listColors, listSpecials];
const itemsPerAttributeList = [9, 22, 14, 16, 22, 22, 1];
const attributeNames = ["Markings", "Weapons", "Backgrounds", "Eyes", "Colors1", "Colors2", "Specials"];
const attributeKeys = ["Marking", "Weapon", "Background", "Eyes", "Primary Color", "Secondary Color", "Specials"];

// Create a custom 1-of-1 electrum cluster for bch-mainnet
const electrumCluster = new ElectrumCluster('Cash-Ninjas', '1.5.1', 1, 1);
electrumCluster.addServer('fulcrum.greyh.at', ElectrumTransport.WSS.Port, ElectrumTransport.WSS.Scheme);
const electrum = network == "mainnet" ? electrumCluster : undefined;
// Initialise cashscript ElectrumNetworkProvider
const electrumServer = new ElectrumNetworkProvider(network, electrum);

// Render Checkboxes
checkboxLists.forEach((checkboxList, index) => {
  const listName = "list" + attributeNames[index];
  const Placeholder = document.getElementById(listName);
  const divCheckboxList = document.createElement("div");
  divCheckboxList.setAttribute("id", listName);
  const template = document.getElementById("checkbox-template");
  checkboxList.forEach(listItem => {
    const checkboxTemplate = document.importNode(template.content, true);
    // Set itemAttribute & itemCount checkbox
    const itemAttribute = checkboxTemplate.getElementById("itemAttribute");
    itemAttribute.textContent = listItem;
    const itemCount = checkboxTemplate.getElementById("itemCount");
    const attributeKey = attributeKeys[index];
    const attributeString = (attributeKey + listItem).replace(/\s/g, '_');
    itemCount.setAttribute("id", "itemCount" + attributeString);
    // Set checkbox functionality
    const checkbox = checkboxTemplate.getElementById("idInput");
    checkbox.setAttribute("id", attributeString);
    const label = checkboxTemplate.getElementById("forIdInput");
    label.setAttribute("for", attributeString);
    checkbox.onclick = () => displayNinjas();
    // Add checkboxTemplate to list
    divCheckboxList.appendChild(checkboxTemplate);
  });
  Placeholder.replaceWith(divCheckboxList);
});

// Fetch full BCMR file from server
const fetchBcmrPromise = await fetch(urlApiServer + "/.well-known/bitcoin-cash-metadata-registry.json");
const fetchBcmrResult = await fetchBcmrPromise.json();
const nftMetadata = fetchBcmrResult.identities[tokenId]["2023-10-07T14:29:05.694Z"].token.nfts.parse.types;

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

// Try to reconnect to previous session on startup
let session;
if (lastSession && !urlParamAddr && !displayFullCollection) setTimeout(async () => {
  const confirmReuse = confirm("The collection page is going to re-use your previous WalletConnect session, make sure you have your wallet open");
  if (confirmReuse) {
    session = lastSession;
    fetchUserNinjas();
  }
}, 500);

// If urlParam has address, load collection 
if (urlParamAddr) setTimeout(async () => {
  const listCashninjas = await getNinjasOnAddr(urlParamAddr);
  updateCollection(listCashninjas);
  displayNinjas();
}, 500
);

if (displayFullCollection) setTimeout(async () => {
  let allNinjaNumbers = [];
  for (let i = 1; i <= 5000; i++) { allNinjaNumbers.push(i); }
  updateCollection(allNinjaNumbers);
  displayNinjas();
}, 500
);

// Global variables
let unfilteredListNinjas = [];
let ninjasConnectedWallet = [];
let connectedUserAddress = "";
// Functionality fullCollection & myCollection buttons
const fullCollectionButton = document.getElementById("FullCollection");
const myCollectionButton = document.getElementById("myCollectionButton");
fullCollectionButton.onclick = () => {
  window.history.replaceState({}, "", `${location.pathname}?fullcollection`);
  let allNinjaNumbers = [];
  for (let i = 1; i <= 5000; i++) { allNinjaNumbers.push(i); }
  updateCollection(allNinjaNumbers);
  displayNinjas();
};
myCollectionButton.onclick = async () => {
  if (session) fetchUserNinjas();
  else if (lastSession && !urlParamAddr) {
    const confirmReuse = confirm("The collection page is going to re-use your previous WalletConnect session, make sure you have your wallet open");
    if (confirmReuse) {
      session = lastSession;
      fetchUserNinjas();
    }
  } else {
    const { uri, approval } = await signClient.connect({ requiredNamespaces });
    await walletConnectModal.openModal({ uri });
    // Await session approval from the wallet.
    session = await approval();
    // Close the QRCode modal in case it was open.
    walletConnectModal.closeModal();
    fetchUserNinjas();
  };
};
async function fetchUserNinjas() {
  if (!ninjasConnectedWallet.length) {
    const userAddress = await getUserAddress();
    connectedUserAddress = userAddress;
    const listCashninjas = await getNinjasOnAddr(userAddress);
    ninjasConnectedWallet = listCashninjas;
  }
  window.history.replaceState({}, "", `${location.pathname}?addr=${connectedUserAddress}`);
  updateCollection(ninjasConnectedWallet);
  displayNinjas();
}

async function getNinjasOnAddr(address) {
  const userUtxos = await electrumServer.getUtxos(address);
  const cashNinjaUtxos = userUtxos.filter(val => val?.token?.category == tokenId);
  const listCashninjas = [];
  cashNinjaUtxos.forEach(ninjaUtxo => {
    const ninjaCommitment = ninjaUtxo.token.nft.commitment;
    const ninjaNumber = vmNumberToBigInt(hexToBin(ninjaCommitment)) + 1n;
    listCashninjas.push(Number(ninjaNumber));
  });
  return listCashninjas;
}

async function displayNinjas(offset = 0) {
  const filteredNinjaList = filterNinjaList(unfilteredListNinjas);
  const listNinjas = filteredNinjaList.sort((a, b) => a - b);
  const startPoint = offset * 100;
  const slicedArray = listNinjas.slice(startPoint, startPoint + 100);
  // Pagination logic
  renderPagination(offset, filteredNinjaList.length);

  // Create the HTML rendering setup
  const Placeholder = document.getElementById("PlaceholderNinjaList");
  const ninjaList = document.createElement("div");
  ninjaList.setAttribute("id", "PlaceholderNinjaList");
  ninjaList.classList.add("g-6", "row");
  // Render no ninjas if they don't own any
  if (slicedArray.length === 0) {
    const template = document.getElementById("no-ninjas");
    const noNinjasTemplate = document.importNode(template.content, true);
    ninjaList.appendChild(noNinjasTemplate);
    Placeholder.replaceWith(ninjaList);
  } else {
    // Render list of cashninjas
    const template = document.getElementById("ninja-template");
    slicedArray.forEach(ninjaNumber => {
      const ninjaTemplate = document.importNode(template.content, true);
      const ninjaImage = ninjaTemplate.getElementById("ninjaImage");
      ninjaImage.src = urlApiServer + '/icons/' + ninjaNumber;
      const ninjaName = ninjaTemplate.getElementById("ninjaName");
      const ninjaCommitment = binToHex(bigIntToVmNumber(BigInt(ninjaNumber - 1)));
      const ninjaData = nftMetadata[ninjaCommitment];
      ninjaName.textContent = ninjaData?.name ?? `Ninja #${ninjaNumber}`;
      const viewerLink = ninjaTemplate.getElementById("viewerLink");
      viewerLink.href = './viewer.html?id=' + ninjaNumber;
      ninjaList.appendChild(ninjaTemplate);
    });
    Placeholder.replaceWith(ninjaList);
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

function updateCollection(newCollection) {
  unfilteredListNinjas = newCollection;
  // Create obj of attributes object to track unique items
  const attributeObjs = {};
  attributeKeys.forEach(attributeKey => {
    attributeObjs[attributeKey] = {};
  });

  // Create count of occurance for each attribute
  unfilteredListNinjas.forEach(ninjaNumber => {
    const ninjaCommitment = binToHex(bigIntToVmNumber(BigInt(ninjaNumber - 1)));
    const ninjaData = nftMetadata[ninjaCommitment];
    const ninjaAttributes = ninjaData?.extensions.attributes;

    if (ninjaData) {
      let attributeClasses = "attributeClasses";
      Object.keys(ninjaAttributes).forEach((attributeKey, index) => {
        const attibuteObj = attributeObjs[attributeKey];
        const attributeValue = ninjaAttributes[attributeKey];
        let attributeClass = " " + (attributeKey + attributeValue).replace(/\s/g, '_');
        if (attributeKey == "Specials") attributeClass = " Specials";
        attributeClasses += attributeClass;
        if (attibuteObj[attributeValue]) attibuteObj[attributeValue] += 1;
        else attibuteObj[attributeValue] = 1;
      });
    }
  });

  // Display total counts
  attributeNames.forEach((attributeName, index) => {
    const idTotalCount = "number" + attributeName;
    const totalCountDiv = document.getElementById(idTotalCount);
    const attibuteObj = attributeObjs[attributeKeys[index]];
    const countUniqueItems = Object.keys(attibuteObj).length;
    const countDisplayString = (idTotalCount != "numberSpecials") ? countUniqueItems + "/" + itemsPerAttributeList[index] : countUniqueItems;
    totalCountDiv.textContent = countDisplayString;
  });

  // display Indvidual Counts
  checkboxLists.forEach((checkboxList, index) => {
    checkboxList.forEach(listItem => {
      const attributeKey = attributeKeys[index];
      const attributeString = (attributeKey + listItem).replace(/\s/g, '_');
      const itemCountElem = document.getElementById("itemCount" + attributeString);
      const attibuteObj = attributeObjs[attributeKey];
      let itemCount = attibuteObj[listItem];
      if (listItem == "All Specials") itemCount = Object.keys(attributeObjs[attributeKey]).length;
      itemCountElem.textContent = itemCount ?? 0;
    });
  });
}

function renderPagination(offset, listLength) {
  const paginationDiv = document.querySelector(".pagination");
  const nrOfPages = Math.ceil(listLength / 100);
  if (nrOfPages <= 1) {
    paginationDiv.style.display = "none";
    return;
  }
  paginationDiv.style.display = "flex";
  // Show buttons by default
  ["pageLast", "pageMiddle", "skipPages", "pageLast"].forEach(elem => {
    document.getElementById(elem).style.display = "block";
  });
  document.getElementById("endingDots").style.display = "flex";
  // Hide page buttons depending on the nrOfPages
  document.getElementById("pageLast").firstChild.textContent = nrOfPages;
  if (nrOfPages <= 4) document.getElementById("endingDots").style.display = "none";
  if (nrOfPages <= 3) document.getElementById("pageMiddle").style.display = "none";
  if (nrOfPages == 2) {
    document.getElementById("skipPages").style.display = "none";
    document.getElementById("pageLast").style.display = "none";
  }
  // Page button functionality
  const pageButtons = ["pageOne", "pageTwo", "pageMiddle", "pageLast"];
  const setActiveButton = (activePageButton) => {
    pageButtons.forEach(pageButton => {
      const pageButtonElem = document.getElementById(pageButton);
      if (pageButton != activePageButton) pageButtonElem.classList.remove("active");
      else pageButtonElem.classList.add("active");
    });
  };
  // Logic for numbering, highlighting & dots
  const changeActivePage = (pageNumber, nrOfPages) => {
    let activePageButton;
    if (pageNumber == 1) activePageButton = pageButtons[0];
    else if (pageNumber == 2) activePageButton = pageButtons[1];
    else if (pageNumber == nrOfPages) activePageButton = pageButtons[3];
    else {
      activePageButton = pageButtons[2];
      document.getElementById(activePageButton).firstChild.textContent = pageNumber;
      const startingDots = document.getElementById("startingDots");
      const endingDots = document.getElementById("endingDots");
      if (pageNumber == 3) startingDots.style.display = "none";
      else startingDots.style.display = "flex";
      if (pageNumber == nrOfPages - 1) endingDots.style.display = "none";
      else endingDots.style.display = "flex";
    }
    setActiveButton(activePageButton);
    displayNinjas(pageNumber - 1);
  };
  // reset active page button after filtering
  if (offset == 0) setActiveButton("pageOne");
  // onclick events buttons
  pageButtons.forEach(pageButton => {
    const pageButtonElem = document.getElementById(pageButton);
    pageButtonElem.onclick = () => changeActivePage(+pageButtonElem.textContent, nrOfPages);
  });
  // Previous page button functionality
  const previousPageButton = document.getElementById("previousPage");
  if (offset == 0) {
    previousPageButton.classList.add("disabled");
    previousPageButton.onclick = () => { };
  } else {
    const pageNumber = offset + 1;
    previousPageButton.onclick = () => changeActivePage(pageNumber - 1, nrOfPages);
    previousPageButton.classList.remove("disabled");
  }
  // Next page button functionality
  const nextPageButton = document.getElementById("nextPage");
  const startPoint = offset * 100;
  if (startPoint + 100 >= listLength) {
    nextPageButton.classList.add("disabled");
    nextPageButton.onclick = () => { };
  } else {
    const pageNumber = offset + 1;
    nextPageButton.onclick = () => changeActivePage(pageNumber + 1, nrOfPages);
    nextPageButton.classList.remove("disabled");
  }
  // Skip pages button functionality
  const skipPagesButton = document.getElementById("skipPages");
  if (startPoint + 100 >= listLength) {
    skipPagesButton.classList.add("disabled");
    skipPagesButton.onclick = () => { };
  } else {
    const pageNumber = offset + 1;
    const newPageNr = (pageNumber + 10 < nrOfPages) ? pageNumber + 10 : nrOfPages;
    skipPagesButton.onclick = () => changeActivePage(newPageNr, nrOfPages);
    skipPagesButton.classList.remove("disabled");
  }
}

// Fuctions for filtering the NinjaList
function filterNinjaList(listCashninjas) {
  const checkboxes = document.getElementsByName("checkbox");
  // Keeps track of the filtering, updated after each category
  let filteredNinjaList = listCashninjas;
  let sumItemCountCategories = 0;
  // Filtering within category interpreted as OR, across category as AND
  for (const [categoryNr, nrItems] of itemsPerAttributeList.entries()) {
    // Keeps track of the items in a category, becomes new filteredNinjaList at end of category and starts fresh again
    let categoryList = [];
    let hasFiltered = false;
    for (let i = 0; i < nrItems; i++) {
      const checkboxNr = sumItemCountCategories + i;
      const checkbox = checkboxes[checkboxNr];
      if (checkbox.checked) {
        hasFiltered = true;
        const categoryToFilterOn = attributeKeys[categoryNr];
        const classToFilter = checkbox.id;
        const attributeToFilterOn = classToFilter.replace(/_/g, ' ').replace(categoryToFilterOn, "");
        // Filters the current NFT list
        filteredNinjaList.forEach(ninjaNumber => {
          const ninjaCommitment = binToHex(bigIntToVmNumber(BigInt(ninjaNumber - 1)));
          const ninjaData = nftMetadata[ninjaCommitment];
          const ninjaAttributes = ninjaData?.extensions.attributes;
          // Only run these check for ninja numbers with metadata available
          if (ninjaAttributes) {
            if (ninjaAttributes[categoryToFilterOn] == attributeToFilterOn) categoryList.push(ninjaNumber);
            if (categoryToFilterOn == "Specials" && ninjaAttributes[categoryToFilterOn]) categoryList.push(ninjaNumber);
          }
        });
      }
    }
    // If category has filtered, set new filteredList for next category
    if (hasFiltered) filteredNinjaList = categoryList;
    sumItemCountCategories += nrItems;
  }
  return filteredNinjaList;
}
