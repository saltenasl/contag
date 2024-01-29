import { useApolloClient, useMutation } from '@apollo/client'
import {
  Grid,
  AddTaskIcon,
  IconButton,
  SendIcon,
  useTheme,
  FutureDateTimePicker,
  CloseIcon,
  Loader,
} from '@contag/ui'
import { useMemo, useRef, useState } from 'react'
import SEND_MESSAGE from 'src/mutations/sendMessage'
import parseGraphQLId from '@contag/graphql-api/src/transformers/id/parseGraphQLId'
import { TypeName } from '@contag/graphql-api/src/constants'
import CREATE_TASK from 'src/mutations/createTask'
import cacheCreateItem from 'src/apollo/cache/item/create'
import { useItemsFeedContext } from '../../Home/components/Feed/Items/Context'
import AMEND_MESSAGE from 'src/mutations/amendMessage'
import AMEND_TASK from 'src/mutations/amendTask'
import {
  ActionExpectation,
  File,
  ItemType,
  PublicUser,
} from 'src/generated/graphql'
import AMEND_QUESTION from 'src/mutations/amendQuestion'
import CREATE_QUESTION from 'src/mutations/createQuestion'
import cacheUpdatedAnswer from 'src/apollo/cache/item/cacheUpdatedAnswer'
import ItemTextInputField from './TextField'
import getSharedWithFromCache from 'src/apollo/cache/item/getSharedWith'
import ItemTypeToggleGroup from './ItemTypeToggleGroup'
import { useAuth, User } from 'src/auth'
import CREATE_INFO from 'src/mutations/createInfo'
import AMEND_INFO from 'src/mutations/amendInfo'
import FileUploader from 'src/FileUpload/FileUploader'
import PublicUsersInput from './PublicUsers'
import { getSubmitLabel } from './utils'
import CREATE_GOAL from 'src/mutations/createGoal'
import AMEND_GOAL from 'src/mutations/amendGoal'
import { RichTextValue } from 'src/RichTextEditor/Components/RichTextEditor/RichTextEditor'

type Props =
  | {
      itemType?: ItemType
      initialText?: {
        text?: string
        richText?: object | null
      }
      actionExpectation?: never
      isEditing?: false | undefined
      stopEditing?: never
      id?: never
      to?: never
      sharedWith?: never
      attachments?: never
      parentId: string
      onClose: () => void
    }
  | {
      itemType?: ItemType
      initialText: {
        text: string
        richText: object | null | undefined
      }
      actionExpectation: ActionExpectation | null
      isEditing: true
      stopEditing: () => void
      id: string
      to: PublicUser[]
      sharedWith: PublicUser[]
      attachments: File[]
      parentId?: never
      onClose?: never
    }

const getDefaultAssigneeId = ({
  to,
  potentialAssignees,
  currentUser,
}: {
  to: PublicUser[] | undefined
  potentialAssignees: PublicUser[]
  currentUser: User | null | undefined
}): PublicUser | null => {
  if (to) {
    if (to.length !== 0) {
      return to[0]
    }

    return null
  }

  const nonAuthorAssignees = potentialAssignees.filter(
    ({ email }) => email !== currentUser?.email
  )

  if (nonAuthorAssignees.length === 1) {
    return nonAuthorAssignees[0]
  }

  return null
}

const emptyText = { plainText: '', richText: null }

