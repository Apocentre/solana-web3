import Record from '@ppoliani/im-record'
import * as anchor from '@coral-xyz/anchor'
import Program from './program.js'
import * as utils from './utils.js'
import * as token from './token.js'
import * as metaplex from './metaplex.js'
import * as account from './account.js'
export {default as Wallet} from './wallet.js'
export {ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID} from '@solana/spl-token'

const DEFAULT_CACHE = {
  get() {/*  noop */},
  set() {/*  noop */},
}

const init = async (self, connection, wallet, cache=DEFAULT_CACHE) => {
  self.connection = connection
  self.wallet = wallet
  // If no wallet is connected, set the provider as an object containing the connection
  // so we are able to make read only blockchain calls (including contracts)
  self.anchorProvider = wallet
    ? new anchor.AnchorProvider(connection, wallet, {
      preflightCommitment: 'confirmed',
    })
    : {connection}

  self.cache = cache;
}

const createProgram = async (self, programId, idl) => {
  const program = Program()
  await program.init(self.anchorProvider, programId, idl)

  return program
}

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
})

export default Web3
