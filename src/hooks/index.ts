import { unrefQuery } from './0-prepare-query'
import { setPending } from './1-set-pending'
import { eventLocks } from './2-event-locks'
import { syncStore } from './3-sync-store'
import { makeModelInstances } from './4-model-instances'
import { handleFindSsr } from './5-handle-find-ssr'
import { normalizeFind } from './6-normalize-find'
import { skipGetIfExists } from './7-skip-get-if-exists'
import { patchDiffing } from './8-patch-diffs'

export { syncStore, setPending, eventLocks, normalizeFind, skipGetIfExists, makeModelInstances }

export const feathersPiniaHooks = () => [
  unrefQuery(),
  setPending(),
  eventLocks(),
  syncStore(),
  makeModelInstances(),
  handleFindSsr(),
  normalizeFind(),
  skipGetIfExists(),
  patchDiffing(),
]
