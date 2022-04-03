import Record from '@ppoliani/im-record'
import * as anchor from '@project-serum/anchor'
import Program from './program'
// TODO: we can also use LocalStorage if needed
import {MemoryStorage} from 'ttl-localstorage'
import * as utils from './utils'
import * as token from './token'
import * as metaplex from './metaplex'
import * as account from './account'

const init = async (self, connection, wallet, ttl=300) => {
  self.connection = connection
  self.anchorProvider = new anchor.Provider(connection, wallet, {
    preflightCommitment: 'recent',
  })

  MemoryStorage.timeoutInSeconds = ttl
  self.cache = MemoryStorage
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
  
  // methods
  init,
  createProgram,
  getAccountInfo: account.getAccountInfo,
  ...token,
  ...metaplex,
  ...utils
})

export default Web3
