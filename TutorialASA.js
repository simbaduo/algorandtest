const algosdk = require("algosdk");
//Retrieve the token, server and port values for your installation in the algod.net
//and algod.token files within the data directory
// UPDATE THESE VALUES
const token =
  "ef920e2e7e002953f4b29a8af720efe8e4ecc75ff102b165e0472834b25832c1";
const server = "http://hackathon.algodev.network";
const port = 9100;
// Structure for changing blockchain params
var cp = {
  fee: 0,
  firstRound: 0,
  lastRound: 0,
  genID: "",
  genHash: ""
};

// Utility function to update params from blockchain
var getChangingParms = async function(algodclient) {
  let params = await algodclient.getTransactionParams();
  cp.firstRound = params.lastRound;
  cp.lastRound = cp.firstRound + parseInt(1000);
  let sfee = await algodclient.suggestedFee();
  cp.fee = sfee.fee;
  cp.genID = params.genesisID;
  cp.genHash = params.genesishashb64;
};

// Function used to wait for a tx confirmation
var waitForConfirmation = async function(algodclient, txId) {
  while (true) {
    b3 = await algodclient.pendingTransactionInformation(txId);
    if (b3.round != null && b3.round > 0) {
      //Got the completed Transaction
      console.log("Transaction " + b3.tx + " confirmed in round " + b3.round);
      break;
    }
  }
};

// Recover accounts created in Step 1A
// paste in mnemonic phrases here for each account

var account1_mnemonic =
  "ball color holiday door impose minimum rate space select abandon crop impact turn volume rude fat sleep ripple dentist stool yellow dry miss able state";
var account2_mnemonic =
  "adult solar wall sad snow jump lake announce absorb middle switch south toy roof maze jaguar drama ticket erupt surround protect supreme check absent lazy";
var account3_mnemonic =
  "correct column toe depth view woman aisle wealth denial impulse shrug february exist pelican cycle family silk favorite never offer tuna pool rib absent fruit";

var recoveredAccount1 = algosdk.mnemonicToSecretKey(account1_mnemonic);
var recoveredAccount2 = algosdk.mnemonicToSecretKey(account2_mnemonic);
var recoveredAccount3 = algosdk.mnemonicToSecretKey(account3_mnemonic);
console.log(recoveredAccount1.addr);
console.log(recoveredAccount2.addr);
console.log(recoveredAccount3.addr);
// Instantiate the algod wrapper
let algodclient = new algosdk.Algod(token, server, port);
//console/terminal output should look similar to this
//THQHGD4HEESOPSJJYYF34MWKOI57HXBX4XR63EPBKCWPOJG5KUPDJ7QJCM
//AJNNFQN7DSR7QEY766V7JDG35OPM53ZSNF7CU264AWOOUGSZBMLMSKCRIU
//3ZQ3SHCYIKSGK7MTZ7PE7S6EDOFWLKDQ6RYYVMT7OHNQ4UJ774LE52AQCU
(async () => {
  // Asset Creation:
  // The first transaciton is to create a new asset
  // Get last round and suggested tx fee
  // We use these to get the latest round and tx fees
  // These parameters will be required before every
  // Transaction
  // We will account for changing transaction parameters
  // before every transaction in this example
  await getChangingParms(algodclient);
  let note = undefined; // arbitrary data to be stored in the transaction; here, none is stored
  //Asset creation specific parameters
  // The following parameters are asset specific
  // Throughout the example these will be re-used.
  // We will also change the manager later in the example
  let addr = recoveredAccount1.addr;
  // Whether user accounts will need to be unfrozen before transacting
  let defaultFrozen = false;
  // integer number of decimals for asset unit calculation
  let decimals = 0;
  // total number of this asset available for circulation
  let totalIssuance = 1000;
  // Used to display asset units to user
  let unitName = "LATINUM";
  // Friendly name of the asset
  let assetName = "latinum";
  // Optional string pointing to a URL relating to the asset
  let assetURL = "http://someurl";
  // Optional hash commitment of some sort relating to the asset. 32 character length.
  let assetMetadataHash = "16efaa3924a6fd9d3a4824799a4ac65d";
  // The following parameters are the only ones
  // that can be changed, and they have to be changed
  // by the current manager
  // Specified address can change reserve, freeze, clawback, and manager
  let manager = recoveredAccount2.addr;
  // Specified address is considered the asset reserve
  // (it has no special privileges, this is only informational)
  let reserve = recoveredAccount2.addr;
  // Specified address can freeze or unfreeze user asset holdings
  let freeze = recoveredAccount2.addr;
  // Specified address can revoke user asset holdings and send
  // them to other addresses
  let clawback = recoveredAccount2.addr;

  // signing and sending "txn" allows "addr" to create an asset
  let txn = algosdk.makeAssetCreateTxn(
    addr,
    cp.fee,
    cp.firstRound,
    cp.lastRound,
    note,
    cp.genHash,
    cp.genID,
    totalIssuance,
    decimals,
    defaultFrozen,
    manager,
    reserve,
    freeze,
    clawback,
    unitName,
    assetName,
    assetURL,
    assetMetadataHash
  );

  let rawSignedTxn = txn.signTxn(recoveredAccount1.sk);
  let tx = await algodclient.sendRawTransaction(rawSignedTxn);
  console.log("Transaction : " + tx.txId);
  let assetID = null;
  // wait for transaction to be confirmed
  await waitForConfirmation(algodclient, tx.txId);
  // Get the new asset's information from the creator account
  let ptx = await algodclient.pendingTransactionInformation(tx.txId);
  assetID = ptx.txresults.createdasset;
  console.log("AssetID = " + assetID);

  // your terminal/console output should be similar to this
  // Transaction: RXSAJUYVPDWUF4XNGA2VYQX3NUVT5YJEZZ5SJXIIASZK5M55LVVQ
  // Transaction RXSAJUYVPDWUF4XNGA2VYQX3NUVT5YJEZZ5SJXIIASZK5M55LVVQ confirmed in round 4272786
  // AssetID = 149657
})().catch(e => {
  console.log(e);
  console.trace();
});
