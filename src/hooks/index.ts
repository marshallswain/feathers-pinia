import { eventLocks } from './hook-event-locks'
import { makeModelInstances } from './hook-model-instances'
import { normalizeFind } from './hook-normalize-find'
import { setPending } from './hook-set-pending'
import { skipGetIfExists } from './hook-skip-get-if-exists'
import { syncStore } from './hook-sync-store'

export { syncStore, setPending, eventLocks, normalizeFind, skipGetIfExists, makeModelInstances }

export const feathersPiniaHooks = (ModelFn: any) => [
  setPending(ModelFn.store),
  eventLocks(ModelFn.store),
  syncStore(ModelFn.store),
  makeModelInstances(ModelFn),
  normalizeFind(),
  skipGetIfExists(ModelFn.store),
]
