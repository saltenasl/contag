import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'
import uploadFileToStorage from 'src/FileUpload/utils/uploadFileToStorage'
import { Info, File as GraphQLFile } from 'src/generated/graphql'
import { STORAGE_ORIGIN } from 'test/config/setup'
import itemFormDriver from 'test/drivers/item/form'
import fileFactory from 'test/factories/file'
import infoFactory from 'test/factories/info'
import publicUserFactory from 'test/factories/publicUser'
import userProfileFactory from 'test/factories/userProfile'
import userToPublicUser from 'test/factories/utils/userToPublicUser'
import mockMutateCreateFile from 'test/requestMocks/mutateCreateFile'
import { DATE_TIME_PICKER_INPUT_FORMAT } from 'test/utils/constants'
import renderAndNavigateToPersonsFeed from './utils/renderAndNavigateToPersonsFeed'

describe('infos in the feed', () => {
  it('displays infos in the persons feed', async () => {
    const myProfile = userProfileFactory.build()
    const someUser = publicUserFactory.build()

    const infos = [
      infoFactory.build({
        author: userToPublicUser(myProfile),
        sharedWith: [userToPublicUser(myProfile), someUser],
      }),
      infoFactory.build({
        author: someUser,
        sharedWith: [someUser, userToPublicUser(myProfile)],
        acknowledged: true,
      }),
    ]

    const { screen, within } = await renderAndNavigateToPersonsFeed({
      items: infos,
      myProfile,
    })

    infos.forEach((info) => {
      const infoCard = screen.getByTestId(`item-${info.id}`)

      expect(infoCard).toBeInTheDocument()
      expect(within(infoCard).getByText(info.text)).toBeInTheDocument()

      expect(within(infoCard).getByLabelText('info')).toBeInTheDocument()

      const authorContainer = within(infoCard).getByLabelText('author')
      expect(authorContainer).toBeInTheDocument()
      expect(
        within(authorContainer).getByLabelText(`${info.author.name} avatar`)
      ).toBeInTheDocument()

      expect(
        within(infoCard).getByLabelText('open detailed view')
      ).toBeInTheDocument()

      expect(within(infoCard).getByText('Shared with:')).toBeInTheDocument()
      info.sharedWith
        .filter(({ id }) => id !== info.author.id)
        .forEach(({ name }) => {
          expect(
            within(
              within(infoCard).getByLabelText('shared with')
            ).getByLabelText(`${name} avatar`)
          ).toBeInTheDocument()
        })

      if (info.acknowledged) {
        expect(within(infoCard).getByText('Acknowledged')).toBeInTheDocument()
        expect(
          within(infoCard).queryByText('Acknowledge')
        ).not.toBeInTheDocument()
      } else {
        expect(within(infoCard).getByText('Acknowledge')).toBeInTheDocument()
        expect(
          within(infoCard).queryByText('Acknowledged')
        ).not.toBeInTheDocument()
      }
    })
  })
})

