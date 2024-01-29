# About factories

Some of the factories are weird and have a wrapper on top of them. The purpose of the wrapper is to cache the item entries and allow access to them after they've been created (identified by `id` field).

We need items from the cache to be able to reference those objects when mocking requests. As an example imagine the flow:

1. User creates a new task
2. User navigates through UI and updates the task

At the 2nd point we only get "id" of the aforementioned task as the input of the graphql mutation. So we lack critical piece of information - the task itself, we want to amend only some fields of the task and the others to stay the same. Furthermore, we want to save that updated task, so if there would be further references to it - it is up to date.

There are two types of functions factories expose:

- `build` and `buildList` functions - both of them retrieves item from the cache if `id` is passed. If there are extra props passed - it will also override the original entry with them and persist the updated item to the cache.
- `getXItem` - retrieves the item from the cache by id.
