import {
  AddIcon,
  Divider,
  Loader,
  Grid,
  IconButton,
  useTheme,
} from '@contag/ui'
import { GetItemsQueryVariables } from 'src/generated/graphql'
import ItemForm from '../../../../Item/Input/Form'
import { ChangeActiveItem, ChangeFilters, ChangeSort } from '../../HomePage'
import { useLayoutEffect, useRef, useState } from 'react'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import ItemsFeedContext from './Context'
import SortControls from './SortControls'
import FilterControls from './FilterControls'
import ItemCard from 'src/Item/Card'
import FeedContainer from '../Container'
import useGetItems from 'src/queries/getItems'

const ItemsFeed = ({
  id,
  variables,
  parentFeedVariables,
  childFeedVariables,
  activeItemId,
  changeActiveItem,
  changeSort,
  changeFilters,
  last,
}: {
  id: string
  variables: GetItemsQueryVariables
  parentFeedVariables: GetItemsQueryVariables | null
  childFeedVariables: GetItemsQueryVariables | null
  activeItemId: null | string
  changeActiveItem: ChangeActiveItem
  changeSort: ChangeSort
  changeFilters: ChangeFilters
  last: boolean
}) => {
  const { items } = useGetItems(variables)
  const itemContainerRef = useRef<HTMLDivElement>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const theme = useTheme()

  useLayoutEffect(() => {
    if (items && items.length === 0 && !isAddingItem) {
      setIsAddingItem(true)
    }
  }, [items])

  return (
    <FeedContainer scrollIntoViewOnMount={last} id={id}>
      <ItemsFeedContext.Provider
        value={{ variables, parentFeedVariables, childFeedVariables }}
      >
        <Grid
          ref={itemContainerRef}
          container
          justifyContent='center'
          direction='column'
          spacing={2}
        >
          <Grid display='flex' sx={{ flexWrap: 'wrap' }}>
            <SortControls changeSort={changeSort} variables={variables} />
            <FilterControls
              changeFilters={changeFilters}
              filters={variables.filters}
            />
            {!isAddingItem && variables.filters.parentId ? (
              <IconButton
                aria-label='add item'
                color='primary'
                sx={{ marginLeft: 'auto', marginRight: theme.spacing(1) }}
                onClick={() => setIsAddingItem(true)}
              >
                <AddIcon />
              </IconButton>
            ) : null}
          </Grid>

          {isAddingItem && variables.filters.parentId ? (
            <>
              <Divider />
              <ItemForm
                parentId={variables.filters.parentId}
                onClose={() => {
                  setIsAddingItem(false)
                }}
              />
            </>
          ) : null}

          <Divider />

          {!items ? (
            <Loader />
          ) : (
            <Droppable
              droppableId={variables.filters.parentId || 'root'}
              isCombineEnabled
              isDropDisabled={!variables.filters.parentId}
            >
              {(provided) => (
                <div ref={provided.innerRef}>
                  {items.map((item, index) => {
                    const setItemAsActive = () => {
                      const selection = window.getSelection()

                      if (selection?.type === 'Range') {
                        return
                      }

                      changeActiveItem(item.id)
                    }

                    return (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <ItemCard
                            item={item}
                            active={item.id === activeItemId}
                            onClick={setItemAsActive}
                            dnd={{
                              draggableProps: provided.draggableProps,
                              dragHandleProps: provided.dragHandleProps,
                              isDropTarget: !!snapshot.combineTargetFor,
                              ref: provided.innerRef,
                            }}
                          />
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </Grid>
      </ItemsFeedContext.Provider>
    </FeedContainer>
  )
}

export default ItemsFeed
