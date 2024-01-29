import { Grid, useTheme } from '@contag/ui'
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  GetItemsQueryVariables,
  ItemsSort,
  ItemsFilters,
} from 'src/generated/graphql'
import ItemsFeed from './Feed/Items/Feed'
import { DragDropContext } from 'react-beautiful-dnd'
import { useMutation } from '@apollo/client'
import NEST_ITEM from 'src/mutations/nestItem'
import cacheMoveItem from 'src/apollo/cache/item/move'
import { DEFAULT_ITEM_FEED_SORT } from 'src/constants'
import cacheUpdateItemAfterDnd from 'src/apollo/cache/item/updateAfterDnd'
import PublicUsersFeed from './Feed/PublicUsers'

enum FeedType {
  PUBLIC_USERS,
  ITEMS,
}

type PublicUsersFeed = {
  feedId: string
  type: FeedType.PUBLIC_USERS
  variables?: never
  activeItemId: null | string
}

type ItemFeed = {
  feedId: string
  type: FeedType.ITEMS
  variables: GetItemsQueryVariables
  activeItemId: null | string
}

type OpenFeed = PublicUsersFeed | ItemFeed

export type ChangeActiveItem = (activeItemId: string) => void

export type ChangeSort = (sort: ItemsSort) => void
export type ChangeFilters = (filters: ItemsFilters) => void

export const ROOT_FEED_ID = 'root'

const USER_FEED: OpenFeed = {
  feedId: ROOT_FEED_ID,
  type: FeedType.PUBLIC_USERS,
  activeItemId: null,
}

export const DEFAULT_FEEDS: OpenFeed[] = [USER_FEED]

export const getUserFeedURL = (userId: string) => {
  const feedConfig = [
    { ...USER_FEED, activeItemId: userId },
    {
      feedId: userId,
      type: FeedType.ITEMS,
      variables: {
        filters: { parentId: userId },
        sort: DEFAULT_ITEM_FEED_SORT,
      },
      activeItemId: null,
    },
  ]

  return `/?${FEEDS_QUERY_PARAM}=${JSON.stringify(feedConfig)}`
}

const isItemFeed = (feed: OpenFeed | undefined): feed is ItemFeed =>
  feed?.type === FeedType.ITEMS

const getItemFeedByParentId = (
  feeds: OpenFeed[],
  parentId: string
): ItemFeed | undefined => {
  const feed = feeds.find(
    (feed) => feed.variables?.filters.parentId === parentId
  )

  return isItemFeed(feed) ? feed : undefined
}

const FEEDS_QUERY_PARAM = 'feeds'

