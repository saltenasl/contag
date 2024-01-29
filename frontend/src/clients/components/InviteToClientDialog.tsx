import { useMutation } from '@apollo/client'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  LoadingButton,
  TextField,
} from '@contag/ui'
import { useState } from 'react'
import { isEmailRegex } from 'src/constants'
import INVITE_TO_CLIENT from 'src/mutations/inviteToClient'

type Props = {
  onClose: () => void
  clientId: string
}

const InviteToClientDialog = ({ onClose, clientId }: Props) => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteToClient] = useMutation(INVITE_TO_CLIENT)

  const isSubmitDisabled = !email || !isEmailRegex.test(email)

  const submit = async () => {
    if (isSubmitDisabled || isSubmitting) {
      return
    }

    setIsSubmitting(true)

    await inviteToClient({
      variables: { input: { email, clientId } },
      onCompleted() {
        setIsSubmitting(false)
        onClose()
      },
    })
  }

  return (
    <Dialog open={true}>
      <DialogTitle>Invite a user to this client</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To invite a user to this client please input the email address below
          and click "Invite".
        </DialogContentText>
        <TextField
          autoFocus
          margin='dense'
          id='invite-email-input'
          label='Email Address'
          type='email'
          fullWidth
          variant='standard'
          onChange={(event) => setEmail(event.target.value)}
          onKeyUp={(event) => {
            if (event.key === 'Enter') {
              submit()
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton
          loading={isSubmitting}
          variant='contained'
          disabled={isSubmitDisabled}
          onClick={submit}
        >
          Invite
        </LoadingButton>
      </DialogActions>
    </Dialog>
  )
}

export default InviteToClientDialog
