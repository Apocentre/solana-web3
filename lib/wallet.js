import * as anchor from '@project-serum/anchor'
import * as Bip39 from 'bip39'
import Record from '@ppoliani/im-record'

const {Keypair} = anchor.web3

const signTransaction = async (self, tx) => {
  tx.partialSign(self.account)
  return tx
}

const signAllTransactions = async (self, txs) => {
  return txs.map((t) => {
    t.partialSign(self.account)
    return t
  })
}

const init = async (self, mnemonic=Bip39.generateMnemonic()) => {
  const seed = (await Bip39.mnemonicToSeed(mnemonic)).slice(0, 32)
  const account = Keypair.fromSeed(seed)

  self.mnemonic = mnemonic
  self.account = account
  self.publicKey = self.account.publicKey
}

const Wallet = Record({
  account: null,
  mnemonic: null,
  
  init,
  // Wallet interface
  signTransaction,
  signAllTransactions,
})

export default Wallet
