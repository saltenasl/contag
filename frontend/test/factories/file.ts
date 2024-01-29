import { faker } from '@faker-js/faker'
import { each, Factory, Sync } from 'factory.ts'
import { File } from 'src/generated/graphql'

const baseFileFactory = Sync.makeFactory<File>(() => ({
  __typename: 'File',
  id: each((i) => `File:${i}`),
  contentType: 'image/jpeg',
  filename: faker.datatype.uuid(),
  originalName: each((i) => `${i}${faker.lorem.word()}`),
  size: 420,
}))

const files: Partial<Record<string, File>> = {}

const wrapFactory = (
  factory: Factory<File>
): {
  build: (typeof baseFileFactory)['build']
  buildList: (typeof baseFileFactory)['buildList']
} => ({
  build(item) {
    if (item?.id) {
      const fileInCache = files[item.id]

      if (fileInCache) {
        // update the cache entry
        const updatedFile = factory.build({
          ...fileInCache,
          ...item,
        })
        files[item.id] = updatedFile

        return updatedFile
      }
    }

    const file = factory.build(item)

    files[file.id] = file

    return file
  },
  buildList(count, item) {
    return Array.from({ length: count }).map(() => this.build(item))
  },
})

const fileFactory = wrapFactory(baseFileFactory)

export const getFile = (id: string) => {
  const file = files[id]
  if (file) {
    return file
  }

  throw new Error(`file with id "${id}" not found in file store!`)
}
export default fileFactory
