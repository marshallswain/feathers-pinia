import { eventLocks } from './hook-event-locks'
import { handleFindSsr } from './hook-handle-find-ssr'
import { makeModelInstances } from './hook-model-instances'
import { normalizeFind } from './hook-normalize-find'
import { patchDiffing } from './hook-patch-diffs'
import { setPending } from './hook-set-pending'
import { skipGetIfExists } from './hook-skip-get-if-exists'
import { syncStore } from './hook-sync-store'

export { syncStore, setPending, eventLocks, normalizeFind, skipGetIfExists, makeModelInstances }

export const feathersPiniaHooks = (Model: any) => [
  setPending(Model.store),
  eventLocks(Model.store),
  syncStore(Model.store),
  makeModelInstances(Model),
  handleFindSsr(Model.store),
  normalizeFind(),
  skipGetIfExists(Model.store),
  patchDiffing(Model.store),
]
