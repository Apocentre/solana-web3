import * as anchor from '@coral-xyz/anchor'
import * as spl from '@solana/spl-token'

const {PublicKey, SystemProgram} = anchor.web3

export const createMintAccount = async (
  self,
  feePayer,
  mintAuthority,
  decimals=9,
  freezeAuthority=null,
) => await spl.createMint(
  self.connection,
  feePayer,
  mintAuthority,
  freezeAuthority,
  decimals,
)

export const getMint = async (self, mint) => await spl.getMint(self.connection, mint)

export const createATAIx = async (
  _,
  feePayer,
  associatedToken,
  owner,
  mint,
) => await spl.createAssociatedTokenAccountInstruction(
  feePayer,
  associatedToken,
  owner,
  mint,
)

export const mintTo = async (
  self,
  feePayer,
  mint,
  dest,
  authority,
  amount,
  multiSigners=[]
) => await spl.mintTo(
  self.connection,
  feePayer,
  mint,
  dest,
  authority,
  amount,
  multiSigners,
)

export const transfer = async (
  self,
  feePayer,
  sourceTokenAccount,
  dest,
  sourceTokenAccountOwner,
  amount,
  multiSigners=[]
) => await spl.transfer(
  self.connection,
  feePayer,
  sourceTokenAccount,
  dest,
  sourceTokenAccountOwner,
  amount,
  multiSigners,
)

export const approve = async (
  _,
  sourceTokenAccount,
  delegate,
  sourceTokenAccountOwner,
  amount,
  multiSigners=[]
) => await spl.createApproveInstruction(
  sourceTokenAccount,
  delegate,
  sourceTokenAccountOwner,
  amount,
  multiSigners,
)

export const createNft = async (
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
  )

  // 2. create a new associated token account
  const tokenAccount = await createAssociatedTokenAccount(
    self.connection,
    feePayer,
    token,
    authority.publicKey,
  )

  // 3. mint 1 token into the recipient associated token account
  await mintTo(
    self.connection,
    feePayer,
    token,
    tokenAccount.address,
    authority,
    1,
  )

  if(disableMinting) {
    // 4. disable future minting by setting the mint authority to none
    await spl.setAuthority(
      self.connection,
      feePayer,
      token,
      authority,
      spl.AuthorityType.MintTokens,
      null
    )
  }

  return token
}

export const getTokenAccount = async (self, tokenAccount) => await spl.getAccount(self.connection, tokenAccount)

export const getAssociatedTokenAddress = async (_, token, owner, allowOwnerOffCurve=true) => {
  return await spl.getAssociatedTokenAddress(token, owner, allowOwnerOffCurve)
}

export const getTokenProgramId = () => spl.TOKEN_PROGRAM_ID

// will ignore the data field of each account
export const fetchPartialTokenAccountByOwner = async (self, owner) => {
  const key = `partialTokenAccount-${owner.toBase58()}`
  const item = self.cache.get(key)

  if(item) {
    return item
  }

  const tokenAccounts = (await self.connection
    .getProgramAccounts(
      spl.TOKEN_PROGRAM_ID,
      {
        dataSlice: {
          offset: 0,
          length: 32,
        },
        filters: [
          {
            dataSize: spl.ACCOUNT_SIZE,
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
      mint: new PublicKey(a.account.data) 
    }))

  self.cache.put(key, tokenAccounts)

  return tokenAccounts
}

export const fetchTokenAccountByOwner = async (
  self,
  account,
  page=1,
  size=10
) => {
  const tokenAccounts = await self.fetchPartialTokenAccountByOwner(account)

  // Always pagination to protect from too large requests that may be rejected by Solana.
  const start = (page - 1) * size
  const end = start + size
  const slice = tokenAccounts.slice(start, end)

  // Load the token accounts for the current page
  return (
    await Promise.all(
      slice.map(({pubkey}) => self.getTokenAccount(pubkey))
    )
  ).flat()
}

export const getTokenAccountByMintAndOwner = async (self, owner, mint) => {
  const data = await self.connection.getTokenAccountsByOwner(owner, {mint})
  data.value = data.value.map(ta => {
    return {
      ...ta,
      account: {
        ...ta.account,
        data: self.decodeTokenAccountData(ta.account.data)
      }
    }
  })

  return data
}

const DEFAULT_BALANCE = {
  value: {
    amount: '0',
    decimals: 9,
    uiAmount: 0,
    uiAmountString: '0'
  }
}

export const getTokenAccountBalance = async (self, ta) => {
  try {
    return await self.connection.getTokenAccountBalance(ta)
  }
  catch {
    return DEFAULT_BALANCE
  }
}

export const getTokensBalance = async (self, owner, mints) => {
  const tokenAccounts = await Promise.all(mints.map(mint => self.getTokenAccountByMintAndOwner(owner, mint)))
  
  const balances = await Promise.all(tokenAccounts.map(async t => {
    return t.value[0] 
      ? (await self.getTokenAccountBalance(t.value[0].pubkey)).value
      : DEFAULT_BALANCE
  }))

  return mints.reduce((acc, mint, i) => ({...acc, [mint.toBase58()]: balances[i]}), {})
}

export const decodeTokenAccountData = (_, data) => spl.AccountLayout.decode(data)

export const wrapSolIXs = async (self, wallet, lamports, nativeMint = spl.NATIVE_MINT) => {
  const ixs = []
  const wrappedAta = await self.getAssociatedTokenAddress(nativeMint, wallet, true)

  // 1. Create a Transfer SOL to the above account IX
  ixs.push(SystemProgram.transfer({
    fromPubkey: wallet,
    toPubkey: wrappedAta,
    lamports,
  }))

  // 2. Native Sync ix
  ixs.push(
    spl.createSyncNativeInstruction(wrappedAta)
  )
  
  return ixs
}
