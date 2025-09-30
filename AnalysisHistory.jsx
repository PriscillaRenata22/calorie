import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { History, Trash2, Download, Calendar } from 'lucide-react'

const AnalysisHistory = ({ onSelectAnalysis }) => {
  const [history, setHistory] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Carregar histórico do localStorage
    const savedHistory = localStorage.getItem('calorievision-history')
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
      }
    }
  }, [])

  const saveToHistory = (analysisResult, imageInfo) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      result: analysisResult,
      imageInfo: imageInfo,
      totalCalories: analysisResult.totalCalories,
      foodCount: analysisResult.foodItems.length
    }

    const updatedHistory = [newEntry, ...history].slice(0, 20) // Manter apenas 20 entradas
    setHistory(updatedHistory)
    
    // Salvar no localStorage
    try {
      localStorage.setItem('calorievision-history', JSON.stringify(updatedHistory))
    } catch (error) {
      console.error('Erro ao salvar histórico:', error)
    }
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('calorievision-history')
  }

  const deleteEntry = (id) => {
    const updatedHistory = history.filter(entry => entry.id !== id)
    setHistory(updatedHistory)
    localStorage.setItem('calorievision-history', JSON.stringify(updatedHistory))
  }

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `calorievision-history-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Expor função para componentes pais
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    saveToHistory
  }))

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        className="fixed bottom-4 right-4 z-40 bg-white/90 backdrop-blur-sm shadow-lg"
      >
        <History className="w-4 h-4 mr-2" />
        Histórico ({history.length})
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Análises
            </CardTitle>
            <CardDescription>
              {history.length} análises salvas
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {history.length > 0 && (
              <>
                <Button onClick={exportHistory} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button onClick={clearHistory} variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </>
            )}
            <Button onClick={() => setIsVisible(false)} variant="outline" size="sm">
              Fechar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[60vh]">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma análise no histórico ainda.</p>
              <p className="text-sm">Suas análises aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <Card key={entry.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteEntry(entry.id)
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          {entry.totalCalories} cal
                        </Badge>
                        <Badge variant="outline">
                          {entry.foodCount} alimentos
                        </Badge>
                      </div>
                      <Button
                        onClick={() => {
                          onSelectAnalysis(entry.result)
                          setIsVisible(false)
                        }}
                        size="sm"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div className="flex flex-wrap gap-2">
                        {entry.result.foodItems.slice(0, 3).map((food, idx) => (
                          <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {food.name}
                          </span>
                        ))}
                        {entry.result.foodItems.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{entry.result.foodItems.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {entry.imageInfo && (
                      <div className="text-xs text-gray-500 mt-2">
                        Imagem: {entry.imageInfo.width}x{entry.imageInfo.height}px
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalysisHistory
