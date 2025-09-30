import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Camera, Upload, Zap, Utensils, TrendingUp, RotateCcw } from 'lucide-react'
import Toast from './components/Toast'
import { useAnalysisCache } from './hooks/useAnalysisCache'
import { validateImageFile, getImageInfo } from './utils/imageUtils'
import './App.css'

function App() {
  const [selectedImage, setSelectedImage] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [toasts, setToasts] = useState([])
  const [imageInfo, setImageInfo] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  
  // Hook para cache de análises
  const { getCachedResult, setCachedResult } = useAnalysisCache()

  const addToast = (message, type = 'info') => {
    const id = Date.now()
    const newToast = { id, message, type }
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      try {
        // Validar arquivo de imagem
        validateImageFile(file)
        
        // Obter informações da imagem
        const info = await getImageInfo(file)
        setImageInfo(info)
        
        setSelectedImage(file)
        setAnalysisResult(null)
        
        // Verificar se já existe análise em cache
        const cachedResult = await getCachedResult(file)
        if (cachedResult) {
          setAnalysisResult(cachedResult.result)
          addToast('Resultado encontrado no cache! Análise instantânea.', 'success')
        } else {
          addToast(`Imagem carregada: ${info.width}x${info.height}px`, 'success')
        }
      } catch (error) {
        addToast(error.message, 'error')
        setSelectedImage(null)
        setImageInfo(null)
      }
    }
  }

  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const analyzeImage = async () => {
    if (!selectedImage) {
      addToast('Por favor, selecione uma imagem primeiro.', 'error')
      return
    }
    
    // Verificar cache primeiro
    const cachedResult = await getCachedResult(selectedImage)
    if (cachedResult) {
      setAnalysisResult(cachedResult.result)
      addToast('Resultado encontrado no cache! Análise instantânea.', 'success')
      return
    }
    
    setIsAnalyzing(true)
    addToast('Analisando imagem... Isso pode levar alguns segundos.', 'info')
    
    try {
      const { analyzeFood } = await import('./lib/api.js')
      const result = await analyzeFood(selectedImage)
      
      // Salvar resultado no cache
      await setCachedResult(selectedImage, result)
      
      setAnalysisResult(result)
      addToast(`Análise concluída! ${result.foodItems.length} alimentos identificados.`, 'success')
    } catch (error) {
      console.error('Erro ao analisar imagem:', error)
      let errorMessage = 'Erro na análise da imagem. '
      
      if (error.message.includes('API')) {
        errorMessage += 'Problema de conexão com o serviço de análise.'
      } else if (error.message.includes('Nenhum alimento')) {
        errorMessage += 'Não foi possível identificar alimentos na imagem.'
      } else if (error.message.includes('Key')) {
        errorMessage += 'Problema de autenticação com as APIs.'
      } else {
        errorMessage += 'Por favor, tente novamente.'
      }
      
      addToast(errorMessage, 'error')
      setAnalysisResult(null)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setSelectedImage(null)
    setAnalysisResult(null)
    setImageInfo(null)
    setIsAnalyzing(false)
    addToast('Análise resetada. Você pode adicionar uma nova imagem.', 'info')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              CalorieVision
            </h1>
          </div>
          <p className="text-center text-gray-600 mt-2">
            Tire uma foto da sua comida e descubra instantaneamente quantas calorias ela tem
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          {!selectedImage && (
            <Card className="border-2 border-dashed border-orange-200 bg-white/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-6">
                  <Camera className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Adicione uma foto da sua comida
                </h3>
                <p className="text-gray-600 text-center mb-8 max-w-md">
                  Tire uma foto ou faça upload de uma imagem para começar a análise
                </p>
                <div className="flex gap-4">
                  <Button 
                    onClick={handleCameraCapture}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Tirar Foto
                  </Button>
                  <Button 
                    onClick={handleFileUpload}
                    variant="outline"
                    className="border-2 border-orange-300 text-orange-600 hover:bg-orange-50 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Fazer Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Preview */}
          {selectedImage && (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Imagem Selecionada</span>
                  <Button 
                    onClick={resetAnalysis}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Nova Foto
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <img 
                      src={URL.createObjectURL(selectedImage)} 
                      alt="Comida selecionada" 
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-lg font-semibold mb-4">Pronto para análise!</h4>
                    <p className="text-gray-600 mb-6">
                      Clique no botão abaixo para analisar sua imagem e descobrir as informações nutricionais.
                    </p>
                    <Button 
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Analisar Calorias
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {analysisResult && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Total Calories */}
              <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-6 h-6" />
                    Total de Calorias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold mb-2">
                    {analysisResult.totalCalories}
                  </div>
                  <div className="text-orange-100">
                    calorias estimadas
                  </div>
                  <div className="mt-4 p-3 bg-white/20 rounded-lg">
                    <div className="text-sm text-orange-100 mb-1">Distribuição</div>
                    <div className="flex justify-between text-sm">
                      <span>Carb: {Math.round((analysisResult.macros.carbs * 4 / analysisResult.totalCalories) * 100)}%</span>
                      <span>Prot: {Math.round((analysisResult.macros.protein * 4 / analysisResult.totalCalories) * 100)}%</span>
                      <span>Gord: {Math.round((analysisResult.macros.fat * 9 / analysisResult.totalCalories) * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Food Items */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Alimentos Identificados</CardTitle>
                  <CardDescription>
                    Itens detectados na sua foto com suas respectivas calorias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.foodItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-semibold text-gray-800">{item.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(item.confidence * 100)}% confiança
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{item.portion}</p>
                          {item.macros && (
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>Carb: {item.macros.carbs}g</span>
                              <span>Prot: {item.macros.protein}g</span>
                              <span>Gord: {item.macros.fat}g</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-orange-600">
                            {item.calories} cal
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.round((item.calories / analysisResult.totalCalories) * 100)}% do total
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Resumo Nutricional */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                      <h5 className="font-semibold text-gray-800 mb-3">Resumo Nutricional</h5>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{analysisResult.macros.carbs}g</div>
                          <div className="text-sm text-gray-600">Carboidratos</div>
                          <div className="text-xs text-gray-500">
                            {Math.round((analysisResult.macros.carbs * 4 / analysisResult.totalCalories) * 100)}% cal
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{analysisResult.macros.protein}g</div>
                          <div className="text-sm text-gray-600">Proteínas</div>
                          <div className="text-xs text-gray-500">
                            {Math.round((analysisResult.macros.protein * 4 / analysisResult.totalCalories) * 100)}% cal
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{analysisResult.macros.fat}g</div>
                          <div className="text-sm text-gray-600">Gorduras</div>
                          <div className="text-xs text-gray-500">
                            {Math.round((analysisResult.macros.fat * 9 / analysisResult.totalCalories) * 100)}% cal
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="text-center bg-white/50 backdrop-blur-sm border-blue-200">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Análise Instantânea</h3>
                <p className="text-sm text-gray-600">
                  Resultados em segundos com IA avançada
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white/50 backdrop-blur-sm border-green-200">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">500+ Alimentos</h3>
                <p className="text-sm text-gray-600">
                  Reconhece pratos e ingredientes diversos
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-white/50 backdrop-blur-sm border-purple-200">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Informações Completas</h3>
                <p className="text-sm text-gray-600">
                  Calorias, macros e porções detalhadas
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Toast notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

export default App
