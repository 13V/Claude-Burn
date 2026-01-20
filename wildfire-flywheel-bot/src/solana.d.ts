import { Connection, Keypair } from '@solana/web3.js';
export declare const connection: Connection;
export declare const wallet: Keypair;
export declare function getBalance(pubkey: string): Promise<number>;
export declare function getSolBalance(): Promise<number>;
//# sourceMappingURL=solana.d.ts.map