describe('creating a info', () => {
  it('creates a basic info and shares it with a person', async () => {
    const {
      screen,
      userEvent,
      waitFor,
      createInfoRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('info')
    )

    const createButton = screen.getByLabelText('create')
    const textInput = within(personsFeed).getByLabelText('Type info here')

    expect(createButton).toBeDisabled()

    const text = faker.lorem.sentence()
    await userEvent.type(textInput, text)

    expect(createButton).not.toBeDisabled()

    await userEvent.click(createButton)

    await waitFor(() => {
      expect(createInfoRequestInfo.calledTimes).toBe(1)
    })

    expect(createInfoRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
        richText: null,
        to: [],
        shareWith: [{ id: person.id }],
        actionExpectation: { completeUntil: null },
        attachments: [],
      },
    })

    await waitFor(() => {
      expect(textInput).toHaveValue('')
    })
    expect(screen.getByLabelText('create')).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByText(text)).toBeInTheDocument()
    })
  })

  it('creates a info with complete until', async () => {
    const {
      screen,
      userEvent,
      waitFor,
      createInfoRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('info')
    )

    expect(
      within(personsFeed).getByLabelText('Complete until')
    ).toBeInTheDocument()

    const completeUntilDateTimeString = dayjs()
      .add(1, 'hour')
      .format(DATE_TIME_PICKER_INPUT_FORMAT)

    const completeUntilInput =
      within(personsFeed).getByLabelText('Complete until')
    expect(completeUntilInput).toBeInTheDocument()
    await userEvent.type(completeUntilInput, completeUntilDateTimeString)
    expect(completeUntilInput).toHaveValue(completeUntilDateTimeString)

    const textInput = within(personsFeed).getByLabelText('Type info here')
    const text = faker.lorem.sentence()
    await userEvent.type(textInput, text)

    await userEvent.click(screen.getByLabelText('create'))

    await waitFor(() => {
      expect(createInfoRequestInfo.calledTimes).toBe(1)
    })

    expect(createInfoRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
        richText: null,
        to: [],
        shareWith: [{ id: person.id }],
        actionExpectation: {
          completeUntil: new Date(completeUntilDateTimeString).toISOString(),
        },
        attachments: [],
      },
    })

    const createdInfo = createInfoRequestInfo.calls[0].responseData
      .createInfo as Info

    const infoCard = await waitFor(() => {
      const infoCard = within(personsFeed).getByTestId(`item-${createdInfo.id}`)
      expect(infoCard).toBeInTheDocument()

      return infoCard
    })

    expect(
      within(infoCard).getByLabelText('action expectation')
    ).toHaveTextContent(`Action expected by ${completeUntilDateTimeString}`)
  })

  it('creates info with assignee', async () => {
    const {
      userEvent,
      waitFor,
      createInfoRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('info')
    )

    const formDriver = itemFormDriver(personsFeed)

    const assigneesDriver = formDriver.assignees()
    expect(assigneesDriver.getSelectedOptions()).toStrictEqual([])

    await assigneesDriver.options.open()
    await assigneesDriver.options.toggleOption(person.name)

    expect(assigneesDriver.getSelectedOptions()).toStrictEqual([person.name])

    const textInput = within(personsFeed).getByLabelText('Type info here')
    const text = faker.lorem.sentence()
    await userEvent.type(textInput, text)

    await userEvent.click(within(personsFeed).getByLabelText('create'))

    await waitFor(() => {
      expect(createInfoRequestInfo.calledTimes).toBe(1)
    })

    expect(createInfoRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
        richText: null,
        to: [{ id: person.id }],
        shareWith: [{ id: person.id }],
        actionExpectation: {
          completeUntil: null,
        },
        attachments: [],
      },
    })

    const createdInfo = createInfoRequestInfo.calls[0].responseData
      .createInfo as Info

    const infoCard = await waitFor(() => {
      const infoCard = within(personsFeed).getByTestId(`item-${createdInfo.id}`)
      expect(infoCard).toBeInTheDocument()

      return infoCard
    })

    expect(
      within(
        within(infoCard).getByLabelText('action expectation')
      ).getByLabelText(`${person.name} avatar`)
    ).toBeInTheDocument()
  })

  it('creates info with an attachment', async () => {
    const {
      userEvent,
      waitFor,
      createInfoRequestInfo,
      person,
      within,
      personsFeed,
    } = await renderAndNavigateToPersonsFeed()

    await userEvent.click(
      within(
        within(personsFeed).getByLabelText('convert item to type')
      ).getByLabelText('info')
    )

    const { requestInfo: createFileRequestInfo } = mockMutateCreateFile()

    const itemForm = within(personsFeed).getByLabelText('item form')

    const text = faker.lorem.sentence()
    await userEvent.type(
      within(itemForm).getByLabelText('Type info here'),
      text
    )

    const { originalName, contentType } = fileFactory.build()
    const file = new File([''], originalName, { type: contentType })

    await userEvent.upload(
      within(itemForm).getByLabelText('upload attachment'),
      file
    )

    expect(createFileRequestInfo.calledTimes).toBe(1)
    expect(createFileRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        contentType,
        originalName,
        size: 0,
      },
    })

    const createdFile = createFileRequestInfo.calls[0].responseData
      .createFile as GraphQLFile

    expect(uploadFileToStorage).toHaveBeenCalledWith(createdFile.filename, file)

    await waitFor(() => {
      expect(
        within(itemForm).queryByLabelText('uploading')
      ).not.toBeInTheDocument()
    })

    const uploadLink = within(itemForm).getByText(originalName)
    expect(uploadLink).toBeInTheDocument()

    await waitFor(() => {
      expect(uploadLink).toHaveAttribute(
        'href',
        `${STORAGE_ORIGIN}/${createdFile.filename}`
      )
    })

    await userEvent.click(within(itemForm).getByLabelText('create'))

    await waitFor(() => {
      expect(createInfoRequestInfo.calledTimes).toBe(1)
    })

    expect(createInfoRequestInfo.calls[0].requestVariables).toStrictEqual({
      input: {
        text,
        richText: null,
        to: [],
        shareWith: [{ id: person.id }],
        attachments: [{ id: createdFile.id }],
        actionExpectation: {
          completeUntil: null,
        },
      },
    })

    const createdInfo = createInfoRequestInfo.calls[0].responseData
      .createInfo as Info

    const infoCard = await waitFor(() => {
      const infoCard = within(personsFeed).getByTestId(`item-${createdInfo.id}`)

      expect(infoCard).toBeInTheDocument()

      return infoCard
    })

    expect(infoCard).toBeInTheDocument()
    const attachment = within(infoCard).getByText(originalName)
    expect(attachment).toBeInTheDocument()

    await waitFor(() => {
      expect(attachment).toHaveAttribute(
        'href',
        `${STORAGE_ORIGIN}/${createdFile.filename}`
      )
    })

    expect(within(itemForm).queryByLabelText('upload')).not.toBeInTheDocument()
  })
})
