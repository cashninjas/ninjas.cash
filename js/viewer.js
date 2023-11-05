import { urlApiServer } from "/js/mintingParams.js";

// Read URL Params
const urlParams = new URLSearchParams(window.location.search);
const nftNumber = urlParams.get("id");;

// Fetch ninja metadata from api server
const fetchBcmrPromise = await fetch(urlApiServer + "/nfts/" + nftNumber);
const fetchBcmrResult = await fetchBcmrPromise.json();
console.log(fetchBcmrResult)

document.getElementById("imageNinja").src = fetchBcmrResult.uris.image
document.getElementById("ninjaName").textContent = fetchBcmrResult.name
document.getElementById("ninjaDescription").textContent = fetchBcmrResult.description