const HomePage = () => {
  const theme = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [nestItem] = useMutation(NEST_ITEM)

  const feedsParam = searchParams.get(FEEDS_QUERY_PARAM)

  const setFeeds = (feeds: OpenFeed[]) => {
    setSearchParams({ feeds: JSON.stringify(feeds) })
  }

  const feeds =
    feedsParam === null ? DEFAULT_FEEDS : (JSON.parse(feedsParam) as OpenFeed[])

  useEffect(() => {
    // this is a quick hack to make feeds reset when you're clicking on the home page
    if (feedsParam === null) {
      setFeeds(DEFAULT_FEEDS)
    }
  }, [feedsParam])

  const createChangeActiveItem =
    (id: number): ChangeActiveItem =>
    (activeItemId) => {
      setFeeds([
        ...(id === 0 ? [] : feeds.slice(0, id)),
        {
          ...feeds[id],
          activeItemId,
        },
        {
          feedId: activeItemId,
          type: FeedType.ITEMS,
          variables: {
            filters: { parentId: activeItemId },
            sort: DEFAULT_ITEM_FEED_SORT,
          },
          activeItemId: null,
        },
      ])
    }

  const createChangeSort =
    (feedId: string): ChangeSort =>
    (sort: ItemsSort) => {
      setFeeds(
        feeds.map((feed) =>
          feed.feedId === feedId && feed.type === FeedType.ITEMS
            ? {
                ...feed,
                variables: {
                  ...feed.variables,
                  sort,
                },
              }
            : feed
        )
      )
    }

  const createChangeFilters =
    (feedId: string): ChangeFilters =>
    (filters: ItemsFilters) => {
      setFeeds(
        feeds.map((feed) =>
          feed.feedId === feedId && feed.type === FeedType.ITEMS
            ? {
                ...feed,
                variables: {
                  ...feed.variables,
                  filters,
                },
              }
            : feed
        )
      )
    }

  return (
    <Grid
      container
      sx={{
        py: theme.spacing(2),
        flexWrap: 'nowrap',
        alignItems: 'flex-start',
        flexGrow: 1,
      }}
    >
      <DragDropContext
        onDragEnd={(dragResult) => {
          if (dragResult.reason !== 'DROP') {
            return
          }

          const itemId = dragResult.draggableId
          const movedFromFeedParentId = dragResult.source.droppableId

          const movedFromFeed = getItemFeedByParentId(
            feeds,
            movedFromFeedParentId
          )

          if (!movedFromFeed) {
            console.warn('Moved from feed not found!')
            return
          }

          if (dragResult.combine) {
            const movedToFeedParentId = dragResult.combine.draggableId

            nestItem({
              variables: {
                input: {
                  itemId,
                  newParentId: movedToFeedParentId,
                },
              },
              update(cache, result) {
                if (result.data?.nestItem?.success === true) {
                  const movedToFeed = feeds.find(
                    (feed) =>
                      isItemFeed(feed) &&
                      feed.variables.filters.parentId === movedToFeedParentId
                  )

                  cacheMoveItem(cache, {
                    movedFromFeedVariables: movedFromFeed.variables,
                    movedToFeedVariables: movedToFeed?.variables,
                    itemId,
                  })

                  cacheUpdateItemAfterDnd(cache, {
                    itemId,
                    oldParentId: movedFromFeedParentId,
                    newParentId: movedToFeedParentId,
                  })
                }
              },
            })
          }

          if (dragResult.destination) {
            const { droppableId: movedToFeedParentId } = dragResult.destination

            if (
              dragResult.destination.droppableId ===
              dragResult.source.droppableId
            ) {
              return
            }

            const movedToFeed = getItemFeedByParentId(
              feeds,
              movedToFeedParentId
            )

            nestItem({
              variables: {
                input: {
                  itemId,
                  newParentId: movedToFeedParentId,
                },
              },
              update(cache, result) {
                if (result.data?.nestItem?.success === true) {
                  cacheMoveItem(cache, {
                    movedFromFeedVariables: movedFromFeed.variables,
                    movedToFeedVariables: movedToFeed?.variables,
                    itemId,
                  })

                  cacheUpdateItemAfterDnd(cache, {
                    itemId,
                    oldParentId: movedFromFeedParentId,
                    newParentId: movedToFeedParentId,
                  })
                }
              },
            })
          }
        }}
      >
        {/* since grid is nowrap we can't use justifyContent: center, so we're using these two Grid items that grow to center the feeds */}
        <Grid flexGrow={2}></Grid>
        {feeds.map(({ feedId, variables, activeItemId, type }, index) =>
          type === FeedType.ITEMS ? (
            <ItemsFeed
              key={feedId}
              id={feedId}
              variables={variables}
              parentFeedVariables={feeds[index - 1]?.variables ?? null}
              childFeedVariables={feeds[index + 1]?.variables ?? null}
              activeItemId={activeItemId}
              changeActiveItem={createChangeActiveItem(index)}
              changeSort={createChangeSort(feedId)}
              changeFilters={createChangeFilters(feedId)}
              last={index + 1 === feeds.length}
            />
          ) : (
            <PublicUsersFeed
              key={feedId}
              id={feedId}
              activeItemId={activeItemId}
              changeActiveItem={createChangeActiveItem(index)}
            />
          )
        )}
        {/* since grid is nowrap we can't use justifyContent: center, so we're using these two Grid items that grow to center the feeds */}
        <Grid flexGrow={2}></Grid>
      </DragDropContext>
    </Grid>
  )
}

export default HomePage
