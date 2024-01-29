import { DEFAULT_ITEM_FEED_SORT } from 'src/constants'
import { Item, PublicUser, User } from 'src/generated/graphql'
import messageFactory from 'test/factories/message'
import publicUserFactory from 'test/factories/publicUser'
import userProfileFactory from 'test/factories/userProfile'
import { FactoryTypeFromGraphQLType } from 'test/factories/utils/types'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockGetItems from 'test/requestMocks/getItems'
import renderAndNavigateToPersonsFeed from './renderAndNavigateToPersonsFeed'

const renderAndNavigateToNestedFeed = async ({
  myProfile = userProfileFactory.build(),
  someUser = publicUserFactory.build(),
  parentFeedItems = messageFactory.buildList(2, {
    author: userToPublicUser(myProfile),
    sharedWith: [userToPublicUser(myProfile), someUser],
  }),
  parentItem,
  nestedItems = messageFactory.buildList(1, {
    author: userToPublicUser(myProfile),
    sharedWith: [userToPublicUser(myProfile), someUser],
    parentId: parentItem ? parentItem.id : parentFeedItems[0].id,
  }),
}: {
  myProfile?: FactoryTypeFromGraphQLType<User>
  someUser?: PublicUser
  parentFeedItems?: Item[]
  parentItem?: Item
  nestedItems?: Item[]
} = {}) => {
  parentItem = parentItem || parentFeedItems[0]

  mockGetItems({
    items: nestedItems,
    input: {
      sort: DEFAULT_ITEM_FEED_SORT,
      filters: { parentId: parentItem.id },
    },
  })

  const nonUniqueRecipients = [...parentFeedItems, ...nestedItems]
    .map(({ sharedWith }) => sharedWith)
    .flat()
  const recipients = nonUniqueRecipients
    .filter(
      (recipient, index) =>
        nonUniqueRecipients.findIndex(({ id }) => id === recipient.id) === index
    )
    .filter(({ id }) => id !== myProfile.id)

  const {
    screen,
    userEvent,
    waitFor,
    within,
    sendMessageRequestInfo,
    personsFeed,
  } = await renderAndNavigateToPersonsFeed({
    items: parentFeedItems,
    recipients,
    myProfile,
  })

  const messageWithReplies = within(personsFeed).getByTestId(
    `item-${parentItem.id}`
  )
  expect(messageWithReplies).toBeInTheDocument()

  await userEvent.click(messageWithReplies)

  const nestedFeed = screen.getByTestId(`${parentItem.id}-feed`)
  expect(nestedFeed).toBeInTheDocument()

  await waitFor(() => {
    expect(
      within(nestedFeed).queryByLabelText('Loading')
    ).not.toBeInTheDocument()
  })

  return {
    userEvent,
    waitFor,
    within,
    nestedFeed,
    parentItem: parentItem,
    parentFeedItems,
    personsFeed,
    nestedItems,
    sendMessageRequestInfo,
    screen,
  }
}

export default renderAndNavigateToNestedFeed
