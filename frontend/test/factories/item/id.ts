import { each, Sync } from 'factory.ts'

const itemIdFactory = Sync.makeFactory({
  id: each((i) => `Item:${i}`),
})

export default itemIdFactory
