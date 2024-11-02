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
const contract_wasm = fs.readFileSync("../contract.wasm.gz");

// setting secret js client
const secretjs = new SecretNetworkClient({
  chainId: chaindId,
  url: lcdUrl,
  wallet: wallet,
  walletAddress: wallet.address,
});
// see what is it
//console.log(secretjs);

let codeId = 0;
let contractCodeHash = "";
let contractAddress = "";

// upload the compiled contract
let upload_contract = async () => {
  let tx = await secretjs.tx.compute.storeCode(
    {
      sender: wallet.address,
      wasm_byte_code: contract_wasm,
      source: "",
      builder: "",
    },
    {
      gasLimit: 10_000_000,
    }
  );
  console.log("tx: " + tx);
  //console.dir(tx , { depth: null }); // IMPORTANT FOR DEBUGGING
  console.log("rawlog: " + tx.rawLog)
  codeId = Number(
    tx.arrayLog.find((log) => log.type === "message" && log.key === "code_id")
      .value,
  );
  console.log("codeId: ", codeId);
  contractCodeHash = (
    await secretjs.query.compute.codeHashByCodeId({ code_id: codeId })
  ).code_hash;
  console.log(`Contract hash: ${contractCodeHash}`);
  writeToEnv("CODE_ID", codeId.toString());
  writeToEnv("CONTRACT_CODE_HASH", contractCodeHash.toString());
};

await upload_contract();

// execute message
let try_increment_count = async () => {
  let tx = await secretjs.tx.compute.executeContract(
    {
      sender: wallet.address,
      contract_address: contractAddress,
      code_hash: contractCodeHash, // optional but way faster
      msg: {
        increment: {},
      },
      sentFunds: [], // optional
    },
    {
      gasLimit: 100_000,
    }
  );
  console.log("incrementing...");
};

