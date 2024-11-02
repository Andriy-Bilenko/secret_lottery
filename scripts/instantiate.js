import { SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
import dotenv from "dotenv";
import { writeToEnv } from './write2env.js';
dotenv.config();

// npm install secretjs dotenv
// node store.js
const wallet = new Wallet(process.env.MNEMONIC);
const chaindId = process.env.CHAIN_ID;
const lcdUrl = process.env.LCD_URL;

// setting secret js client
const secretjs = new SecretNetworkClient({
  chainId: chaindId,
  url: lcdUrl,
  wallet: wallet,
  walletAddress: wallet.address,
});
// see what is it
//console.log(secretjs);

let codeId = process.env.CODE_ID;
let contractCodeHash = process.env.CONTRACT_CODE_HASH;
let contractAddress = "";

// instantiate the contract
let instantiate_contract = async () => {
  // Create an instance of the Counter contract, providing a starting count
  const initMsg = { participation_fee_uscrt: "500000" };
  let tx = await secretjs.tx.compute.instantiateContract(
    {
      code_id: codeId,
      sender: wallet.address,
      code_hash: contractCodeHash,
      init_msg: initMsg,
      label: "CTR" + Math.ceil(Math.random() * 10000),
    },
    {
      gasLimit: 400_000,
    }
  );
  //console.dir(tx , { depth: null }); // IMPORTANT FOR DEBUGGING
  //console.log("rawlog: " + tx.rawLog)


  //Find the contract_address in the logs
  contractAddress = tx.arrayLog.find(
    (log) => log.type === "message" && log.key === "contract_address"
  ).value;

  console.log(contractAddress);
  writeToEnv("CONTRACT_ADDRESS", contractAddress.toString());
};

instantiate_contract();
