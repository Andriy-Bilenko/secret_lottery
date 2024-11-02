import React, { useState } from "react";
import { SecretNetworkClient, MsgExecuteContract, Wallet } from "secretjs";
import { Window as KeplrWindow } from "@keplr-wallet/types";

// npm install
// npm start

declare global {
  interface Window extends KeplrWindow { }
}

const wallet = new Wallet(process.env.REACT_APP_MNEMONIC);

const chainId = process.env.REACT_APP_CHAIN_ID!;
const codeId = process.env.REACT_APP_CODE_ID!;
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS!;
const contractCodeHash = process.env.REACT_APP_CONTRACT_CODE_HASH!;
const lcdUrl = process.env.REACT_APP_LCD_URL!;

console.log(`local url = ${lcdUrl}`);
console.log(`chainId = ${chainId}`);
console.log(`code id = ${codeId}`);
console.log(`contract hash = ${contractCodeHash}`);
console.log(`contract address = ${contractAddress}`);

let secretjs: SecretNetworkClient | undefined;

// let keplrOfflineSigner: OfflineAminoSigner;
let myWalletAddr: string | undefined;


const convertUscrtToScrt = (uscrtString: string): number => {
  try {
    // Validate that the input string is a valid number
    if (!/^\d+$/.test(uscrtString)) {
      throw new Error(`Invalid input for uscrt: ${uscrtString}`);
    }

    const uscrtValue = BigInt(uscrtString); // Use BigInt for large numbers
    const scrtValue = Number(uscrtValue) / 1_000_000; // Convert to SCRT
    return scrtValue;
  } catch (error) {
    console.error("Error converting uSCRT to SCRT:", error);
    return 0; // Return a default value or handle the error as needed
  }
};

const convertScrtToUscrt = (scrtValue: number): string => {
  try {
    // Validate that the input is a valid number
    if (isNaN(scrtValue) || scrtValue < 0) {
      throw new Error(`Invalid input for SCRT: ${scrtValue}`);
    }

    // Convert SCRT to uSCRT (1 SCRT = 1,000,000 uSCRT)
    const uscrtValue = BigInt(scrtValue * 1_000_000); // Use BigInt for large numbers

    return uscrtValue.toString(); // Return as string or you can return BigInt directly
  } catch (error) {
    console.error("Error converting SCRT to uSCRT:", error);
    return "0"; // Return a default value or handle the error as needed
  }
};


const getKeplrWalletAddress = async () => {
  if (chainId == "secretdev-1") {
    // local address from mnemonic
    return wallet.address;
  } else {

    // Check if Keplr is installed
    if (window.getOfflineSigner) {
      const chainId = "pulsar-3"; // Replace with your desired chain ID, e.g., "cosmoshub-4"

      try {
        // Request permission to access the account
        const offlineSigner = window.getOfflineSigner(chainId);
        await offlineSigner.getAccounts(); // This prompts the user to connect their wallet

        // Retrieve the accounts
        const accounts = await offlineSigner.getAccounts();
        if (accounts.length > 0) {
          const walletAddress = accounts[0].address; // Get the first account's address
          console.log("Connected wallet address:", walletAddress);
          return walletAddress;
        } else {
          console.log("No accounts found");
          return null;
        }
      } catch (error) {
        console.error("Error connecting to Keplr wallet:", error);
        return null;
      }
    } else {
      console.log("Please install Keplr!");
      return null;
    }
  }
};


