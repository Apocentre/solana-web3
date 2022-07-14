import * as anchor from '@project-serum/anchor'

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

  return await anchor.web3.SystemProgram.createAccount({
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
