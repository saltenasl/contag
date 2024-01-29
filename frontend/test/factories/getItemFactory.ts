import { TypeName } from '@contag/graphql-api/src/constants'
import infoFactory from 'test/factories/info'
import messageFactory from 'test/factories/message'
import questionFactory from 'test/factories/question'
import taskFactory from 'test/factories/task'
import goalFactory from './goal'
import getItem from './utils/getItem'

const getItemFactory = (id: string) => {
  const factories = {
    [TypeName.MESSAGE]: messageFactory,
    [TypeName.INFO]: infoFactory,
    [TypeName.QUESTION]: questionFactory,
    [TypeName.TASK]: taskFactory,
    [TypeName.GOAL]: goalFactory,
  }

  const item = getItem(id)

  if (!item.__typename) {
    throw new Error('Cannot continue with item that has no __typename')
  }

  return factories[item.__typename]
}

export default getItemFactory
