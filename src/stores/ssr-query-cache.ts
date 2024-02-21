import { reactive } from 'vue'
import type { AnyData } from '../types'

export function useSsrQueryCache() {
  const resultsByQid = reactive<Record<string, AnyData>>({})

  function getQid(qid: string) {
    return resultsByQid[qid]
  }
  function setQid(qid: string, data: any) {
    resultsByQid[qid] = data
  }
  function clearQid(qid: string) {
    delete resultsByQid[qid]
  }
  function clearAllQids() {
    Object.keys(resultsByQid).forEach((qid) => {
      clearQid(qid)
    })
  }

  return { resultsByQid, getQid, setQid, clearQid, clearAllQids }
}
