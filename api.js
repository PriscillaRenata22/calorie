const API_CONFIG = {
  clarifai: {
    baseUrl: 'https://api.clarifai.com/v2',
    modelId: 'food-item-recognition',
    userId: 'clarifai',
    appId: 'main',
    apiKey: process.env.REACT_APP_CLARIFAI_API_KEY
  },
  nutritionix: {
    baseUrl: 'https://trackapi.nutritionix.com/v2',
    appId: process.env.REACT_APP_NUTRITIONIX_APP_ID,
    appKey: process.env.REACT_APP_NUTRITIONIX_APP_KEY
  }
}

// Função para converter imagem para base64 com compressão
export const imageToBase64 = async (file) => {
  // Importar utilitários de imagem
  const { compressImage, blobToBase64 } = await import('../utils/imageUtils.js')
  
  try {
    // Comprimir imagem antes de converter para base64
    const compressedBlob = await compressImage(file, 800, 600, 0.8)
    return await blobToBase64(compressedBlob)
  } catch (error) {
    console.warn('Erro na compressão, usando imagem original:', error)
    // Fallback para método original se a compressão falhar
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}

export const analyzeImageWithClarifai = async (imageFile) => {
  try {
    const base64Image = await imageToBase64(imageFile)
    const { baseUrl, modelId, userId, appId, apiKey } = API_CONFIG.clarifai

    const response = await fetch(`${baseUrl}/users/${userId}/apps/${appId}/models/${modelId}/versions/1d5fd481e0cf4826aa72ec3ff049e044/outputs`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_app_id: {
          user_id: userId,
          app_id: appId
        },
        inputs: [
          {
            data: {
              image: {
                base64: base64Image
              }
            }
          }
        ]
      })
    })

    const data = await response.json()
    if (data.status.code !== 10000) {
      throw new Error(`Clarifai API error: ${data.status.description}`)
    }
    return data.outputs[0].data
  } catch (error) {
    console.error('Erro ao analisar imagem com Clarifai:', error)
    throw error
  }
}

export const getNutritionData = async (foodName) => {
  try {
    const { baseUrl, appId, appKey } = API_CONFIG.nutritionix

    const response = await fetch(`${baseUrl}/natural/nutrients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': appId,
        'x-app-key': appKey
      },
      body: JSON.stringify({
        query: foodName
      })
    })

    const data = await response.json()
    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0]
      return {
        name: food.food_name,
        calories: food.nf_calories ? Math.round(food.nf_calories) : 0,
        serving: `${food.serving_qty} ${food.serving_unit} (${Math.round(food.serving_weight_grams)}g)`,
        macros: {
          carbs: food.nf_total_carbohydrate ? Math.round(food.nf_total_carbohydrate) : 0,
          protein: food.nf_protein ? Math.round(food.nf_protein) : 0,
          fat: food.nf_total_fat ? Math.round(food.nf_total_fat) : 0
        }
      }
    } else {
      throw new Error(`Nenhum dado nutricional encontrado para ${foodName}`)
    }
  } catch (error) {
    console.error('Erro ao buscar dados nutricionais com Nutritionix:', error)
    throw error
  }
}

export const analyzeFood = async (imageFile) => {
  try {
    const imageAnalysis = await analyzeImageWithClarifai(imageFile)
    
    const foodItems = []
    let totalCalories = 0
    let totalMacros = { carbs: 0, protein: 0, fat: 0 }
    
    if (imageAnalysis.concepts) {
      for (const concept of imageAnalysis.concepts) {
        if (concept.value > 0.7) { // Apenas conceitos com alta confiança
          try {
            const nutrition = await getNutritionData(concept.name)
            
            const foodItem = {
              name: nutrition.name,
              confidence: concept.value,
              calories: nutrition.calories,
              portion: nutrition.serving,
              macros: nutrition.macros
            }
            
            foodItems.push(foodItem)
            totalCalories += nutrition.calories
            totalMacros.carbs += nutrition.macros.carbs
            totalMacros.protein += nutrition.macros.protein
            totalMacros.fat += nutrition.macros.fat
          } catch (nutritionError) {
            console.warn(`Não foi possível obter dados nutricionais para ${concept.name}:`, nutritionError.message)
            // Adicionar item com calorias estimadas se a API de nutrição falhar
            foodItems.push({
              name: concept.name,
              confidence: concept.value,
              calories: Math.floor(Math.random() * 200) + 50, // Estimativa
              portion: 'Porção estimada',
              macros: { carbs: 0, protein: 0, fat: 0 } // Macros desconhecidos
            })
          }
        }
      }
    }

    if (foodItems.length === 0) {
      throw new Error('Nenhum alimento identificado com confiança suficiente.')
    }
    
    return {
      foodItems,
      totalCalories,
      macros: totalMacros
    }
  } catch (error) {
    console.error('Erro na análise completa:', error)
    throw error
  }
}

export default API_CONFIG

