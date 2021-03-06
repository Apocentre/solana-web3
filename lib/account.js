import * as anchor from '@project-serum/anchor'

const {SystemProgram, Transaction} = anchor.web3

export const getMinimumBalanceForExcemption = async (self, space) => {
  return await self.connection.getMinimumBalanceForExcemption(space)
} 

export const createAccount = async (
  self, 
  payer,
  newAccountPubkey,
  owner,
  space,
) => {
  const lamports = await self.getMinimumBalanceForExcemption(space)

  return await SystemProgram.createAccount({
    fromPubkey: payer,
    lamports,
    newAccountPubkey,
    programId: owner,
    space
  })
}

export const getAccountInfo = async (self, account) => {
  return await self.connection.getAccountInfo(account)
}

export const transferSOL = async (self, toPubkey, lamports) => {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: self.anchorProvider.wallet.publicKey,
      toPubkey,
      lamports,
    }),
  )

  return await self.anchorProvider.sendAndConfirm(tx)
}
