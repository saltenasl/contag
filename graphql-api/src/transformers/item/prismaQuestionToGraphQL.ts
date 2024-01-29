import type {
  Message,
  Task,
  Item as PrismaItem,
  Question as PrismaQuestion,
  Summary,
  Info,
} from '@prisma/client'
import { TypeName } from 'src/constants'
import type { Question } from 'src/generated/graphql'
import type { Item, User } from 'src/types'
import transformEntityFromPrismaToGraphQL from '../entityFromPrismaToGraphQL'
import fileFromPrismaToGraphQL from '../file/prismaToGraphQL'
import idFromPrismaToGraphQL from '../id/prismaToGraphQL'
import prismaActionExpectationToGraphQL from './shared/prismaActionExpectationToGraphQL'
import prismaSummaryToGraphQL from './shared/prismaSummaryToGraphQL'

type GraphQLQuestion = Required<
  Omit<Question, 'childCount' | 'goals' | 'blocks' | 'blockedBy'>
> // child count, goals, blocks, and blockedBy are retrieved through a separate resolver

const getAnswerText = (
  item: PrismaItem & {
    message: Message | null
    task: Task | null
    question: PrismaQuestion | null
    summary: Summary | null
    info: Info | null
  }
) => {
  if (item.summary && item.summary.shouldReplaceOriginalItem === true) {
    return {
      text: item.summary.text,
      richText: item.summary.richText,
    }
  }

  if (item.message) {
    return {
      text: item.message.text,
      richText: item.message.richText,
    }
  }

  if (item.task) {
    return {
      text: item.task.description,
      richText: item.task.richText,
    }
  }

  if (item.question) {
    return {
      text: item.question.text,
      richText: item.question.richText,
    }
  }

  if (item.info) {
    return {
      text: item.info.text,
      richText: item.info.richText,
    }
  }

  return null
}

const prismaQuestionItemToGraphQL = (
  item: Item<'question'>,
  {
    hasQuestionParent = false,
    currentUser,
  }: { hasQuestionParent: boolean; currentUser: User }
): GraphQLQuestion => {
  const transformedQuestion = transformEntityFromPrismaToGraphQL(
    item.question,
    TypeName.QUESTION
  )

  return {
    __typename: TypeName.QUESTION,
    id: idFromPrismaToGraphQL(item.id, TypeName.ITEM),
    parentId: item.parentId
      ? idFromPrismaToGraphQL(item.parentId, TypeName.ITEM)
      : null,
    author: transformEntityFromPrismaToGraphQL(item.author, TypeName.USER),
    text: transformedQuestion.text,
    richText: transformedQuestion.richText,
    to:
      item.addressedTo.map(({ user }) =>
        transformEntityFromPrismaToGraphQL(user, TypeName.USER)
      ) || [],
    sharedWith:
      item.sharedWith.map(({ user }) =>
        transformEntityFromPrismaToGraphQL(user, TypeName.USER)
      ) || [],
    createdAt: item.createdAt,
    updatedAt: item.question.updatedAt,
    acceptedAnswer: item.question.answer
      ? getAnswerText(item.question.answer)
      : null,
    isAcceptedAnswer: hasQuestionParent ? !!item.answerFor : null,
    actionExpectation: prismaActionExpectationToGraphQL({
      item,
      currentUser,
    }),
    summary: prismaSummaryToGraphQL(item),
    attachments: item.attachments.map(fileFromPrismaToGraphQL),
  }
}

export default prismaQuestionItemToGraphQL
