export const getAccountInfo = async (self, account) => {
  return await self.connection.getAccountInfo(account)
}
