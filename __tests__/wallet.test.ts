import { describe, test, expect, beforeAll, jest } from "@jest/globals";
import Wallet from "../src/lib/wallet";
import TransactionInput from "../src/lib/transactionInput";

describe("Wallet tests", () => {

    const WIF = "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ";
    let alice: Wallet;
    
    beforeAll(() => {
        alice = new Wallet();
    })

  test("Should generate wallet valid", () => {
    const wallet = new Wallet();
  
    expect(wallet.privateKey).toBeTruthy();
    expect(wallet.publicKey).toBeTruthy();
  });

  test("Should recover wallet (PK)", () => {
    const wallet = new Wallet(alice.privateKey);  
    
    expect(wallet.publicKey).toEqual(alice.publicKey);
  });

  test("Should recover wallet (WIF)", () => {
    const wallet = new Wallet(WIF);
    expect(wallet.privateKey).toBeTruthy();
    expect(wallet.publicKey).toBeTruthy();
  });
});