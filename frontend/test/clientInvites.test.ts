import { faker } from '@faker-js/faker'
import { CLIENTS_PAGE_URL } from 'src/clients/constants'
import { UserClientRole } from 'src/generated/graphql'
import clientInviteFactory from './factories/clientInvite'
import userProfileFactory from './factories/userProfile'
import usersClientFactory from './factories/usersClient'
import mockGetMyProfileRequest from './requestMocks/getMyProfile'
import mockGetPublicUsers from './requestMocks/getPublicUsers'
import mockMutateAcceptClientInvite from './requestMocks/mutateAcceptClientInvite'
import mockMutateDeclineClientInvite from './requestMocks/mutateDeclineClientInvite'
import mockMutateInviteToClient from './requestMocks/mutateInviteToClient'
import renderApp from './utils/renderApp'

const render = async ({
  email = faker.internet.email(),
  numberOfInvites = 0,
  path = '/',
  myProfile = userProfileFactory.build({
    clientInvites: clientInviteFactory.buildList(numberOfInvites, { email }),
  }),
} = {}) => {
  mockGetPublicUsers()
  const { requestInfo: getMyProfileRequestInfo } = mockGetMyProfileRequest({
    myProfile,
  })

  const utils = await renderApp({
    loggedIn: true,
    loggedInUser: myProfile,
    path,
  })

  await utils.waitFor(() => {
    expect(utils.screen.queryByLabelText('Loading')).not.toBeInTheDocument()
  })

  return {
    user: myProfile,
    getMyProfileRequestInfo,
    ...utils,
  }
}

