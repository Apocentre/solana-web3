import * as anchor from '@coral-xyz/anchor'
import Record from '@ppoliani/im-record'

const init = async (self, provider, programId, idl) => {
  self.provider = provider
  self.program = new anchor.Program(idl, provider)
  self.programId = self.program.programId
  self.instruction = self.program.instruction
  self.rpc = self.program.rpc
  self.account = self.program.account
  self.methods = self.program.methods
}

const Program = Record({
  program: null,
  programId: null,
  provider: null,
  instruction: null,
  rpc: null,
  account: null,

  init
})

export default Program
