// Utilitários para processamento de imagem

// Comprimir imagem para reduzir tamanho do upload
export const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calcular novas dimensões mantendo proporção
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, width, height)

      // Converter para blob
      canvas.toBlob(resolve, 'image/jpeg', quality)
    }

    img.src = URL.createObjectURL(file)
  })
}

// Validar se o arquivo é uma imagem válida
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Formato de arquivo não suportado. Use JPEG, PNG ou WebP.')
  }
  
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. O tamanho máximo é 10MB.')
  }
  
  return true
}

// Obter informações da imagem
export const getImageInfo = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        size: file.size,
        type: file.type,
        name: file.name
      })
    }
    
    img.onerror = () => {
      reject(new Error('Não foi possível carregar a imagem'))
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Criar thumbnail da imagem
export const createThumbnail = (file, size = 150) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = size
      canvas.height = size

      // Calcular crop para manter proporção quadrada
      const { width, height } = img
      const minDimension = Math.min(width, height)
      const startX = (width - minDimension) / 2
      const startY = (height - minDimension) / 2

      ctx.drawImage(
        img,
        startX, startY, minDimension, minDimension,
        0, 0, size, size
      )

      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    }

    img.src = URL.createObjectURL(file)
  })
}

// Converter blob para base64
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
