import * as anchor from '@project-serum/anchor'
import * as Bip39 from 'bip39'
import Record from '@ppoliani/im-record'

const {Keypair} = anchor.web3

const publicKey = async (self) => {
  return self.account.publicKey
}

const signTransaction = async (self, tx) => {
  return await self.innerWallet.signTransaction(tx)
}

const signAllTransactions = async (self, txs) => {
  return await self.innerWallet.signAllTransactions(txs)
}

const init = async (self) => {
  const mnemonic = Bip39.generateMnemonic()
  const seed = Bip39.mnemonicToSeed(mnemonic).slice(0, 32)
  const account = Keypair.fromSeed(seed)

  self.mnemonic = mnemonic
  self.account = account
  self.innerWallet = new anchor.NodeWallet(account)
}

const Wallet = Record({
  account: null,
  mnemonic: null,
  
  init,
  // Wallet interface
  publicKey,
  signTransaction,
  signAllTransactions,
})

export default Wallet
