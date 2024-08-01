import axios from "axios";
import readline from "readline";
import Wallet from "../lib/wallet";
import dotenv from "dotenv";
import Transaction from "../lib/transaction";
import TransactionType from "../lib/transactionType";
import TransactionInput from "../lib/transactionInput";
import TransactionOutput from "../lib/transactionOutput";
dotenv.config();

const BLOCKCHAIN_SERVER = process.env.BLOCKCHAIN_SERVER;

let myWalletPub = "";
let myWalletPriv = "";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function menu() {
  setTimeout(() => {
    console.clear();

    if (myWalletPub) console.log(`You are logged as ${myWalletPub}`);
    else console.log(`You arent't logged.`);

    console.log("1 - Create Wallet");
    console.log("2 - Recover Wallet");
    console.log("3 - Balance");
    console.log("4 - Send tx");
    console.log("5 - Search tx");
    rl.question("Choose your option: ", (answer) => {
      switch (answer) {
        case "1":
          createWallet();
          break;
        case "2":
          recoverWallet();
          break;
        case "3":
          getBalance();
          break;
        case "4":
          sendTx();
          break;
        case "5":
          sendTx();
          break;  
        default: {
          console.log("Wrong option");
          menu();
        }
      }
    });
  }, 1000);
}

function preMenu() {
  rl.question(`Press any key to continue...`, () => {
    menu();
  });
}

function createWallet() {
  console.clear();
  const wallet = new Wallet();
  console.log(`You new wallet:`);
  console.log(wallet);

  myWalletPub = wallet.publicKey;
  myWalletPriv = wallet.privateKey;
  preMenu();
}

function recoverWallet() {
  console.clear();
  rl.question(`What is your key or WIF?`, (wifOrPrivateKey) => {
    const wallet = new Wallet(wifOrPrivateKey);
    console.log(`You recovered wallet:`);
    console.log(wallet);

    myWalletPub = wallet.publicKey;
    myWalletPriv = wallet.privateKey;
    preMenu();
  });
}

async function getBalance() {
  console.clear();

  if (!myWalletPub) {
    console.log(`You dont´t have a wallet yet.`);
    return preMenu();
  }

  const {data} = await axios.get(`${BLOCKCHAIN_SERVER}wallet/${myWalletPub}`);
  console.log("Balance: " + data.balance);
  preMenu();
}

function sendTx() {
  console.clear();

  if (!myWalletPub) {
    console.log(`You dont´t have a wallet yet.`);
    return preMenu();
  }

  console.log(`Your wallet is ${myWalletPub}`);
  rl.question(`To Wallet: `, (toWallet) => {
    if (toWallet.length < 66) {
      console.log(`Invalid wallet.`);
      return preMenu();
    }

    rl.question(`Amount: `, async (amountStr) => {
      const amount = parseInt(amountStr);
      if (!amount) {
        return preMenu();
      }

      const walletResponse = await axios.get(`${BLOCKCHAIN_SERVER}wallets/${myWalletPub}`);
      const balance = walletResponse.data.balance as number;
      const fee = walletResponse.data.fee as number;
      const utxo = walletResponse.data.utxo as TransactionOutput[];

      if (balance < amount + fee) {
        console.log('Insufficient balance (tx + fee).');
        return preMenu();
      }

      const txInputs = utxo.map(txo => TransactionInput.fromTxo(txo));
      txInputs.forEach((txi, index, arr) => arr[index].sign(myWalletPriv));

      //Transação de transferência
      const txOutputs = [] as TransactionOutput[];
      txOutputs.push(new TransactionOutput({
        toAddress: toWallet,
        amount
      } as TransactionOutput));

      //Transação de troco
      const remainingBalance = balance - amount - fee;
      txOutputs.push(new TransactionOutput({
        toAddress: myWalletPub,
        amount: remainingBalance
      } as TransactionOutput));

      const tx = new Transaction({
        txInputs,
        txOutputs
      } as Transaction);      
     
      tx.hash = tx.getHash();
      tx.txOutputs.forEach((txo, index, arr) => arr[index].tx = tx.hash);

      console.log(tx);
      console.log("Remaining Balance: " + remainingBalance);

      try {
        const txResponse = await axios.post(
          `${BLOCKCHAIN_SERVER}transactions/`,
          tx
        );
        console.log(`Transaction accepted. Waiting the miners!`);
        console.log(txResponse.data.hash);
      } catch (err: any) {
        console.error(err.response ? err.response.data : err.message);
      }

      return preMenu();
    });
  });

  //TODO: get balance via API
  preMenu();
}

function searchTX() {
  console.clear();
  rl.question(`Your tx hash: `, async (hash) => {
    const response = await axios.get(`${BLOCKCHAIN_SERVER}transactions/${hash}`);
    console.log(response.data);
    return preMenu();
  })
}

menu();
