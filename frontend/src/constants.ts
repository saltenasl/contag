import { ItemsSort, ItemsSortOrder, ItemsSortType } from './generated/graphql'

export const isEmailRegex =
  // eslint-disable-next-line no-useless-escape
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ // from https://emailregex.com

export const DEFAULT_USER_FEED_SORT: ItemsSort = {
  type: ItemsSortType.CreatedAt,
  order: ItemsSortOrder.OldestFirst,
}

export const DEFAULT_ITEM_FEED_SORT: ItemsSort = {
  type: ItemsSortType.CreatedAt,
  order: ItemsSortOrder.NewestFirst,
}
