import { eventLocks } from './hook-event-locks'
import { makeModelInstances } from './hook-model-instances'
import { normalizeFind } from './hook-normalize-find'
import { patchDiffing } from './hook-patch-diffs'
import { setPending } from './hook-set-pending'
import { skipGetIfExists } from './hook-skip-get-if-exists'
import { syncStore } from './hook-sync-store'

export { syncStore, setPending, eventLocks, normalizeFind, skipGetIfExists, makeModelInstances }

export const feathersPiniaHooks = (ModelFn: any) => [
  setPending(ModelFn),
  eventLocks(ModelFn),
  syncStore(ModelFn),
  makeModelInstances(ModelFn),
  normalizeFind(),
  skipGetIfExists(ModelFn),
  patchDiffing(ModelFn),
]
