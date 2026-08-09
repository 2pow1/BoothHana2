import { useCallback, useEffect, useState } from 'react'

export function useRemote<T>(load: () => Promise<T>, dependencies: readonly unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await load())
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error('데이터를 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, loading, error, reload, setData }
}