const ItemForm = ({
  itemType = ItemType.Message,
  initialText = {},
  isEditing = false,
  stopEditing,
  actionExpectation,
  id,
  to,
  sharedWith,
  attachments: initialAttachments,
  parentId,
  onClose,
}: Props) => {
  const theme = useTheme()
  const [text, setText] = useState<RichTextValue>({
    plainText: initialText.text ?? emptyText.plainText,
    richText: initialText.richText ?? null,
  })
  const [type, setType] = useState<ItemType>(itemType)
  const { user } = useAuth()
  const [completeUntil, setCompleteUntil] = useState<{
    isValid: boolean
    dateTimeISOString: null | string
  }>({
    isValid: true,
    dateTimeISOString: actionExpectation?.completeUntil ?? null,
  })
  const [attachments, setAttachments] = useState<File[]>(
    initialAttachments ?? []
  )
  const { cache } = useApolloClient()
  const formRef = useRef<HTMLFormElement>(null)
  const feedContext = useItemsFeedContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const potentialAssignees = useMemo(() => {
    if (sharedWith) {
      return sharedWith
    }

    return getSharedWithFromCache(cache, parentId)
  }, [parentId, sharedWith])

  const defaultAssignee = useMemo(
    () =>
      getDefaultAssigneeId({
        to,
        potentialAssignees,
        currentUser: user,
      }),
    [to, potentialAssignees, user]
  )
  const defaultAssignees = defaultAssignee ? [defaultAssignee] : []
  const [assignees, setAssignees] = useState<PublicUser[]>(
    to ?? defaultAssignees
  )
  const [shareWith, setShareWith] = useState(sharedWith ?? [])

  const [hasUploadsPending, setHasUploadsPending] = useState(false)

  const isActionExpectationFulfilled = actionExpectation?.fulfilled || false

  const resetForm = () => {
    setText(emptyText)
    setAttachments([])
    setIsSubmitting(false)
    setAssignees(defaultAssignees)
  }

  const [sendMessage] = useMutation(SEND_MESSAGE)
  const [createTask] = useMutation(CREATE_TASK)
  const [amendMessage] = useMutation(AMEND_MESSAGE)
  const [amendTask] = useMutation(AMEND_TASK)
  const [createQuestion] = useMutation(CREATE_QUESTION)
  const [amendQuestion] = useMutation(AMEND_QUESTION)
  const [createInfo] = useMutation(CREATE_INFO)
  const [amendInfo] = useMutation(AMEND_INFO)
  const [createGoal] = useMutation(CREATE_GOAL)
  const [amendGoal] = useMutation(AMEND_GOAL)

  const disabled =
    !text.plainText ||
    text.plainText === '\n' || // empty editor is /n in plain text due to <p></p>
    !completeUntil.isValid ||
    hasUploadsPending ||
    isSubmitting

  const submit = () => {
    if (disabled) {
      return
    }

    setIsSubmitting(true)

    // parentId is required when !isEditing, however ts doesn't infer it automatically
    if (!isEditing && parentId) {
      const { entity: parentEntity } = parseGraphQLId(parentId)

      if (type === ItemType.Message) {
        sendMessage({
          variables: {
            input: {
              text: text.plainText,
              richText: text.richText,
              ...(parentEntity === TypeName.USER
                ? { shareWith: [{ id: parentId }] }
                : { parentId: parentId }),
              attachments: attachments.map(({ id }) => ({ id })),
            },
          },
          onCompleted() {
            resetForm()
          },
          update(cache, result) {
            if (result.data?.sendMessage?.id && feedContext) {
              cacheCreateItem(cache, {
                newItem: result.data.sendMessage,
                parentFeedVariables: feedContext.parentFeedVariables,
                parentId,
                variables: feedContext.variables,
              })
            }
          },
        })
      }

      if (type === ItemType.Task) {
        createTask({
          variables: {
            input: {
              text: text.plainText,
              richText: text.richText,
              to: assignees.map(({ id }) => ({ id })),
              ...(parentEntity === TypeName.USER
                ? { shareWith: [{ id: parentId }] }
                : { parentId: parentId }),
              actionExpectation: {
                completeUntil: completeUntil.dateTimeISOString,
              },
              attachments: attachments.map(({ id }) => ({ id })),
            },
          },
          onCompleted() {
            resetForm()
          },
          update(cache, result) {
            if (result.data?.createTask?.id && feedContext) {
              cacheCreateItem(cache, {
                newItem: result.data.createTask,
                parentFeedVariables: feedContext.parentFeedVariables,
                parentId,
                variables: feedContext.variables,
              })
            }
          },
        })
      }

      if (type === ItemType.Question) {
        createQuestion({
          variables: {
            input: {
              text: text.plainText,
              richText: text.richText,
              to: assignees.map(({ id }) => ({ id })),
              ...(parentEntity === TypeName.USER
                ? { shareWith: [{ id: parentId }] }
                : { parentId: parentId }),
              actionExpectation: {
                completeUntil: completeUntil.dateTimeISOString,
              },
              attachments: attachments.map(({ id }) => ({ id })),
            },
          },
          onCompleted() {
            resetForm()
          },
          update(cache, result) {
            if (result.data?.createQuestion?.id && feedContext) {
              cacheCreateItem(cache, {
                newItem: result.data.createQuestion,
                parentFeedVariables: feedContext.parentFeedVariables,
                parentId,
                variables: feedContext.variables,
              })
            }
          },
        })
      }

      if (type === ItemType.Info) {
        createInfo({
          variables: {
            input: {
              text: text.plainText,
              richText: text.richText,
              to: assignees.map(({ id }) => ({ id })),
              ...(parentEntity === TypeName.USER
                ? { shareWith: [{ id: parentId }] }
                : { parentId: parentId }),
              actionExpectation: {
                completeUntil: completeUntil.dateTimeISOString,
              },
              attachments: attachments.map(({ id }) => ({ id })),
            },
          },
          onCompleted() {
            resetForm()
          },
          update(cache, result) {
            if (result.data?.createInfo?.id && feedContext) {
              cacheCreateItem(cache, {
                newItem: result.data.createInfo,
                parentFeedVariables: feedContext.parentFeedVariables,
                parentId,
                variables: feedContext.variables,
              })
            }
          },
        })
      }

      if (type === ItemType.Goal) {
        createGoal({
          variables: {
            input: {
              text: text.plainText,
              richText: text.richText,
              to: assignees.map(({ id }) => ({ id })),
              ...(parentEntity === TypeName.USER
                ? { shareWith: [{ id: parentId }] }
                : { parentId: parentId }),
              actionExpectation: {
                completeUntil: completeUntil.dateTimeISOString,
              },
              attachments: attachments.map(({ id }) => ({ id })),
            },
          },
          onCompleted() {
            resetForm()
          },
          update(cache, result) {
            if (result.data?.createGoal?.id && feedContext) {
              cacheCreateItem(cache, {
                newItem: result.data.createGoal,
                parentFeedVariables: feedContext.parentFeedVariables,
                parentId,
                variables: feedContext.variables,
              })
            }
          },
        })
      }
    }

    if (isEditing && id) {
      if (type === ItemType.Message) {
        amendMessage({
          variables: {
            input: {
              id,
              text: text.plainText,
              richText: text.richText,
              sharedWith: shareWith.map(({ id }) => ({ id })),
              attachments: attachments.map(({ id }) => ({ id })),
            },
          },
          onCompleted() {
            stopEditing()
            setIsSubmitting(false)
          },
          update(cache, result) {
            if (
              result.data?.amendMessage &&
              result.data.amendMessage.isAcceptedAnswer === true &&
              feedContext
            ) {
              cacheUpdatedAnswer(cache, {
                answer: result.data.amendMessage,
                parentFeedVariables: feedContext.parentFeedVariables,
              })
            }
          },
        })
      }

      if (type === ItemType.Task) {
        amendTask({
          variables: {
            input: {
              id,
              text: text.plainText,
              richText: text.richText,
              ...(!isActionExpectationFulfilled
                ? {
                    actionExpectation: {
                      completeUntil: completeUntil.dateTimeISOString,
                    },
                  }
                : {}),
              to: assignees.map(({ id }) => ({ id })),
              sharedWith: shareWith.map(({ id }) => ({ id })),
              attachments: attachments.map(({ id }) => ({ id })),
            },
          },
          onCompleted() {
            stopEditing()
            setIsSubmitting(false)
          },
          update(cache, result) {
            if (
              result.data?.amendTask &&
              result.data.amendTask.isAcceptedAnswer === true &&
              feedContext
            ) {
              cacheUpdatedAnswer(cache, {
                answer: result.data.amendTask,
                parentFeedVariables: feedContext.parentFeedVariables,
              })
            }
          },
        })
      }

      if (type === ItemType.Question) {
        amendQuestion({
          variables: {
            input: {
              id,
              text: text.plainText,
              richText: text.richText,
              ...(!isActionExpectationFulfilled
                ? {
                    actionExpectation: {
                      completeUntil: completeUntil.dateTimeISOString,
                    },
                  }
                : {}),
              to: assignees.map(({ id }) => ({ id })),
              sharedWith: shareWith.map(({ id }) => ({ id })),
              attachments: attachments.map(({ id }) => ({ id })),
            },
          },
          onCompleted() {
            stopEditing()
            setIsSubmitting(false)
          },
          update(cache, result) {
            if (
              result.data?.amendQuestion &&
              result.data.amendQuestion.isAcceptedAnswer === true &&
              feedContext
            ) {
              cacheUpdatedAnswer(cache, {
                answer: result.data.amendQuestion,
                parentFeedVariables: feedContext.parentFeedVariables,
              })
            }
          },
        })
      }

      if (type === ItemType.Info) {
        amendInfo({
          variables: {
            input: {
              id,
              text: text.plainText,
              richText: text.richText,
              ...(!isActionExpectationFulfilled
                ? {
                    actionExpectation: {
                      completeUntil: completeUntil.dateTimeISOString,
                    },
                  }
                : {}),
              to: assignees.map(({ id }) => ({ id })),
              sharedWith: shareWith.map(({ id }) => ({ id })),
              attachments: attachments.map(({ id }) => ({ id })),
            },
          },
          onCompleted() {
            stopEditing()
            setIsSubmitting(false)
          },
          update(cache, result) {
            if (
              result.data?.amendInfo &&
              result.data.amendInfo.isAcceptedAnswer === true &&
              feedContext
            ) {
              cacheUpdatedAnswer(cache, {
                answer: result.data.amendInfo,
                parentFeedVariables: feedContext.parentFeedVariables,
              })
            }
          },
        })
      }

      if (type === ItemType.Goal) {
        amendGoal({
          variables: {
            input: {
              id,
              text: text.plainText,
              richText: text.richText,
              ...(!isActionExpectationFulfilled
                ? {
                    actionExpectation: {
                      completeUntil: completeUntil.dateTimeISOString,
                    },
                  }
                : {}),
              to: assignees.map(({ id }) => ({ id })),
              sharedWith: shareWith.map(({ id }) => ({ id })),
              attachments: attachments.map(({ id }) => ({ id })),
            },
          },
          onCompleted() {
            stopEditing()
            setIsSubmitting(false)
          },
          update(cache, result) {
            if (
              result.data?.amendGoal &&
              result.data.amendGoal.isAcceptedAnswer === true &&
              feedContext
            ) {
              cacheUpdatedAnswer(cache, {
                answer: result.data.amendGoal,
                parentFeedVariables: feedContext.parentFeedVariables,
              })
            }
          },
        })
      }
    }
  }

  return (
    <Grid
      display='flex'
      component={'form'}
      ref={formRef}
      aria-label='item form'
      onClick={(event) => event.stopPropagation()}
      sx={{
        flexDirection: 'column',
        flexGrow: 1,
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          stopEditing?.()
        }
      }}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <Grid
        display='flex'
        sx={{
          marginBottom: theme.spacing(-2),
          justifyContent: 'space-between',
        }}
      >
        {!isEditing && (
          <>
            <Grid sx={{ py: theme.spacing(0) }}>
              <ItemTypeToggleGroup
                initialValue={ItemType.Message}
                onChange={setType}
                aria-label='convert item to type'
              />
            </Grid>
            <Grid sx={{ py: theme.spacing(0) }}>
              <IconButton
                aria-label='close item form'
                color='primary'
                onClick={onClose}
              >
                <CloseIcon />
              </IconButton>
            </Grid>
          </>
        )}
      </Grid>
      {type !== ItemType.Message ? (
        <>
          <Grid>
            <FutureDateTimePicker
              label='Complete until'
              onChange={(completeUntil) => {
                setCompleteUntil(completeUntil)
              }}
              initialValue={actionExpectation?.completeUntil ?? null}
            />
          </Grid>
          <Grid sx={{ px: theme.spacing(2) }}>
            <PublicUsersInput
              id='assignees'
              chip={{ label: 'assigned person' }}
              input={{ label: 'Assignees', placeholder: 'Assignee' }}
              onChange={setAssignees}
              value={assignees}
            />
          </Grid>
        </>
      ) : null}
      {isEditing ? (
        <Grid sx={{ px: theme.spacing(2) }}>
          <PublicUsersInput
            id='shared-with'
            chip={{ label: 'shared with person' }}
            input={{ label: 'Shared With', placeholder: 'Share with' }}
            disableClearable
            onChange={setShareWith}
            value={shareWith}
            disableRemoveSelf
          />
        </Grid>
      ) : null}
      <Grid display='flex'>
        <Grid sx={{ flexGrow: 1 }}>
          <ItemTextInputField
            label={(() => {
              if (type === ItemType.Message) {
                return 'Type message here'
              }

              if (type === ItemType.Question) {
                return 'Type question here'
              }

              if (type === ItemType.Info) {
                return 'Type info here'
              }

              if (type === ItemType.Goal) {
                return 'Type goal title here'
              }

              return 'Type task description here'
            })()}
            autoFocus={true}
            value={text}
            onChange={(value) => {
              setText(value)
            }}
            onSubmit={() => {
              formRef.current?.requestSubmit()
            }}
          />
        </Grid>
        <Grid display='flex'>
          {!isSubmitting ? (
            <IconButton
              color='primary'
              aria-label={getSubmitLabel({ isEditing, type })}
              type='submit'
              disabled={disabled}
            >
              {type === ItemType.Question || type === ItemType.Message ? (
                <SendIcon />
              ) : (
                <AddTaskIcon />
              )}
            </IconButton>
          ) : (
            <Loader />
          )}
        </Grid>
      </Grid>
      <Grid marginTop={theme.spacing(-4)}>
        <FileUploader
          onChange={setAttachments}
          files={attachments}
          onHasUploadsPendingChange={setHasUploadsPending}
        />
      </Grid>
    </Grid>
  )
}

export default ItemForm