const App: React.FC = () => {
  const [connectKeplrBtnText, setConnectKeplrBntText] = useState<string>("connect Keplr");
  const [isWalletConnected, setIswalletConnected] = useState(false);
  const [imOwner, setImOwner] = useState(false);

  const [participationFeeScrt, setParticipationFeeScrt] = useState<number>(0);
  const [isParticipant, setIsParticipant] = useState<string>("_");
  const [lastWinner, setLastWinner] = useState<string>("_");
  const [participants, setParticipants] = useState<string[]>([]);
  const [owner, setOwnerText] = useState<string>("_");
  const [participantsCount, setParticipantsCount] = useState<number>(0);

  const [winningPool, setWinningPool] = useState<string>("_");

  async function requestKeplr(): Promise<string> {
    if (chainId == "secretdev-1") {
      // localsecret
      // setting secret js client
      secretjs = new SecretNetworkClient({
        chainId: chainId,
        url: lcdUrl,
        wallet: wallet,
        walletAddress: wallet.address,
      });
      myWalletAddr = wallet.address;
      alert("connected localsecret: " + myWalletAddr);
      console.log("wallet: " + wallet);
      console.dir(wallet, { depth: null });
    } else {
      if (!window.keplr) {
        alert("Please install keplr extension");
        return "";
      }

      // Enabling before using the Keplr is recommended.
      // This method will ask the user whether to allow access if they haven't visited this website.
      // Also, it will request that the user unlock the wallet if the wallet is locked.
      await window.keplr.enable(chainId);

      const offlineSigner = window.keplr.getOfflineSigner(chainId);

      // You can get the address/public keys by `getAccounts` method.
      // It can return the array of address/public key.
      // But, currently, Keplr extension manages only one address/public key pair.
      // XXX: This line is needed to set the sender address for SigningCosmosClient.
      const accounts = await offlineSigner.getAccounts();

      console.log("accounts: ", accounts);
      console.log("offlineSigner: ", offlineSigner);

      const keplrOfflineSigner = window.keplr.getOfflineSignerOnlyAmino(chainId);
      [{ address: myWalletAddr }] = await keplrOfflineSigner.getAccounts();

      console.log("Initializing Secret.js client ...");
      secretjs = new SecretNetworkClient({
        url: lcdUrl,
        chainId: chainId,
        wallet: keplrOfflineSigner,
        walletAddress: myWalletAddr,
        encryptionUtils: window.keplr.getEnigmaUtils(chainId),
      });
    }
    console.log(`Created client for wallet address: ${myWalletAddr}`);
    setConnectKeplrBntText("connected: " + myWalletAddr + ", wanna disconnect?")
    setIswalletConnected(true);

    await queryOwner();
    //await queryParticipantsCount();
    //await queryParticipationFee();
    setWinningPool(((await queryParticipationFee()) * (await queryParticipantsCount())).toString());
    console.log("COUNTING WINNING POOL")
    console.log("participant count: " + participantsCount)
    console.log("pool: " + (participationFeeScrt * participantsCount))
    console.log("COUNTING WINNING POOL")
    await queryLastWinner();
    await queryParticipated();
    await queryParticipants();

    return myWalletAddr!;

  }


  const queryParticipants = async () => {
    const readOnlySecretjs = new SecretNetworkClient({
      url: lcdUrl,
      chainId: chainId,
    });

    type AllParticipantsRespose = { all_participants: string[] };

    const response = await readOnlySecretjs.query.compute.queryContract({
      contract_address: contractAddress,
      code_hash: contractCodeHash,
      query: { get_all_participants: {} },
    }) as AllParticipantsRespose;

    //// Check if the response has an error
    //if (typeof response === 'object' && 'err' in response) {
    //  throw new Error(`Query failed with the following err: ${JSON.stringify(response)}`);
    //}

    console.log("queried smart contract: ", response);
    setParticipants(response.all_participants);
  };

  const queryParticipated = async () => {
    const readOnlySecretjs = new SecretNetworkClient({
      url: lcdUrl,
      chainId: chainId,
    });

    type DidIParticipateResponse = { participated: boolean };

    const response = await readOnlySecretjs.query.compute.queryContract({
      contract_address: contractAddress,
      code_hash: contractCodeHash,
      query: { did_i_participate: { address: myWalletAddr } },
    }) as DidIParticipateResponse;

    // Check if response is an object and contains the 'err' property
    if (response && typeof response === 'object' && 'err' in response) {
      throw new Error(`Query failed with the following err: ${response.err}`);
    }

    console.log("queried smart contract (PARTICIPATED): ", response);
    setIsParticipant(response.participated ? "yes" : "no");
  };

  const queryLastWinner = async () => {
    const readOnlySecretjs = new SecretNetworkClient({
      url: lcdUrl,
      chainId: chainId,
    });

    type WinnerResponse = { last_winner: string };

    const response = await readOnlySecretjs.query.compute.queryContract({
      contract_address: contractAddress,
      code_hash: contractCodeHash,
      query: { get_last_winner: {} },
    }) as WinnerResponse;

    if ('err"' in response) {
      throw new Error(
        `Query failed with the following err: ${JSON.stringify(response)}`
      );
    }
    console.log("queried smart contract: ", response);
    setLastWinner(response.last_winner);
  };

  const queryOwner = async () => {
    const readOnlySecretjs = new SecretNetworkClient({
      url: lcdUrl,
      chainId: chainId,
    });

    type OwnerResponse = { owner: string };

    const response = await readOnlySecretjs.query.compute.queryContract({
      contract_address: contractAddress,
      code_hash: contractCodeHash,
      query: { get_owner: {} },
    }) as OwnerResponse;

    if ('err"' in response) {
      throw new Error(
        `Query failed with the following err: ${JSON.stringify(response)}`
      );
    }
    console.log("queried smart contract: ", response);
    console.log("owner is: " + response.owner)
    let yourAddr = await getKeplrWalletAddress();
    console.log("you are: " + yourAddr);
    setOwnerText(response.owner);

    if (yourAddr == response.owner) {
      setImOwner(true);
    }
  };

  const queryParticipantsCount = async (): Promise<number> => {
    const readOnlySecretjs = new SecretNetworkClient({
      url: lcdUrl,
      chainId: chainId,
    });

    type NumOfParticipantsResponse = { num: number };

    const response = await readOnlySecretjs.query.compute.queryContract({
      contract_address: contractAddress,
      code_hash: contractCodeHash,
      query: { get_num_of_participants: {} },
    }) as NumOfParticipantsResponse;

    if ('err"' in response) {
      throw new Error(
        `Query failed with the following err: ${JSON.stringify(response)}`
      );
    }
    console.log("queried smart contract: ", response);
    console.log("participants count: " + response.num);
    setParticipantsCount(response.num);
    return response.num
  };

  const queryParticipationFee = async (): Promise<number> => {
    const readOnlySecretjs = new SecretNetworkClient({
      url: lcdUrl,
      chainId: chainId,
    });

    type FeeResponse = { participation_fee_uscrt: string };

    const response = await readOnlySecretjs.query.compute.queryContract({
      contract_address: contractAddress,
      code_hash: contractCodeHash,
      query: { get_participation_fee: {} },
    }) as FeeResponse;

    if ('err"' in response) {
      throw new Error(
        `Query failed with the following err: ${JSON.stringify(response)}`
      );
    }
    console.log("queried smart contract: ", response);
    console.log("SCRT NEEDED: ", convertUscrtToScrt(response.participation_fee_uscrt));

    setParticipationFeeScrt(convertUscrtToScrt(response.participation_fee_uscrt));
    return convertUscrtToScrt(response.participation_fee_uscrt)
  };

  const handleParticipate = async () => {
    // Create the participation message
    const participationMsg = new MsgExecuteContract({
      sender: secretjs!.address,
      contract_address: contractAddress,
      code_hash: contractCodeHash,
      msg: { participate: {} }, // The message to send to the contract
      sent_funds: [{ amount: convertScrtToUscrt(participationFeeScrt), denom: "uscrt" }], // Correct property name for funds
    });

    console.log("Participation Message:", participationMsg);

    try {
      // Broadcast the participation message
      const tx = await secretjs!.tx.broadcast([participationMsg], {
        gasLimit: 200_000, // Specify the gas limit
      });

      console.log("Transaction Response:", tx);
      alert("Participation successful!");
    } catch (error) {
      console.error("Error during participation:", error);
      alert("Participation failed. Please check the console for more details.");
    }

  };

  const handleEndLottery = async () => {
    // Create the participation message
    const endLotteryMsg = new MsgExecuteContract({
      sender: secretjs!.address,
      contract_address: contractAddress,
      code_hash: contractCodeHash,
      msg: { end_lottery: {} }, // The message to send to the contract
    });

    console.log("End Lottery Message:", endLotteryMsg);

    try {
      // Broadcast the participation message
      const tx = await secretjs!.tx.broadcast([endLotteryMsg], {
        gasLimit: 200_000, // Specify the gas limit
      });

      if (tx.rawLog.toLowerCase().includes("error")) {
        alert(`Query failed with the following err: ${JSON.stringify(tx)}`)
        return
      }

      console.log("Transaction Response:", tx);
      alert("end of lottery is successful!");
    } catch (error) {
      console.error("Error during end lottery:", error);
      alert("end lottery failed. Please check the console for more details.");
    }

  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>lottery</h1>
      <h1>owner {owner}</h1>
      <h1>winning pool {winningPool} SCRT</h1>
      {isWalletConnected && isParticipant == "no" && (
        <button onClick={handleParticipate}>participate</button>
      )}
      {imOwner && (
        <button onClick={handleEndLottery}>end lottery</button>
      )}
      <div style={{ marginTop: "20px" }}>
        <h3>participation fee: {participationFeeScrt} SCRT</h3>
        <h3>participated: {isParticipant}</h3>
        <h3>last winner: {lastWinner}</h3>
        <h3>participants - {participantsCount}:</h3>
        <h3>{participants}</h3>
      </div>

      <div style={{ marginTop: "20px", textAlign: "right" }}>
        <button onClick={requestKeplr}>{connectKeplrBtnText}</button>
      </div>
    </div>
  );
};

export default App;
