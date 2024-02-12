import { copyStrict } from 'fast-copy'
import { isRef, ref, unref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { diff } from '../utils/utils'
import type { AnyData, DiffDefinition } from '../types'

type AnyRef<D> = Ref<D> | ComputedRef<D>

interface UseBackupOptions<D> {
  onlyProps?: keyof D
  idField?: keyof D
}

/**
 * Provides a backup of the current instance, and methods to save and restore it.
 * The `save` method will diff the current instance with the backup. Any values in the new
 * instance that are different in the old instance will be passed to the save method as data.
 */
export function useBackup<D extends AnyData>(data: AnyRef<D>, options?: UseBackupOptions<D>) {
  const backup = ref<any>(null)

  // automatically update if the record changes
  watch(data, async (val: any) => {
    if (!data)
      return

    const idField = options?.idField
    const id = idField ? val?.[idField] : val?.id
    const backupId = idField ? backup.value?.[idField] : backup.value?.id
    if (id !== backupId)
      backup.value = copyStrict(val)
  }, { immediate: true })

  /**
   * Diff the current instance with the backup. Any values in the new instance that are
   * different in the old instance will be passed to the save method as data.
   */
  async function save() {
    const toDiff = unref(data as any)
    const diffData = diff(backup.value, toDiff, options?.onlyProps as DiffDefinition)
    // if any keys were different...
    if (Object.keys(diffData).length) {
      // save the diff
      try {
        const withUpdates = await data.value.save({ data: diffData })

        // update the backup to match the new instance
        backup.value = copyStrict(withUpdates)
      }
      catch (error) {
        console.error('could not save', error)
        throw error
      }
    }
    // if nothing changed, return the original record
    else { return toDiff }
  }

  function restore(currentInstance: any) {
    if (backup.value) {
      const target = isRef(currentInstance) ? currentInstance.value : currentInstance
      Object.assign(target, backup.value)
    }
    return currentInstance
  }

  return { data, backup, save, restore }
}
