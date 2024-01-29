// *_INCLUDE consts cannot be typed with Prisma.ItemInclude otherwise the output of query produces all of the included types as possibly undefined (whereas some of them clearly cannot be so as they're required fields)
export const ITEM_INCLUDE = {
  author: true,
  info: true,
  message: true,
  task: true,
  goal: {
    include: { constituents: true },
  },
  question: {
    include: {
      answer: {
        include: {
          message: true,
          task: true,
          question: true,
          summary: true,
          info: true,
        },
      },
    },
  },
  answerFor: true,
  addressedTo: {
    include: {
      user: true,
    },
  },
  sharedWith: {
    include: {
      user: true,
    },
  },
  actionExpectation: true,
  summary: true,
  attachments: true,
  goals: {
    include: {
      item: true,
    },
  },
  blocks: true,
  isBlockedBy: true,
}
