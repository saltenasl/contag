import {
  EmailAddressResolver,
  DateTimeResolver,
  URLResolver,
  JSONObjectResolver,
} from 'graphql-scalars'
import type { Resolvers } from 'src/generated/graphql'
import acceptClientInvite from './mutations/clientInvite/accept'
import inviteToClient from './mutations/clientInvite/create'
import declineClientInvite from './mutations/clientInvite/decline'
import sendMessage from './mutations/items/message/send'
import queryClientInvites from './queries/user/clientInvites'
import queryUserProfile from './queries/user/userProfile'
import createTask from './mutations/items/task/create'
import amendTask from './mutations/items/task/amend'
import getItemChildCount from 'src/dal/item/getChildCount'
import idFromGraphQLToPrisma from 'src/transformers/id/graphQLToPrisma'
import nestItem from './mutations/items/nest'
import amendMessage from './mutations/items/message/amend'
import convertItem from './mutations/items/convert'
import createQuestion from './mutations/items/question/create'
import acceptAnswer from './mutations/items/question/acceptAnswer'
import amendQuestion from './mutations/items/question/amend'
import summarizeItem from './mutations/items/summarize'
import deleteItemSummary from './mutations/items/deleteSummary'
import createInfo from './mutations/items/info/create'
import { TypeName } from 'src/constants'
import amendInfo from './mutations/items/info/amend'
import createFile from './mutations/createFile'
import queryItem from './queries/item'
import queryPublicUsers from './queries/publicUsers'
import queryItems from './queries/items'
import createGoal from './mutations/items/goal/create'
import amendGoal from './mutations/items/goal/amend'
import listConstituents from 'src/dal/item/goal/listConstituents'
import updateGoalConstituents from './mutations/items/goal/updateConstituents'
import updateItemGoals from './mutations/items/updateGoals'
import prismaGoalItemToGraphQL from 'src/transformers/item/prismaGoalToGraphQL'
import getItemGoals from 'src/dal/item/getGoals'
import updateItemsBlocked from './mutations/items/updateItemsBlocked'
import getBlockedItems from 'src/dal/item/getBlockedItems'
import getBlockedByItems from 'src/dal/item/getBlockedByItems'
import prismaItemToGraphQL from 'src/transformers/item/prismaToGraphQL'
import updateItemIsBlockedBy from './mutations/items/updateItemIsBlockedBy'

const resolvers: Resolvers = {
  EmailAddress: EmailAddressResolver,
  DateTime: DateTimeResolver,
  URL: URLResolver,
  JSONObject: JSONObjectResolver,

  User: {
    clientInvites: queryClientInvites,
  },

  [TypeName.MESSAGE]: {
    childCount: (parent, _, context) =>
      getItemChildCount({
        prisma: context.prisma,
        id: idFromGraphQLToPrisma(parent.id as string),
      }),

    goals: async (parent, _, context) =>
      (
        await getItemGoals({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((goalItem) =>
        prismaGoalItemToGraphQL(goalItem, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),

    blocks: async (parent, _, context) =>
      (
        await getBlockedItems({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((item) =>
        prismaItemToGraphQL(item, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),

    blockedBy: async (parent, _, context) =>
      (
        await getBlockedByItems({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((item) =>
        prismaItemToGraphQL(item, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),
  },

  [TypeName.TASK]: {
    childCount: (parent, _, context) =>
      getItemChildCount({
        prisma: context.prisma,
        id: idFromGraphQLToPrisma(parent.id as string),
      }),

    goals: async (parent, _, context) =>
      (
        await getItemGoals({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((goalItem) =>
        prismaGoalItemToGraphQL(goalItem, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),

    blocks: async (parent, _, context) =>
      (
        await getBlockedItems({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((item) =>
        prismaItemToGraphQL(item, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),

    blockedBy: async (parent, _, context) =>
      (
        await getBlockedByItems({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((item) =>
        prismaItemToGraphQL(item, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),
  },

  [TypeName.QUESTION]: {
    childCount: (parent, _, context) =>
      getItemChildCount({
        prisma: context.prisma,
        id: idFromGraphQLToPrisma(parent.id as string),
      }),

    goals: async (parent, _, context) =>
      (
        await getItemGoals({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((goalItem) =>
        prismaGoalItemToGraphQL(goalItem, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),

    blocks: async (parent, _, context) =>
      (
        await getBlockedItems({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((item) =>
        prismaItemToGraphQL(item, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),

    blockedBy: async (parent, _, context) =>
      (
        await getBlockedByItems({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((item) =>
        prismaItemToGraphQL(item, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),
  },

  [TypeName.INFO]: {
    childCount: (parent, _, context) =>
      getItemChildCount({
        prisma: context.prisma,
        id: idFromGraphQLToPrisma(parent.id as string),
      }),

    goals: async (parent, _, context) =>
      (
        await getItemGoals({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((goalItem) =>
        prismaGoalItemToGraphQL(goalItem, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),

    blocks: async (parent, _, context) =>
      (
        await getBlockedItems({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((item) =>
        prismaItemToGraphQL(item, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),

    blockedBy: async (parent, _, context) =>
      (
        await getBlockedByItems({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((item) =>
        prismaItemToGraphQL(item, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),
  },

  [TypeName.GOAL]: {
    childCount: (parent, _, context) =>
      getItemChildCount({
        prisma: context.prisma,
        id: idFromGraphQLToPrisma(parent.id as string),
      }),

    constituents: async (parent, _, context) => {
      return await listConstituents({
        currentUser: context.user,
        itemId: idFromGraphQLToPrisma(parent.id as string),
        prisma: context.prisma,
      })
    },

    goals: async (parent, _, context) =>
      (
        await getItemGoals({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((goalItem) =>
        prismaGoalItemToGraphQL(goalItem, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),

    blocks: async (parent, _, context) =>
      (
        await getBlockedItems({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((item) =>
        prismaItemToGraphQL(item, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),

    blockedBy: async (parent, _, context) =>
      (
        await getBlockedByItems({
          prisma: context.prisma,
          id: idFromGraphQLToPrisma(parent.id as string),
          currentUserId: context.user.id,
        })
      ).map((item) =>
        prismaItemToGraphQL(item, {
          hasQuestionParent: false,
          currentUser: context.user,
        })
      ),
  },

  Query: {
    myProfile: queryUserProfile,
    item: queryItem,
    publicUsers: queryPublicUsers,
    items: queryItems,
  },

  Mutation: {
    sendMessage,
    amendMessage,
    createTask,
    inviteToClient,
    acceptClientInvite,
    declineClientInvite,
    amendTask,
    nestItem,
    convertItem,
    createQuestion,
    acceptAnswer,
    amendQuestion,
    summarizeItem,
    deleteItemSummary,
    createInfo,
    amendInfo,
    createFile,
    createGoal,
    amendGoal,
    updateGoalConstituents,
    updateItemGoals,
    updateItemsBlocked,
    updateItemIsBlockedBy,
  },
}

export default resolvers
