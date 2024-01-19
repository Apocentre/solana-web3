import * as anchor from '@coral-xyz/anchor'
import pkg from '@metaplex-foundation/mpl-token-metadata'

const {Metadata} = pkg;
const {PublicKey} = anchor.web3
const utf8 = anchor.utils.bytes.utf8

export const isMetaplexNFT = (_, data, mintInfo) => {
  return (
    data?.program === 'spl-token' &&
    data?.parsed.type === 'mint' &&
    data?.nftData &&
    mintInfo?.decimals === 0 &&
    parseInt(mintInfo.supply) === 1
  );
}

export const fetchRawMetadataAccount = async (self, tokenAccount) => {
  const metadata = await Metadata.getPDA(tokenAccount.account.data.parsed.info.mint)
  const accountInfo = await self.connection.getAccountInfo(metadata)

  return accountInfo?.data
}

export const fetchMetadataAccount = async (self, mint) => await Metadata.findByMint(self.connection, mint)

export const fetchNftsByOwner = async (self, account, page=1, size=10) => {
  const tokenAccounts = await self.fetchTokenAccountByOwner(account, page, size)
  const accountsWithAmount = tokenAccounts.filter(({amount}) => amount > 0)

  return (
    await Promise.all(
      accountsWithAmount.map(({mint}) => Metadata.findMany(self.connection, {mint})),
    )
  ).flat()
}

const METADATA_PROGRAM = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

export const getMetadata = async (self, mint) => await PublicKey.findProgramAddress(
  [utf8.encode('metadata'), METADATA_PROGRAM.toBuffer(), mint.toBuffer()],
  METADATA_PROGRAM
)

export const getMasterEdition = async (self, mint) => await PublicKey.findProgramAddress(
  [utf8.encode('metadata'), METADATA_PROGRAM.toBuffer(), mint.toBuffer(), utf8.encode('edition')],
  METADATA_PROGRAM
)
