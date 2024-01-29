import { ItemType } from 'src/generated/graphql'
import createItem from '../drivers/item/create'
import getItem, { queryItem } from '../drivers/item/get'
import sendMessage from '../drivers/message/send'
import createUser from '../drivers/user/create'

describe('get single item', () => {
  it.each([
    ItemType.Info,
    ItemType.Message,
    ItemType.Question,
    ItemType.Task,
    ItemType.Goal,
  ])('retrieves a %s', async (type) => {
    const author = await createUser()
    const item = await createItem(type, { author })

    expect(await getItem({ id: item.id, loggedInAs: author })).toStrictEqual({
      ...item,
      blocks: [],
      blockedBy: [],
    })
  })

  describe('errors', () => {
    it('not found when non-existent id is passed', async () => {
      const response = await queryItem({
        loggedInAs: await createUser(),
        id: 'Item:-1',
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          item: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['item'],
          }),
        ],
      })
    })

    it('not found when user is not in items sharedWith', async () => {
      const author = await createUser()
      const message = await sendMessage({ author, shareWith: [] })

      const anotherUser = await createUser()

      const response = await queryItem({
        loggedInAs: anotherUser,
        id: message.id,
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: {
          item: null,
        },
        errors: [
          expect.objectContaining({
            message: 'Item not found',
            path: ['item'],
          }),
        ],
      })
    })
  })
})
