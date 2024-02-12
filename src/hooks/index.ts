import { unrefQuery } from './0-prepare-query.js'
import { setPending } from './1-set-pending.js'
import { eventLocks } from './2-event-locks.js'
import { syncStore } from './3-sync-store.js'
import { makeModelInstances } from './4-model-instances.js'
import { handleFindSsr } from './5-handle-find-ssr.js'
import { normalizeFind } from './6-normalize-find.js'
import { skipGetIfExists } from './7-skip-get-if-exists.js'
import { patchDiffing } from './8-patch-diffs.js'
import { handleQidCache } from './9-ssr-qid-cache.js'

export { syncStore, setPending, eventLocks, normalizeFind, skipGetIfExists, makeModelInstances }

export function feathersPiniaHooks() {
  return [
    unrefQuery(),
    setPending(),
    eventLocks(),
    syncStore(),
    makeModelInstances(),
    handleFindSsr(),
    normalizeFind(),
    skipGetIfExists(),
    patchDiffing(),
    handleQidCache(),
  ]
}
