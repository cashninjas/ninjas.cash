import { urlApiServer } from "/js/mintingParams.js";
import rarity from "/js/rarity.json";

// Read URL Params
const urlParams = new URLSearchParams(window.location.search);
const nftNumber = urlParams.get("id");

// Fetch ninja metadata from api server
const fetchBcmrPromise = await fetch(urlApiServer + "/nfts/" + nftNumber);
const ninjaData = await fetchBcmrPromise.json();

document.getElementById("imageNinja").src = ninjaData.uris.image;
document.getElementById("ninjaName").textContent = ninjaData.name;
document.getElementById("ninjaDescription").textContent = ninjaData.description;

const ninjaAttributes = ninjaData.extensions.attributes;

if(ninjaAttributes?.Specials){
  // If special ninja, display specials' name
  document.getElementById("normalAttributes").style.display = "none";
  document.getElementById("specialAttribute").style.display = "block";
  document.getElementById("Specials").textContent = ninjaAttributes.Specials;
} else {
  // Set the attributes divs to the Ninjas' attributes
  ["Marking","Weapon","Background","Eyes","Primary Color","Secondary Color"].forEach(attribute => {
    const attributeWord = attribute.replace(/ /g,'');
    const elementDiv = document.getElementById(attributeWord);
    elementDiv.textContent = ninjaAttributes[attribute];
    // Get the attributes' rarity info
    const ninjaAttribute = ninjaAttributes[attribute];
    const rarityInfo = rarity[attribute].find(obj => obj.trait === ninjaAttribute);
    const rarityOccurence = rarityInfo.occurrence;
    const regexResult = rarityOccurence.match(/\(.+?\)/);
    const rarityString = regexResult[0];
    document.getElementById(attributeWord+"Rarity").textContent = rarityString;
  })
}
