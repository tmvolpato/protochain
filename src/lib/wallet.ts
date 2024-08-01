import * as ecc from "tiny-secp256k1";
import ECPairFactory, { ECPairInterface } from "ecpair";

const ECPAIR = ECPairFactory(ecc);

export default class Wallet {
  privateKey: string;
  publicKey: string;

  constructor(wifOrPrivateKey?: string) {
    let keys;

    if (wifOrPrivateKey) {
      if (wifOrPrivateKey.length === 64)
        keys = ECPAIR.fromPrivateKey(Buffer.from(wifOrPrivateKey, "hex"));
      else keys = ECPAIR.fromWIF(wifOrPrivateKey);
    } else keys = ECPAIR.makeRandom();

    /* c8 ignore next */
    this.privateKey = keys.privateKey?.toString("hex") || "";
    this.publicKey = keys.publicKey.toString("hex") || "";
  }
}
