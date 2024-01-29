import { Item, PublicUser, User } from 'src/generated/graphql'
import userProfileFactory from 'test/factories/userProfile'
import { FactoryTypeFromGraphQLType } from 'test/factories/utils/types'
import mockGetItems from 'test/requestMocks/getItems'
import mockMutateSendMessage from 'test/requestMocks/mutateSendMessage'
import mockMutateCreateTask from 'test/requestMocks/mutateCreateTask'
import render from './render'
import { DEFAULT_ITEM_FEED_SORT } from 'src/constants'
import mockMutateCreateQuestion from 'test/requestMocks/mutateCreateQuestion'
import mockMutateCreateInfo from 'test/requestMocks/mutateCreateInfo'
import mockMutateCreateGoal from 'test/requestMocks/mutateCreateGoal'

const renderAndNavigateToPersonsFeed = async ({
  items = [],
  myProfile = userProfileFactory.build(),
  recipients = [],
}: {
  items?: Array<Item>
  myProfile?: FactoryTypeFromGraphQLType<User>
  recipients?: PublicUser[]
} = {}) => {
  const { requestInfo: sendMessageRequestInfo } = mockMutateSendMessage({
    author: myProfile,
  })
  const { requestInfo: createTaskRequestInfo } = mockMutateCreateTask({
    author: myProfile,
  })
  const { requestInfo: createQuestionRequestInfo } = mockMutateCreateQuestion({
    author: myProfile,
  })
  const { requestInfo: createInfoRequestInfo } = mockMutateCreateInfo({
    author: myProfile,
  })
  const { requestInfo: createGoalRequestInfo } = mockMutateCreateGoal({
    author: myProfile,
  })

  const { screen, waitFor, within, userEvent, ...rest } = await render({
    recipients,
    myProfile,
    includeSelfInPersonFeed: true,
  })

  const person = myProfile

  const { requestInfo: getFeedRequestInfo } = mockGetItems({
    items,
    input: {
      sort: DEFAULT_ITEM_FEED_SORT,
      filters: { parentId: person.id },
    },
  })

  await waitFor(() => {
    expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument()
  })

  expect(screen.getByLabelText(`message ${person.name}`)).toBeInTheDocument()

  await userEvent.click(screen.getByLabelText(`message ${person.name}`))

  const personsFeed = screen.getByTestId(`${person.id}-feed`)

  await waitFor(() => {
    expect(
      within(personsFeed).queryByLabelText('Loading')
    ).not.toBeInTheDocument()
  })

  return {
    ...rest,
    screen,
    within,
    waitFor,
    person,
    personsFeed,
    userEvent,
    sendMessageRequestInfo,
    getFeedRequestInfo,
    createTaskRequestInfo,
    createQuestionRequestInfo,
    createInfoRequestInfo,
    createGoalRequestInfo,
    recipients,
  }
}

export default renderAndNavigateToPersonsFeed
