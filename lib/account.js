import * as anchor from '@coral-xyz/anchor'

const {SystemProgram, Transaction} = anchor.web3

export const getMinimumBalanceForRentExemption = async (self, space) => {
  return await self.connection.getMinimumBalanceForRentExemption(space)
} 

export const createAccount = async (
  self, 
  payer,
  newAccountPubkey,
  programId = SystemProgram.programId,
  space = 0,
) => {
  const lamports = await self.getMinimumBalanceForRentExemption(space)

  return await SystemProgram.createAccount({
    fromPubkey: payer,
    lamports,
    newAccountPubkey,
    programId,
    space
  })
}

export const getAccountInfo = async (self, account) => {
  return await self.connection.getAccountInfo(account)
}

export const getBalance = async (self, account) => {
  return await self.connection.getBalance(account)
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
