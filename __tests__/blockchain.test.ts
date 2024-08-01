import { describe, test, expect, jest, beforeAll } from "@jest/globals";
import Blockchain from "../src/lib/blockchain";
import Block from "../src/lib/block";
import Transaction from "../src/lib/transaction";
import TransactionInput from "../src/lib/transactionInput";
import Wallet from "../src/lib/wallet";
import TransactionType from "../src/lib/transactionType";
import TransactionOutput from "../src/lib/transactionOutput";

jest.mock("../src/lib/block");
jest.mock("../src/lib/transaction");
jest.mock("../src/lib/transactionInput");

describe("Blockchain tests", () => {
  let alice: Wallet, bob: Wallet;

  beforeAll(() => {
    alice = new Wallet();
    bob = new Wallet();
  });

  test("Should has genesis blocks", () => {
    const blockchain = new Blockchain(alice.publicKey);
    expect(blockchain.blocks.length).toEqual(1);
  });

  test("Should be valid", () => {
    const txInput = new TransactionInput({
      amount: 10,
      fromAddress: alice.publicKey,
      previousTx: "abc",
    } as TransactionInput);

    const valid = txInput.isValid();
    expect(valid.success).toBeTruthy();
  });

  test("Should add block", () => {
    const blockchain = new Blockchain(alice.publicKey);

    const tx = new Transaction({
      txInputs: [new TransactionInput()],
    } as Transaction);

    blockchain.mempool.push(tx);

    const newBlock = new Block({
      index: 1,
      previousHash: blockchain.blocks[0].hash,
      transactions: [
        new Transaction({
          txInputs: [new TransactionInput()],
        } as Transaction),
      ],
    } as Block);
    const result = blockchain.addBlock(newBlock);
    expect(result.success).toEqual(true);
  });

  test("Should add block (invalid mempool)", () => {
    const blockchain = new Blockchain(alice.publicKey);
    blockchain.mempool.push(new Transaction());
    blockchain.mempool.push(new Transaction());

    const tx = new Transaction({
      txInputs: [new TransactionInput()],
    } as Transaction);

    blockchain.mempool.push(tx);

    const result = blockchain.addBlock(
      new Block({
        index: 1,
        previousHash: blockchain.blocks[0].hash,
        transactions: [tx],
      } as Block)
    );

    expect(result.success).toBeFalsy();
  });

  test("Should be valid (two block)", () => {
    const blockchain = new Blockchain(alice.publicKey);
    const newBlock = new Block({
      index: 1,
      previousHash: blockchain.blocks[0].hash,
      transactions: [
        new Transaction({
          txInputs: [new TransactionInput()],
        } as Transaction),
      ],
    } as Block);
    blockchain.addBlock(newBlock);
    expect(blockchain.isValid().success).toEqual(true);
  });

  test("Should NOT be valid", () => {
    const blockchain = new Blockchain(alice.publicKey);

    const tx = new Transaction({
      txInputs: [new TransactionInput()],
    } as Transaction);

    blockchain.mempool.push(tx);

    const newBlock = new Block({
      index: 1,
      previousHash: blockchain.blocks[0].hash,
      transactions: [
        new Transaction({
          txInputs: [new TransactionInput()],
        } as Transaction),
      ],
    } as Block);
    blockchain.addBlock(newBlock);
    blockchain.blocks[1].index = -1;
    expect(blockchain.isValid().success).toEqual(false);
  });

  test("Should add transaction", () => {
    const blockchain = new Blockchain(alice.publicKey);
    const txo = blockchain.blocks[0].transactions[0];

    const tx = new Transaction();
    tx.hash = "tx";
    tx.txInputs = [
      new TransactionInput({
        amount: 10,
        previousTx: txo.hash,
        fromAddress: alice.publicKey,
        signature: "abc",
      } as TransactionInput),
    ];

    tx.txOutputs = [
      new TransactionOutput({
        amount: 10,
        toAddress: "abc",
      } as TransactionOutput),
    ];

    const validation = blockchain.addTransaction(tx);
    expect(validation.success).toEqual(true);
  });

  test("Should NOT add transaction (pending tx)", () => {
    const blockchain = new Blockchain(alice.publicKey);

    const tx = new Transaction();
    tx.hash = "tx";
    tx.txInputs = [
      new TransactionInput({
        amount: 10,
        previousTx: "xyz",
        fromAddress: alice.publicKey,
        signature: "abc",
      } as TransactionInput),
    ];

    tx.txOutputs = [
      new TransactionOutput({
        amount: 10,
        toAddress: "abc",
      } as TransactionOutput),
    ];

    blockchain.mempool.push(tx);

    const validation = blockchain.addTransaction(tx);
    expect(validation.success).toBeFalsy();
  });

  test("Should NOT add transaction (invalid tx)", () => {
    const blockchain = new Blockchain(alice.publicKey);
    const txo = blockchain.blocks[0].transactions[0];

    const tx = new Transaction();
    tx.hash = "tx";
    tx.timestamp = -1;
    tx.txInputs = [
      new TransactionInput({
        amount: 10,
        previousTx: txo.hash,
        fromAddress: alice.publicKey,
        signature: "abc",
      } as TransactionInput),
    ];

    tx.txOutputs = [
      new TransactionOutput({
        amount: 10,
        toAddress: "abc",
      } as TransactionOutput),
    ];

    const validation = blockchain.addTransaction(tx);
    expect(validation.success).toEqual(false);
  });

  test("Should get transaction (blockchain)", () => {
    const blockchain = new Blockchain(alice.publicKey);

    const tx = new Transaction({
      txInputs: [new TransactionInput()],
      hash: "xyz",
    } as Transaction);

    blockchain.blocks.push(
      new Block({
        transactions: [tx],
      } as Block)
    );

    const result = blockchain.getTransaction("xyz");
    expect(result.blockIndex).toEqual(1);
  });

  test("Should NOT get transaction (blockchain)", () => {
    const blockchain = new Blockchain(alice.publicKey);

    const result = blockchain.getTransaction("xyz");
    expect(result.blockIndex).toEqual(-1);
    expect(result.mempoolIndex).toEqual(-1);
  });

  test("Should NOT add block (invalid index)", () => {
    const blockchain = new Blockchain(alice.publicKey);
    blockchain.mempool.push(new Transaction());
    const newBlock = new Block({
      index: -1,
      previousHash: blockchain.blocks[0].hash,
    } as Block);

    newBlock.transactions.push(
      new Transaction({
        type: TransactionType.FEE,
        txOutputs: [
          new TransactionOutput({
            toAddress: alice.publicKey,
            amount: 1,
          } as TransactionOutput),
        ],
      } as Transaction)
    );

    newBlock.hash = newBlock.getHash();

    const result = blockchain.addBlock(newBlock);
    expect(result.success).toEqual(false);
  });

  test("Should get next block info", () => {
    const blockchain = new Blockchain(alice.publicKey);
    blockchain.mempool.push(new Transaction());
    const info = blockchain.getNextBlock();

    expect(info ? info.index : 0).toEqual(1);
  });

  test("Should NOT get next block info", () => {
    const blockchain = new Blockchain(alice.publicKey);
    const info = blockchain.getNextBlock();

    expect(info).toBeNull();
  });

  test("Should be balance", () => {
    const blockchain = new Blockchain(alice.publicKey);
    const balance = blockchain.getBalance(alice.publicKey);

    expect(balance).toBeGreaterThan(0);
  });

  test("Should get zero balance", () => {
    const blockchain = new Blockchain(alice.publicKey);
    const balance = blockchain.getBalance(bob.publicKey);

    expect(balance).toEqual(0);
  });

  test("Should NOT add transaction (duplicated in blockchain)", () => {
    const blockchain = new Blockchain(alice.publicKey);
    const tx = blockchain.blocks[0].transactions[0];
    const validation = blockchain.addTransaction(tx);
    expect(validation.success).toEqual(false);
  });

  test("Should NOT add transaction (invalid UTXO)", () => {
    const blockchain = new Blockchain(alice.publicKey);

    const tx = new Transaction();
    tx.hash = "tx";
    tx.txInputs = [
      new TransactionInput({
        amount: 10,
        previousTx: "wrong",
        fromAddress: alice.publicKey,
        signature: "abc",
      } as TransactionInput),
    ];

    tx.txOutputs = [
      new TransactionOutput({
        amount: 10,
        toAddress: "abc",
      } as TransactionOutput),
    ];

    const validation = blockchain.addTransaction(tx);
    expect(validation.success).toBeFalsy();
  });
});
