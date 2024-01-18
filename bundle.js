'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Record = require('@ppoliani/im-record');
var anchor = require('@coral-xyz/anchor');
var numberToBN = require('number-to-bn');
var spl = require('@solana/spl-token');
var pkg = require('@metaplex-foundation/mpl-token-metadata');
var Bip39 = require('bip39');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var anchor__namespace = /*#__PURE__*/_interopNamespaceDefault(anchor);
var spl__namespace = /*#__PURE__*/_interopNamespaceDefault(spl);
var Bip39__namespace = /*#__PURE__*/_interopNamespaceDefault(Bip39);

const init$2 = async (self, provider, programId, idl) => {
  self.provider = provider;
  self.program = new anchor__namespace.Program(idl, programId, provider);
  self.programId = self.program.programId;
  self.instruction = self.program.instruction;
  self.rpc = self.program.rpc;
  self.account = self.program.account;
  self.methods = self.program.methods;
};

const Program = Record({
  program: null,
  programId: null,
  provider: null,
  instruction: null,
  rpc: null,
  account: null,

  init: init$2
});

const {ComputeBudgetProgram} = anchor__namespace.web3;

const BN = (_, amount) => new anchor__namespace.default.BN(amount);

const fromBase = (self, input, baseDecimals=9, optionsInput) => {
  const base = self.BN('10').pow(self.BN(baseDecimals.toString()));
  let baseValue = numberToBN(input);
  const negative = baseValue.lt(self.BN('0'));
  const baseLength = base.toString().length - 1 || 1;
  const options = optionsInput || {};

  if(negative) {
    baseValue = baseValue.mul(self.BN('-1'));
  }

  let fraction = baseValue.mod(base).toString(10);

  while(fraction.length < baseLength) {
    fraction = `0${fraction}`;
  }

  if(!options.pad) {
    fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];
  }

  let whole = baseValue.div(base).toString(10);

  if(options.commify) {
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  let value = `${whole}${fraction == '0' ? '' : `.${fraction}`}`;

  if(negative) {
    value = `-${value}`;
  }

  return value;
};

const toBase = (self, value, baseDecimals=9) => {
  const base = self.BN('10').pow(self.BN(baseDecimals.toString()));
  const negative = (value.substring(0, 1) === '-');
  if(negative) {
    value = value.substring(1);
  }

  const comps = value.split('.');
  if(comps.length > 2) {
    throw new Error(`[web3/utils] while converting number ${value} to base,  too many decimal points`)
  }

  let whole = comps[0];
  let fraction = comps[1];

  if(!whole) {
    whole = '0';
  }
  if(!fraction) {
    fraction = '0';
  }
  else {
    fraction = fraction.slice(0, Number(baseDecimals));
  }
  if(fraction.length > Number(baseDecimals)) {
    throw new Error(`[web3/utils] while converting number ${value} to base, too many decimal places`)
  }

  while(fraction.length < Number(baseDecimals)) {
    fraction += '0';
  }

  whole = self.BN(whole);
  fraction = self.BN(fraction);
  let wei = (whole.mul(self.BN(base.toString()))).add(fraction);

  if(negative) {
    wei = wei.mul(self.BN('-1'));
  }

  return self.BN(wei.toString(10), 10).toString()
};

const getComputationBudgetIx = (_, units) => {
  return ComputeBudgetProgram.setComputeUnitLimit({
    units,
  })
};

const taExists = ta => ta.value.length > 0;

const createATAIxIfNeeded = async (self, user, mint) => {
  let ix;
  const ata = await self.getAssociatedTokenAddress(mint, user, true);
  const tokenAccount = await self.getTokenAccountByMintAndOwner(user, mint);

  if(!taExists(tokenAccount)) {
    ix = await self.createATAIx(
      user,
      ata,
      user,
      mint
    );
  }

  return [
    ix,
    ata
  ]
};

var utils = /*#__PURE__*/Object.freeze({
  __proto__: null,
  BN: BN,
  createATAIxIfNeeded: createATAIxIfNeeded,
  fromBase: fromBase,
  getComputationBudgetIx: getComputationBudgetIx,
  taExists: taExists,
  toBase: toBase
});

const {PublicKey: PublicKey$1, SystemProgram: SystemProgram$1} = anchor__namespace.web3;

