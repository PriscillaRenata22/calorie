import { useState, useCallback } from 'react'

// Hook para cache de análises de imagem
export const useAnalysisCache = () => {
  const [cache, setCache] = useState(new Map())

  // Gerar hash simples da imagem para usar como chave
  const generateImageHash = useCallback(async (imageFile) => {
    const arrayBuffer = await imageFile.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }, [])

  // Verificar se existe resultado em cache
  const getCachedResult = useCallback(async (imageFile) => {
    try {
      const hash = await generateImageHash(imageFile)
      return cache.get(hash)
    } catch (error) {
      console.warn('Erro ao gerar hash da imagem:', error)
      return null
    }
  }, [cache, generateImageHash])

  // Salvar resultado no cache
  const setCachedResult = useCallback(async (imageFile, result) => {
    try {
      const hash = await generateImageHash(imageFile)
      setCache(prevCache => {
        const newCache = new Map(prevCache)
        newCache.set(hash, {
          result,
          timestamp: Date.now()
        })
        
        // Limitar cache a 50 itens para evitar uso excessivo de memória
        if (newCache.size > 50) {
          const oldestKey = newCache.keys().next().value
          newCache.delete(oldestKey)
        }
        
        return newCache
      })
    } catch (error) {
      console.warn('Erro ao salvar no cache:', error)
    }
  }, [generateImageHash])

  // Limpar cache
  const clearCache = useCallback(() => {
    setCache(new Map())
  }, [])

  // Obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    return {
      size: cache.size,
      entries: Array.from(cache.entries()).map(([hash, data]) => ({
        hash: hash.substring(0, 8) + '...',
        timestamp: new Date(data.timestamp).toLocaleString(),
        foodItems: data.result.foodItems.length
      }))
    }
  }, [cache])

  return {
    getCachedResult,
    setCachedResult,
    clearCache,
    getCacheStats
  }
}
