import { TypeName } from 'src/constants'
import type { User } from 'src/generated/graphql'
import { TaskStatus } from 'src/generated/graphql'
import { ItemsSortOrder, ItemsSortType } from 'src/generated/graphql'
import { ItemType } from 'src/generated/graphql'
import idFromPrismaToGraphQL from 'src/transformers/id/prismaToGraphQL'
import getItems, { queryItems } from '../drivers/items/get'
import createAllItemTypes from '../drivers/item/createAllTypes'
import sendMessage from '../drivers/message/send'
import amendTask from '../drivers/task/amend'
import createTask from '../drivers/task/create'
import createUser from '../drivers/user/create'
import createMultipleUsersAndAddToTheSameClient from '../drivers/user/createMultipleAndAddToClient'
import { faker } from '@faker-js/faker'
import summarizeItem from '../drivers/item/summarize'

describe('generic items tests', () => {
  describe('mixed types', () => {
    describe('sort', () => {
      // UserOrderedAsc and UserOrderedDesc tests are in item/nest.test.ts

      describe('createdAt', () => {
        describe('oldest first', () => {
          it('sorts correctly when message is created first', async () => {
            const { clientAdminUser: messageSenderUser, clientMemberUsers } =
              await createMultipleUsersAndAddToTheSameClient(2)
            const taskCreatorUser = clientMemberUsers[0] as User

            const message = await sendMessage({
              author: messageSenderUser,
              shareWith: [taskCreatorUser],
            })
            const task = await createTask({
              author: taskCreatorUser,
              shareWith: [messageSenderUser],
            })

            const items = await getItems({
              loggedInAs: messageSenderUser,
              sort: {
                type: ItemsSortType.CreatedAt,
                order: ItemsSortOrder.OldestFirst,
              },
              filters: {},
            })

            expect(items).toStrictEqual([
              expect.objectContaining(message),
              expect.objectContaining(task),
            ])
          })

          it('sorts correctly when task is created first', async () => {
            const { clientAdminUser: messageSenderUser, clientMemberUsers } =
              await createMultipleUsersAndAddToTheSameClient(2)
            const taskCreatorUser = clientMemberUsers[0] as User

            const task = await createTask({
              author: taskCreatorUser,
              shareWith: [messageSenderUser],
            })
            const message = await sendMessage({
              author: messageSenderUser,
              shareWith: [taskCreatorUser],
            })

            const items = await getItems({
              loggedInAs: messageSenderUser,
              sort: {
                type: ItemsSortType.CreatedAt,
                order: ItemsSortOrder.OldestFirst,
              },
              filters: {},
            })

            expect(items).toStrictEqual([
              expect.objectContaining(task),
              expect.objectContaining(message),
            ])
          })
        })

        describe('newest first', () => {
          it('sorts correctly when message is created first', async () => {
            const { clientAdminUser: messageSenderUser, clientMemberUsers } =
              await createMultipleUsersAndAddToTheSameClient(2)
            const taskCreatorUser = clientMemberUsers[0] as User

            const message = await sendMessage({
              author: messageSenderUser,
              shareWith: [taskCreatorUser],
            })
            const task = await createTask({
              author: taskCreatorUser,
              shareWith: [messageSenderUser],
            })

            const items = await getItems({
              loggedInAs: messageSenderUser,
              sort: {
                type: ItemsSortType.CreatedAt,
                order: ItemsSortOrder.NewestFirst,
              },
              filters: {},
            })

            expect(items).toStrictEqual([
              expect.objectContaining(task),
              expect.objectContaining(message),
            ])
          })

          it('sorts correctly when task is created first', async () => {
            const { clientAdminUser: messageSenderUser, clientMemberUsers } =
              await createMultipleUsersAndAddToTheSameClient(2)
            const taskCreatorUser = clientMemberUsers[0] as User

            const task = await createTask({
              author: taskCreatorUser,
              shareWith: [messageSenderUser],
            })
            const message = await sendMessage({
              author: messageSenderUser,
              shareWith: [taskCreatorUser],
            })

            const items = await getItems({
              loggedInAs: messageSenderUser,
              sort: {
                type: ItemsSortType.CreatedAt,
                order: ItemsSortOrder.NewestFirst,
              },
              filters: {},
            })

            expect(items).toStrictEqual([
              expect.objectContaining(message),
              expect.objectContaining(task),
            ])
          })
        })
      })

      describe('CompleteUntil', () => {
        it('sorts items action expectation complete until by newest first (items without action expectation or with complete until come last)', async () => {
          const author = await createUser()

          const now = Date.now()

          const taskWithActionExpectation = await createTask({
            author,
            shareWith: [],
            actionExpectation: { completeUntil: new Date(now + 1) },
          })
          const message = await sendMessage({ author, shareWith: [] })
          const task = await createTask({ author, shareWith: [] })

          const items = await getItems({
            loggedInAs: author,
            sort: {
              type: ItemsSortType.CompleteUntil,
              order: ItemsSortOrder.NewestFirst,
            },
            filters: {},
          })

          expect(items).toStrictEqual([
            taskWithActionExpectation,
            message,
            task,
          ])
        })

        it('sorts items action expectation complete until by oldest first (items without action expectation or with complete until come first)', async () => {
          const author = await createUser()

          const now = Date.now()

          const taskWithActionExpectation = await createTask({
            author,
            shareWith: [],
            actionExpectation: { completeUntil: new Date(now + 1) },
          })
          const message = await sendMessage({ author, shareWith: [] })
          const task = await createTask({ author, shareWith: [] })

          const items = await getItems({
            loggedInAs: author,
            sort: {
              type: ItemsSortType.CompleteUntil,
              order: ItemsSortOrder.OldestFirst,
            },
            filters: {},
          })

          expect(items).toStrictEqual([
            message,
            task,
            taskWithActionExpectation,
          ])
        })
      })
    })

    describe('parent is current user', () => {
      it('returns messages that are only shared with current user', async () => {
        const { clientAdminUser: author, clientMemberUsers } =
          await createMultipleUsersAndAddToTheSameClient(2)
        const anotherUser = clientMemberUsers[0] as User

        await sendMessage({ author, shareWith: [anotherUser] })
        const messageToSelf = await sendMessage({ author, shareWith: [author] })

        const items = await getItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.NewestFirst,
          },
          filters: { parentId: author.id },
        })

        expect(items).toStrictEqual([messageToSelf])
      })
    })

    it('nested items of mixed types', async () => {
      const { clientAdminUser: messageSenderUser, clientMemberUsers } =
        await createMultipleUsersAndAddToTheSameClient(2)
      const taskCreatorUser = clientMemberUsers[0] as User

      const parentMessage = await sendMessage({
        author: messageSenderUser,
        shareWith: [taskCreatorUser],
      })

      const message = await sendMessage({
        author: messageSenderUser,
        shareWith: [taskCreatorUser],
        parentId: parentMessage.id,
      })
      const task = await createTask({
        author: taskCreatorUser,
        shareWith: [messageSenderUser],
        parentId: parentMessage.id,
      })

      const items = await getItems({
        loggedInAs: messageSenderUser,
        sort: {
          type: ItemsSortType.CreatedAt,
          order: ItemsSortOrder.OldestFirst,
        },
        filters: {
          parentId: parentMessage.id,
        },
      })

      expect(items).toStrictEqual([
        expect.objectContaining(message),
        expect.objectContaining(task),
      ])
    })

    describe('type filters', () => {
      it(`filters by item type "${ItemType.Message}"`, async () => {
        const author = await createUser()
        const { message } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.NewestFirst,
          },
          filters: { itemType: { message: true } },
        })

        expect(items).toStrictEqual([message])
      })

      it(`filters by item type "${ItemType.Question}"`, async () => {
        const author = await createUser()
        const { question } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.NewestFirst,
          },
          filters: { itemType: { question: true } },
        })

        expect(items).toStrictEqual([question])
      })

      it(`filters by item type "${ItemType.Task}"`, async () => {
        const author = await createUser()
        const { task } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.NewestFirst,
          },
          filters: { itemType: { task: true } },
        })

        expect(items).toStrictEqual([task])
      })

      it(`filters by item type "${ItemType.Info}"`, async () => {
        const author = await createUser()
        const { info } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.NewestFirst,
          },
          filters: { itemType: { info: true } },
        })

        expect(items).toStrictEqual([info])
      })

      it(`filters by item type "${ItemType.Goal}"`, async () => {
        const author = await createUser()
        const { goal } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.NewestFirst,
          },
          filters: { itemType: { goal: true } },
        })

        expect(items).toStrictEqual([goal])
      })

      it('filters by multiple types', async () => {
        const author = await createUser()
        const { goal, info } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          sort: {
            type: ItemsSortType.CreatedAt,
            order: ItemsSortOrder.NewestFirst,
          },
          filters: { itemType: { goal: true, info: true } },
        })

        expect(items).toHaveLength(2)
        expect(items).toStrictEqual(expect.arrayContaining([goal, info]))
      })
    })

    describe('action expectation filter', () => {
      const createUserAndItems = async () => {
        const user = await createUser()

        const unfulfilledItem = await createTask({
          author: user,
          shareWith: [],
          actionExpectation: {},
        })

        const toBeFulfilledItem = await createTask({
          author: user,
          shareWith: [],
          actionExpectation: {},
        })
        const fulfilledItem = await amendTask({
          author: user,
          id: toBeFulfilledItem.id,
          status: TaskStatus.Done,
        })

        const itemWithoutActionExpectation = await sendMessage({
          author: user,
          shareWith: [],
        })

        return {
          user,
          unfulfilledItem,
          fulfilledItem,
          itemWithoutActionExpectation,
        }
      }

      it('filters by todo=true', async () => {
        const { user, unfulfilledItem } = await createUserAndItems()

        const items = await getItems({
          loggedInAs: user,
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
          filters: {
            actionExpectation: {
              todo: true,
            },
          },
        })

        expect(items).toStrictEqual([unfulfilledItem])
      })

      it('filters by done=true', async () => {
        const { user, fulfilledItem } = await createUserAndItems()

        const items = await getItems({
          loggedInAs: user,
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
          filters: {
            actionExpectation: {
              done: true,
            },
          },
        })

        expect(items).toStrictEqual([fulfilledItem])
      })

      it('filters by na=true', async () => {
        const { user, itemWithoutActionExpectation } =
          await createUserAndItems()

        const items = await getItems({
          loggedInAs: user,
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
          filters: {
            actionExpectation: {
              na: true,
            },
          },
        })

        expect(items).toStrictEqual([itemWithoutActionExpectation])
      })

      it('filters by multiple conditions', async () => {
        const { user, itemWithoutActionExpectation, fulfilledItem } =
          await createUserAndItems()

        const items = await getItems({
          loggedInAs: user,
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
          filters: {
            actionExpectation: {
              done: true,
              na: true,
            },
          },
        })

        expect(items).toHaveLength(2)
        expect(items).toStrictEqual(
          expect.arrayContaining([itemWithoutActionExpectation, fulfilledItem])
        )
      })
    })

    describe('search filter', () => {
      it('filters by messages text', async () => {
        const author = await createUser()
        const { message } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          filters: { search: message.text },
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
        })

        expect(items).toHaveLength(1)
        expect(items).toStrictEqual([message])
      })

      it('filters by tasks description', async () => {
        const author = await createUser()
        const { task } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          filters: { search: task.text },
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
        })

        expect(items).toHaveLength(1)
        expect(items).toStrictEqual([task])
      })

      it('filters by infos text', async () => {
        const author = await createUser()
        const { info } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          filters: { search: info.text },
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
        })

        expect(items).toHaveLength(1)
        expect(items).toStrictEqual([info])
      })

      it('filters by questions text', async () => {
        const author = await createUser()
        const { question } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          filters: { search: question.text },
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
        })

        expect(items).toHaveLength(1)
        expect(items).toStrictEqual([question])
      })

      it('filters by goals title', async () => {
        const author = await createUser()
        const { goal } = await createAllItemTypes({ author })

        const items = await getItems({
          loggedInAs: author,
          filters: { search: goal.text },
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
        })

        expect(items).toHaveLength(1)
        expect(items).toStrictEqual([goal])
      })

      it('filters by item id', async () => {
        const author = await createUser()
        await sendMessage({ author, shareWith: [] })
        const item = await sendMessage({ author, shareWith: [] })

        const items = await getItems({
          loggedInAs: author,
          filters: { search: item.id },
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
        })

        expect(items).toHaveLength(1)
        expect(items).toStrictEqual([item])
      })

      it.each(['www.', ''])(
        'filters by items link (with "%s" prefix)',
        async (prefix) => {
          const author = await createUser()
          await sendMessage({ author, shareWith: [] })
          const item = await sendMessage({ author, shareWith: [] })

          const items = await getItems({
            loggedInAs: author,
            filters: {
              search: `https://${prefix}contagapp.com/item/${item.id}`,
            },
            sort: {
              order: ItemsSortOrder.NewestFirst,
              type: ItemsSortType.CreatedAt,
            },
          })

          expect(items).toHaveLength(1)
          expect(items).toStrictEqual([item])
        }
      )

      it('searches by items summary', async () => {
        const author = await createUser()
        await sendMessage({ author, shareWith: [] })
        const item = await sendMessage({ author, shareWith: [] })

        const summary = faker.lorem.paragraph()

        const summarizedItem = await summarizeItem({
          itemId: item.id,
          text: summary,
          loggedInAs: author,
        })

        const items = await getItems({
          loggedInAs: author,
          filters: {
            search: summary,
          },
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
        })

        expect(items).toHaveLength(1)
        expect(items).toStrictEqual([summarizedItem])
      })

      it('finds a nested message', async () => {
        const author = await createUser()
        const parentMessage = await sendMessage({ author, shareWith: [] })
        const nestedMessage = await sendMessage({
          author,
          parentId: parentMessage.id,
          shareWith: [],
        })

        const items = await getItems({
          loggedInAs: author,
          filters: {
            search: nestedMessage.text,
          },
          sort: {
            order: ItemsSortOrder.NewestFirst,
            type: ItemsSortType.CreatedAt,
          },
        })

        expect(items).toHaveLength(1)
        expect(items).toStrictEqual([nestedMessage])
      })
    })
  })

  describe('errors', () => {
    it('throws an error when non item or user id is passed as parentId', async () => {
      const user = await createUser()

      const response = await queryItems({
        loggedInAs: user,
        sort: {
          type: ItemsSortType.CreatedAt,
          order: ItemsSortOrder.OldestFirst,
        },
        filters: {
          parentId: idFromPrismaToGraphQL(-1, TypeName.CLIENT),
        },
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: null,
        errors: [
          expect.objectContaining({
            message: 'Invalid parentId entity type "Client"',
            path: ['items'],
          }),
        ],
      })
    })

    it("throws an error when user doesn't share any clients with parentId user", async () => {
      const user = await createUser()
      const anotherUser = await createUser()

      const response = await queryItems({
        loggedInAs: user,
        sort: {
          type: ItemsSortType.CreatedAt,
          order: ItemsSortOrder.OldestFirst,
        },
        filters: {
          parentId: anotherUser.id,
        },
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: null,
        errors: [
          expect.objectContaining({
            message: 'Parent not found',
            path: ['items'],
          }),
        ],
      })
    })

    it('throws an error when user is not in sharedWith of the parent item', async () => {
      const user = await createUser()
      const anotherUser = await createUser()
      const message = await sendMessage({
        author: anotherUser,
        shareWith: [],
      })

      const response = await queryItems({
        loggedInAs: user,
        sort: {
          type: ItemsSortType.CreatedAt,
          order: ItemsSortOrder.OldestFirst,
        },
        filters: {
          parentId: message.id,
        },
      })

      expect(response.status).toBe(200)

      const body = await response.json()

      expect(body).toStrictEqual({
        data: null,
        errors: [
          expect.objectContaining({
            message: 'Parent not found',
            path: ['items'],
          }),
        ],
      })
    })
  })
})