const createMintAccount = async (
  self,
  feePayer,
  mintAuthority,
  decimals=9,
  freezeAuthority=null,
) => await spl__namespace.createMint(
  self.connection,
  feePayer,
  mintAuthority,
  freezeAuthority,
  decimals,
);

const getMint = async (self, mint) => await spl__namespace.getMint(self.connection, mint);

const createATAIx = async (
  _,
  feePayer,
  associatedToken,
  owner,
  mint,
) => await spl__namespace.createAssociatedTokenAccountInstruction(
  feePayer,
  associatedToken,
  owner,
  mint,
);

const mintTo = async (
  self,
  feePayer,
  mint,
  dest,
  authority,
  amount,
  multiSigners=[]
) => await spl__namespace.mintTo(
  self.connection,
  feePayer,
  mint,
  dest,
  authority,
  amount,
  multiSigners,
);

const transfer = async (
  self,
  feePayer,
  sourceTokenAccount,
  dest,
  sourceTokenAccountOwner,
  amount,
  multiSigners=[]
) => await spl__namespace.transfer(
  self.connection,
  feePayer,
  sourceTokenAccount,
  dest,
  sourceTokenAccountOwner,
  amount,
  multiSigners,
);

const approve = async (
  _,
  sourceTokenAccount,
  delegate,
  sourceTokenAccountOwner,
  amount,
  multiSigners=[]
) => await spl__namespace.createApproveInstruction(
  sourceTokenAccount,
  delegate,
  sourceTokenAccountOwner,
  amount,
  multiSigners,
);

const createNft = async (
  self,
  feePayer,
  authority,
  disableMinting=true
) => {
  // 1. create a new Mint account with 0 decimals
  const token = await createMintAccount(
    self.connection,
    feePayer,
    authority.publicKey,
    0
  );

  // 2. create a new associated token account
  const tokenAccount = await createAssociatedTokenAccount(
    self.connection,
    feePayer,
    token,
    authority.publicKey,
  );

  // 3. mint 1 token into the recipient associated token account
  await mintTo(
    self.connection,
    feePayer,
    token,
    tokenAccount.address,
    authority,
    1,
  );

  if(disableMinting) {
    // 4. disable future minting by setting the mint authority to none
    await spl__namespace.setAuthority(
      self.connection,
      feePayer,
      token,
      authority,
      spl__namespace.AuthorityType.MintTokens,
      null
    );
  }

  return token
};

const getTokenAccount = async (self, tokenAccount) => await spl__namespace.getAccount(self.connection, tokenAccount);

const getAssociatedTokenAddress = async (_, token, owner, allowOwnerOffCurve=true) => {
  return await spl__namespace.getAssociatedTokenAddress(token, owner, allowOwnerOffCurve)
};

const getTokenProgramId = () => spl__namespace.TOKEN_PROGRAM_ID;

// will ignore the data field of each account
const fetchPartialTokenAccountByOwner = async (self, owner) => {
  const key = `partialTokenAccount-${owner.toBase58()}`;
  const item = self.cache.get(key);

  if(item) {
    return item
  }

  const tokenAccounts = (await self.connection
    .getProgramAccounts(
      spl__namespace.TOKEN_PROGRAM_ID,
      {
        dataSlice: {
          offset: 0,
          length: 32,
        },
        filters: [
          {
            dataSize: spl__namespace.ACCOUNT_SIZE,
          },
          {
            memcmp: {
              offset: 32,
              bytes: owner.toBase58(),
            },
          },
        ],
      }
    ))
    .map(a => ({
      pubkey: a.pubkey,
      mint: new PublicKey$1(a.account.data) 
    }));

  self.cache.put(key, tokenAccounts);

  return tokenAccounts
};

const fetchMintTokensByOwner = async (
  self,
  account,
  page=1,
  size=10
) => {
  const tokenAccounts = await self.fetchPartialTokenAccountByOwner(account);

  // Always pagination to protect from too large requests that may be rejected by Solana.
  const start = (page - 1) * size;
  const end = start + size;
  const slice = tokenAccounts.slice(start, end);

  // Load the token ccounts for the current page
  return (
    await Promise.all(
      slice.map(({pubkey}) => self.getTokenAccount(pubkey))
    )
  ).flat()
};