describe('client invites', () => {
  it('badge is not displayed when there are no client invites', async () => {
    const { screen, userEvent, waitFor } = await render()

    await waitFor(() => {
      expect(
        screen.queryByLabelText('empty profile picture')
      ).not.toBeInTheDocument()
    })

    const menuIconBadge = screen.getByLabelText('0 new notifications')
    expect(menuIconBadge).toBeInTheDocument()
    expect(menuIconBadge).toHaveTextContent('')

    await userEvent.click(screen.getByLabelText('menu'))

    expect(screen.getByText('Clients')).toBeInTheDocument()
  })

  it.each([1, 2])(
    'badges aria label on the users avatar if there is %d invite(s) to client',
    async (numberOfInvites) => {
      const { screen, userEvent, getMyProfileRequestInfo, waitFor } =
        await render({ numberOfInvites })

      await waitFor(() => {
        expect(getMyProfileRequestInfo.calledTimes).toBe(1)
      })

      const menuIconBadge = screen.getByLabelText(
        `${numberOfInvites} new notification${numberOfInvites === 1 ? '' : 's'}`
      )
      expect(menuIconBadge).toBeInTheDocument()
      expect(menuIconBadge).toHaveTextContent(`${numberOfInvites}`)

      await userEvent.click(screen.getByLabelText('menu'))

      expect(screen.getByText('Clients')).toBeInTheDocument()
    }
  )

  it('user is able to navigate to client invites page', async () => {
    const { screen, userEvent, getLocation } = await render()

    await userEvent.click(screen.getByLabelText('menu'))

    await userEvent.click(screen.getByText('Clients'))

    expect(getLocation()).toStrictEqual(
      expect.objectContaining({
        pathname: CLIENTS_PAGE_URL,
      })
    )

    expect(screen.getByText('Currently joined clients')).toBeInTheDocument()
  })

  describe('client invites page', () => {
    const renderInvitesPage = ({
      numberOfInvites = 0,
      myProfile,
    }: {
      numberOfInvites?: number
      myProfile?: ReturnType<typeof userProfileFactory.build>
    } = {}) => render({ numberOfInvites, path: CLIENTS_PAGE_URL, myProfile })

    it('displays users current clients', async () => {
      const { screen, user, within } = await renderInvitesPage({
        myProfile: userProfileFactory.build({
          clients: [
            usersClientFactory.build({
              role: UserClientRole.Owner,
              addedBy: null,
            }),
            usersClientFactory.build({ role: UserClientRole.Admin }),
            usersClientFactory.build({ role: UserClientRole.Member }),
          ],
        }),
      })

      expect(
        await screen.findByText('Currently joined clients')
      ).toBeInTheDocument()
      expect(screen.queryByText('Client invites')).not.toBeInTheDocument()

      user.clients.forEach(({ id, name, role, addedBy }) => {
        const clientListItem = screen.getByTestId(`client-list-item-${id}`)
        expect(clientListItem).toBeInTheDocument()

        expect(within(clientListItem).getByText(name)).toBeInTheDocument()
        expect(within(clientListItem).getByText(role)).toBeInTheDocument()

        if (role === UserClientRole.Owner || role === UserClientRole.Admin) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(
            within(clientListItem).getByLabelText('send an invite')
          ).toBeInTheDocument()
        } else {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(
            within(clientListItem).queryByLabelText('send an invite')
          ).not.toBeInTheDocument()
        }

        if (addedBy) {
          // eslint-disable-next-line jest/valid-expect
          expect(
            within(clientListItem).getByText(`- Added by ${addedBy.email}`)
          )
        }
      })
    })

    it('displays user client invites when there are some', async () => {
      const { screen, user } = await renderInvitesPage({ numberOfInvites: 2 })

      expect(await screen.findByText('Client invites')).toBeInTheDocument()

      user.clientInvites.forEach(({ client: { name } }) => {
        expect(screen.getByText(name)).toBeInTheDocument()
      })
    })

    it('user accepts client invite', async () => {
      const { screen, user, waitFor, userEvent } = await renderInvitesPage({
        numberOfInvites: 1,
      })

      expect(await screen.findByText('Client invites')).toBeInTheDocument()

      const { requestInfo: acceptRequestInfo } = mockMutateAcceptClientInvite(
        usersClientFactory.build({
          name: user.clientInvites[0].client.name,
          addedBy: user.clientInvites[0].invitedBy,
        })
      )

      await userEvent.click(
        screen.getByTestId(`accept-client-${user.clientInvites[0].id}-invite`)
      )

      await waitFor(() => {
        expect(acceptRequestInfo.calledTimes).toBe(1)
      })

      expect(acceptRequestInfo.calls[0].requestVariables).toStrictEqual({
        inviteId: user.clientInvites[0].id,
      })

      await waitFor(() => {
        expect(screen.queryByText('Client invites')).not.toBeInTheDocument()
      })

      expect(
        screen.getByText(user.clientInvites[0].client.name)
      ).toBeInTheDocument() // under joined
    })

    it('user declines client invite', async () => {
      const declineRequestInfo = mockMutateDeclineClientInvite()

      const { screen, user, waitFor, userEvent } = await renderInvitesPage({
        numberOfInvites: 1,
      })

      expect(await screen.findByText('Client invites')).toBeInTheDocument()

      await userEvent.click(
        screen.getByTestId(`decline-client-${user.clientInvites[0].id}-invite`)
      )

      await waitFor(() => {
        expect(declineRequestInfo.calledTimes).toBe(1)
      })

      expect(declineRequestInfo.calls[0].requestVariables).toStrictEqual({
        inviteId: user.clientInvites[0].id,
      })

      await waitFor(() => {
        expect(screen.queryByText('Client invites')).not.toBeInTheDocument()
      })

      expect(
        screen.queryByText(user.clientInvites[0].client.name)
      ).not.toBeInTheDocument()
    })

    describe('invite email to your own client', () => {
      it('invites email to client', async () => {
        const email = faker.internet.email()
        const inviteRequestInfo = mockMutateInviteToClient()

        const { screen, userEvent, waitFor, user } = await renderInvitesPage()

        expect(
          await screen.findByText('Currently joined clients')
        ).toBeInTheDocument()

        await userEvent.click(screen.getByLabelText('send an invite'))

        expect(
          screen.getByLabelText('Invite a user to this client')
        ).toBeInTheDocument()

        expect(screen.getByText('Invite')).toBeInTheDocument()
        expect(screen.getByText('Cancel')).toBeInTheDocument()

        expect(screen.getByText('Invite')).toBeDisabled()

        await userEvent.type(screen.getByLabelText('Email Address'), email)

        expect(screen.getByText('Invite')).not.toBeDisabled()

        await userEvent.click(screen.getByText('Invite'))

        await waitFor(() => {
          expect(screen.queryByText('Invite')).not.toBeInTheDocument()
        })

        expect(inviteRequestInfo.calledTimes).toBe(1)
        expect(inviteRequestInfo.calls[0].requestVariables).toStrictEqual({
          input: { clientId: user.clients[0].id, email },
        })
      })

      it('cancels in the dialog', async () => {
        const { screen, userEvent, waitFor } = await renderInvitesPage()

        expect(
          await screen.findByText('Currently joined clients')
        ).toBeInTheDocument()

        await userEvent.click(screen.getByLabelText('send an invite'))

        expect(
          screen.getByLabelText('Invite a user to this client')
        ).toBeInTheDocument()

        await userEvent.click(screen.getByText('Cancel'))

        await waitFor(() => {
          expect(
            screen.queryByLabelText('Invite a user to this client')
          ).not.toBeInTheDocument()
        })
      })

      it('invite button is disabled if text input value is not a valid email', async () => {
        const { screen, userEvent } = await renderInvitesPage()

        expect(
          await screen.findByText('Currently joined clients')
        ).toBeInTheDocument()

        await userEvent.click(screen.getByLabelText('send an invite'))

        expect(screen.getByText('Invite')).toBeDisabled()

        await userEvent.type(
          screen.getByLabelText('Email Address'),
          faker.random.word()
        )

        expect(screen.getByText('Invite')).toBeDisabled()
      })
    })
  })
})