const getTokenAccountByMintAndOwner = async (self, owner, mint) => {
  const data = await self.connection.getTokenAccountsByOwner(owner, {mint});
  data.value = data.value.map(ta => {
    return {
      ...ta,
      account: {
        ...ta.account,
        data: self.decodeTokenAccountData(ta.account.data)
      }
    }
  });

  return data
};

const DEFAULT_BALANCE = {
  value: {
    amount: '0',
    decimals: 9,
    uiAmount: 0,
    uiAmountString: '0'
  }
};

const getTokenAccountBalance = async (self, ta) => {
  try {
    return await self.connection.getTokenAccountBalance(ta)
  }
  catch {
    return DEFAULT_BALANCE
  }
};

const getTokensBalance = async (self, owner, mints) => {
  const tokenAccounts = await Promise.all(mints.map(mint => self.getTokenAccountByMintAndOwner(owner, mint)));
  
  const balances = await Promise.all(tokenAccounts.map(async t => {
    return t.value[0] 
      ? (await self.getTokenAccountBalance(t.value[0].pubkey)).value
      : DEFAULT_BALANCE
  }));

  return mints.reduce((acc, mint, i) => ({...acc, [mint.toBase58()]: balances[i]}), {})
};

const decodeTokenAccountData = (_, data) => spl__namespace.AccountLayout.decode(data);

const wrapSolIXs = async (self, wallet, lamports, nativeMint = spl__namespace.NATIVE_MINT) => {
  const ixs = [];
  const wrappedAta = await self.getAssociatedTokenAddress(nativeMint, wallet, true);

  // 1. Create a Transfer SOL to the above account IX
  ixs.push(SystemProgram$1.transfer({
    fromPubkey: wallet,
    toPubkey: wrappedAta,
    lamports,
  }));

  // 2. Native Sync ix
  ixs.push(
    spl__namespace.createSyncNativeInstruction(wrappedAta)
  );
  
  return ixs
};

var token = /*#__PURE__*/Object.freeze({
  __proto__: null,
  approve: approve,
  createATAIx: createATAIx,
  createMintAccount: createMintAccount,
  createNft: createNft,
  decodeTokenAccountData: decodeTokenAccountData,
  fetchMintTokensByOwner: fetchMintTokensByOwner,
  fetchPartialTokenAccountByOwner: fetchPartialTokenAccountByOwner,
  getAssociatedTokenAddress: getAssociatedTokenAddress,
  getMint: getMint,
  getTokenAccount: getTokenAccount,
  getTokenAccountBalance: getTokenAccountBalance,
  getTokenAccountByMintAndOwner: getTokenAccountByMintAndOwner,
  getTokenProgramId: getTokenProgramId,
  getTokensBalance: getTokensBalance,
  mintTo: mintTo,
  transfer: transfer,
  wrapSolIXs: wrapSolIXs
});

const {Metadata} = pkg;
const {PublicKey} = anchor__namespace.web3;
const utf8 = anchor__namespace.utils.bytes.utf8;

const isMetaplexNFT = (_, data, mintInfo) => {
  return (
    data?.program === 'spl-token' &&
    data?.parsed.type === 'mint' &&
    data?.nftData &&
    mintInfo?.decimals === 0 &&
    parseInt(mintInfo.supply) === 1
  );
};

const fetchRawMetadataAccount = async (self, tokenAccount) => {
  const metadata = await Metadata.getPDA(tokenAccount.account.data.parsed.info.mint);
  const accountInfo = await self.connection.getAccountInfo(metadata);

  return accountInfo?.data
};

const fetchMetadataAccount = async (self, mint) => await Metadata.findByMint(self.connection, mint);

const fetchNftsByOwner = async (self, account, page=1, size=10) => {
  const tokenAccounts = await self.fetchMintTokensByOwner(account, page, size);
  const accountsWithAmount = tokenAccounts.filter(({amount}) => amount > 0);

  return (
    await Promise.all(
      accountsWithAmount.map(({mint}) => Metadata.findMany(self.connection, {mint})),
    )
  ).flat()
};

const METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

const getMetadata = async (self, mint) => await PublicKey.findProgramAddress(
  [utf8.encode('metadata'), METADATA_PROGRAM.toBuffer(), mint.toBuffer()],
  METADATA_PROGRAM
);

const getMasterEdition = async (self, mint) => await PublicKey.findProgramAddress(
  [utf8.encode('metadata'), METADATA_PROGRAM.toBuffer(), mint.toBuffer(), utf8.encode('edition')],
  METADATA_PROGRAM
);

var metaplex = /*#__PURE__*/Object.freeze({
  __proto__: null,
  fetchMetadataAccount: fetchMetadataAccount,
  fetchNftsByOwner: fetchNftsByOwner,
  fetchRawMetadataAccount: fetchRawMetadataAccount,
  getMasterEdition: getMasterEdition,
  getMetadata: getMetadata,
  isMetaplexNFT: isMetaplexNFT
});

const {SystemProgram, Transaction} = anchor__namespace.web3;

const getMinimumBalanceForRentExemption = async (self, space) => {
  return await self.connection.getMinimumBalanceForRentExemption(space)
}; 

const createAccount = async (
  self, 
  payer,
  newAccountPubkey,
  programId = SystemProgram.programId,
  space = 0,
) => {
  const lamports = await self.getMinimumBalanceForRentExemption(space);

  return await SystemProgram.createAccount({
    fromPubkey: payer,
    lamports,
    newAccountPubkey,
    programId,
    space
  })
};

const getAccountInfo = async (self, account) => {
  return await self.connection.getAccountInfo(account)
};

const getBalance = async (self, account) => {
  return await self.connection.getBalance(account)
};

const transferSOLIx = (self, toPubkey, lamports) => {
  return SystemProgram.transfer({
    fromPubkey: self.anchorProvider.wallet.publicKey,
    toPubkey,
    lamports,
  })
};

const transferSOL = async (self, toPubkey, lamports) => {
  const tx = new Transaction().add(self.transferSOLIx(toPubkey, lamports));
  return await self.anchorProvider.sendAndConfirm(tx)
};

var account = /*#__PURE__*/Object.freeze({
  __proto__: null,
  createAccount: createAccount,
  getAccountInfo: getAccountInfo,
  getBalance: getBalance,
  getMinimumBalanceForRentExemption: getMinimumBalanceForRentExemption,
  transferSOL: transferSOL,
  transferSOLIx: transferSOLIx
});

const {Keypair} = anchor__namespace.web3;

const signTransaction = async (self, tx) => {
  tx.partialSign(self.account);
  return tx
};

const signAllTransactions = async (self, txs) => {
  return txs.map((t) => {
    t.partialSign(self.account);
    return t
  })
};

const init$1 = async (self, mnemonic=Bip39__namespace.generateMnemonic()) => {
  const seed = (await Bip39__namespace.mnemonicToSeed(mnemonic)).slice(0, 32);
  const account = Keypair.fromSeed(seed);

  self.mnemonic = mnemonic;
  self.account = account;
  self.publicKey = self.account.publicKey;
};

const Wallet = Record({
  account: null,
  mnemonic: null,
  
  init: init$1,
  // Wallet interface
  signTransaction,
  signAllTransactions,
});

const init = async (self, connection, wallet, cache) => {
  self.connection = connection;
  self.wallet = wallet;
  // If no wallet is connected, set the provider as an object containing the connection
  // so we are able to make read only blockchain calls (including contracts)
  self.anchorProvider = wallet
    ? new anchor__namespace.AnchorProvider(connection, wallet, {
      preflightCommitment: 'confirmed',
    })
    : {connection};

  self.cache = cache;
};

const createProgram = async (self, programId, idl) => {
  const program = Program();
  await program.init(self.anchorProvider, programId, idl);

  return program
};

const Web3 = Record({
  connection: null,
  anchorProvider: null,
  cache: null,
  wallet: null,
  
  // methods
  init,
  createProgram,

  ...account,
  ...token,
  ...metaplex,
  ...utils
});

Object.defineProperty(exports, "ASSOCIATED_TOKEN_PROGRAM_ID", {
  enumerable: true,
  get: function () { return spl.ASSOCIATED_TOKEN_PROGRAM_ID; }
});
Object.defineProperty(exports, "TOKEN_2022_PROGRAM_ID", {
  enumerable: true,
  get: function () { return spl.TOKEN_2022_PROGRAM_ID; }
});
Object.defineProperty(exports, "TOKEN_PROGRAM_ID", {
  enumerable: true,
  get: function () { return spl.TOKEN_PROGRAM_ID; }
});
exports.Wallet = Wallet;
exports.default = Web3;
