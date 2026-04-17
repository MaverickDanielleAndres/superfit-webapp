import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { requestApi } from '@/lib/api/client'
import type { FoodItem, MealSlot } from '@/types'

type SourceType = 'upload' | 'camera'

export type AnalyzerState = 'idle' | 'streaming' | 'captured' | 'analyzing' | 'results' | 'error'

export interface EditableAnalyzedFood {
  id: string
  name: string
  estimatedGrams: number
  portionDescription: string
  confidence: 'high' | 'medium' | 'low'
  source: 'usda' | 'cache'
  item: FoodItem
  draftGrams: number
  draftMacros: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}

interface ScanApiFood {
  name: string
  estimatedGrams: number
  portionDescription: string
  confidence: 'high' | 'medium' | 'low'
  source: 'usda' | 'cache'
  item: FoodItem
  macros: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
}

interface ScanApiResponse {
  isFood: boolean
  message?: string
  foods: ScanApiFood[]
  mealSlot?: MealSlot
  scanLogId?: string | null
  sourceType?: SourceType
  telemetry?: {
    detectMs: number
    resolveMs: number
    totalMs: number
  }
}

interface UploadResponse {
  path: string
  url: string
  sourceType: SourceType
}

interface SaveContext {
  addFoodEntry: (
    foodItem: FoodItem,
    mealSlot: MealSlot,
    quantity: number,
    options?: {
      imageUrl?: string
      imageSource?: 'manual_upload' | 'ai_scan' | 'food_api'
      isAiGenerated?: boolean
      scanMetadata?: Record<string, unknown>
    },
  ) => Promise<void>
}

interface UseFoodImageAnalyzerOptions {
  initialMealSlot?: MealSlot
  debounceMs?: number
}

function logTelemetry(eventName: string, payload: Record<string, unknown>) {
  if (typeof console === 'undefined') return
  console.info('[analyzer-telemetry]', eventName, payload)
}

export function useFoodImageAnalyzer(options?: UseFoodImageAnalyzerOptions) {
  const initialMealSlot = options?.initialMealSlot || 'breakfast'
  const debounceMs = options?.debounceMs || 2_000

  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastScanRef = useRef(0)

  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [state, setState] = useState<AnalyzerState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [scanImageDataUrl, setScanImageDataUrl] = useState<string | null>(null)
  const [foods, setFoods] = useState<EditableAnalyzedFood[]>([])
  const [selectedMealSlot, setSelectedMealSlot] = useState<MealSlot>(initialMealSlot)
  const [scanLogId, setScanLogId] = useState<string | null>(null)
  const [scanSourceType, setScanSourceType] = useState<SourceType>('upload')
  const [isSaving, setIsSaving] = useState(false)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop()
      }
      streamRef.current = null
    }
  }, [])

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
      })

      streamRef.current = mediaStream
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setState('streaming')
      return true
    } catch {
      setState('error')
      setError('Camera access denied. You can upload a photo instead.')
      return false
    }
  }, [])

  const resetScanner = useCallback(() => {
    setError(null)
    setFoods([])
    setScanImageDataUrl(null)
    setState('idle')
    setScanLogId(null)
    setSelectedMealSlot(initialMealSlot)
  }, [initialMealSlot])

  const closeScanner = useCallback(() => {
    stopCamera()
    setIsScannerOpen(false)
    resetScanner()
  }, [resetScanner, stopCamera])

  const openScanner = useCallback(async () => {
    resetScanner()
    setIsScannerOpen(true)
    await startCamera()
  }, [resetScanner, startCamera])

  const analyzeImageData = useCallback(
    async (imageData: string, sourceType: SourceType) => {
      const analyzeStartedAt = performance.now()
      const now = Date.now()
      if (now - lastScanRef.current < debounceMs) {
        toast.error(`Please wait ${Math.max(1, Math.ceil(debounceMs / 1000))} seconds before running another scan.`)
        return
      }

      lastScanRef.current = now
      setError(null)
      setScanSourceType(sourceType)
      setScanImageDataUrl(imageData)
      setState('analyzing')

      try {
        const requestStartedAt = performance.now()
        const response = await requestApi<ScanApiResponse>('/api/v1/nutrition/ai-scan', {
          method: 'POST',
          body: JSON.stringify({
            imageData,
            sourceType,
          }),
          headers: {
            'x-auto-toast': 'off',
          },
        })
        const requestMs = Number((performance.now() - requestStartedAt).toFixed(2))

        if (!response.data.isFood || !response.data.foods.length) {
          setState('error')
          setError(response.data.message || 'No food detected')
          logTelemetry('scan-no-food', {
            sourceType,
            requestMs,
            totalClientAnalyzeMs: Number((performance.now() - analyzeStartedAt).toFixed(2)),
            serverTelemetry: response.data.telemetry || null,
          })
          return
        }

        setFoods(
          response.data.foods.map((food, index) => ({
            id: `${food.item.id}-${index}`,
            name: food.name,
            estimatedGrams: food.estimatedGrams,
            portionDescription: food.portionDescription,
            confidence: food.confidence,
            source: food.source,
            item: food.item,
            draftGrams: food.estimatedGrams,
            draftMacros: {
              calories: food.macros.calories,
              protein: food.macros.protein,
              carbs: food.macros.carbs,
              fat: food.macros.fat,
              fiber: food.macros.fiber,
            },
          })),
        )
        setSelectedMealSlot(response.data.mealSlot || initialMealSlot)
        setScanLogId(response.data.scanLogId || null)
        setState('results')
        logTelemetry('scan-success', {
          sourceType,
          detectedFoods: response.data.foods.length,
          requestMs,
          totalClientAnalyzeMs: Number((performance.now() - analyzeStartedAt).toFixed(2)),
          serverTelemetry: response.data.telemetry || null,
        })
      } catch (scanError) {
        setState('error')
        setError(scanError instanceof Error ? scanError.message : 'Unable to analyze this image right now.')
        logTelemetry('scan-error', {
          sourceType,
          totalClientAnalyzeMs: Number((performance.now() - analyzeStartedAt).toFixed(2)),
          detail: scanError instanceof Error ? scanError.message : 'Unknown scan error',
        })
      }
    },
    [debounceMs, initialMealSlot],
  )

  const captureFrame = useCallback(async () => {
    const captureStartedAt = performance.now()
    const video = videoRef.current
    if (!video) return

    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    const maxWidth = 1600
    const ratio = width > maxWidth ? maxWidth / width : 1
    const targetWidth = Math.floor(width * ratio)
    const targetHeight = Math.floor(height * ratio)

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      toast.error('Unable to capture image from camera.')
      return
    }

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6)
    logTelemetry('capture-ready', {
      width: targetWidth,
      height: targetHeight,
      captureMs: Number((performance.now() - captureStartedAt).toFixed(2)),
    })
    await analyzeImageData(dataUrl, 'camera')
  }, [analyzeImageData])

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      event.target.value = ''
      try {
        const compressed = await compressImageToDataUrl(file)
        await analyzeImageData(compressed, 'upload')
      } catch {
        setState('error')
        setError('Unable to process this image. Try another photo.')
      }
    },
    [analyzeImageData],
  )

  const retake = useCallback(async () => {
    setError(null)
    setFoods([])
    setScanImageDataUrl(null)
    setScanLogId(null)

    if (!streamRef.current) {
      const started = await startCamera()
      if (!started) {
        return
      }
      return
    }

    setState('streaming')
  }, [startCamera])

  const saveAnalyzedFoods = useCallback(
    async (context: SaveContext) => {
      if (!foods.length) return

      setIsSaving(true)
      const saveStartedAt = performance.now()

      try {
        let uploaded: UploadResponse | null = null
        let uploadMs = 0
        const uploadStartedAt = performance.now()

        if (scanImageDataUrl) {
          const file = dataUrlToFile(scanImageDataUrl, `nutrition-scan-${Date.now()}.jpg`)
          const formData = new FormData()
          formData.append('file', file)
          formData.append('sourceType', scanSourceType)

          const uploadResponse = await requestApi<UploadResponse>('/api/v1/nutrition/upload', {
            method: 'POST',
            body: formData,
            headers: {
              'x-auto-toast': 'off',
            },
          })

          uploaded = uploadResponse.data
          uploadMs = Number((performance.now() - uploadStartedAt).toFixed(2))
        }

        const persistStartedAt = performance.now()
        await Promise.all(
          foods.map(async (food) => {
            const savedItem: FoodItem = {
              ...food.item,
              name: food.name,
              servingSize: Number(food.draftGrams.toFixed(1)),
              servingUnit: 'g',
              calories: Number(food.draftMacros.calories.toFixed(2)),
              protein: Number(food.draftMacros.protein.toFixed(2)),
              carbs: Number(food.draftMacros.carbs.toFixed(2)),
              fat: Number(food.draftMacros.fat.toFixed(2)),
              fiber: Number(food.draftMacros.fiber.toFixed(2)),
              imageUrl: uploaded?.url,
            }

            await context.addFoodEntry(savedItem, selectedMealSlot, 1, {
              imageUrl: uploaded?.url,
              imageSource: uploaded?.url ? 'ai_scan' : undefined,
              isAiGenerated: true,
              scanMetadata: {
                scanLogId,
                source: food.source,
                confidence: food.confidence,
                estimatedGrams: food.estimatedGrams,
                editedGrams: food.draftGrams,
              },
            })
          }),
        )
        const persistMs = Number((performance.now() - persistStartedAt).toFixed(2))

        toast.success('Meal added to diary!')
        logTelemetry('save-success', {
          foodsSaved: foods.length,
          mealSlot: selectedMealSlot,
          sourceType: scanSourceType,
          uploadMs,
          persistMs,
          totalSaveMs: Number((performance.now() - saveStartedAt).toFixed(2)),
        })
        closeScanner()
      } catch (saveError) {
        toast.error(saveError instanceof Error ? saveError.message : 'Unable to save scan result.')
        logTelemetry('save-error', {
          foodsAttempted: foods.length,
          mealSlot: selectedMealSlot,
          sourceType: scanSourceType,
          totalSaveMs: Number((performance.now() - saveStartedAt).toFixed(2)),
          detail: saveError instanceof Error ? saveError.message : 'Unknown save error',
        })
      } finally {
        setIsSaving(false)
      }
    },
    [foods, closeScanner, scanImageDataUrl, scanLogId, scanSourceType, selectedMealSlot],
  )

  const canCapture = useMemo(() => state === 'streaming', [state])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return {
    isScannerOpen,
    state,
    error,
    foods,
    selectedMealSlot,
    scanImageDataUrl,
    isSaving,
    videoRef,
    fileInputRef,
    canCapture,
    setFoods,
    setSelectedMealSlot,
    openScanner,
    closeScanner,
    captureFrame,
    handleFileChange,
    retake,
    saveAnalyzedFoods,
  }
}

async function compressImageToDataUrl(file: File): Promise<string> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      const maxWidth = 1600
      const ratio = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1
      const width = Math.floor(bitmap.width * ratio)
      const height = Math.floor(bitmap.height * ratio)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Unable to process image.')
      }

      context.drawImage(bitmap, 0, 0, width, height)
      bitmap.close()

      return canvas.toDataURL('image/jpeg', 0.6)
    } catch {
      // Fall back to HTML image decoding for broader browser compatibility.
    }
  }

  return compressImageViaElement(file)
}

async function compressImageViaElement(file: File): Promise<string> {
  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = await loadImageFromUrl(sourceUrl)
    const maxWidth = 1600
    const ratio = image.naturalWidth > maxWidth ? maxWidth / image.naturalWidth : 1
    const width = Math.floor(image.naturalWidth * ratio)
    const height = Math.floor(image.naturalHeight * ratio)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Unable to process image.')
    }

    context.drawImage(image, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.6)
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Unable to decode image.'))
    image.src = url
  })
}

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [meta, content] = dataUrl.split(',')
  const mime = /data:(.*?);base64/.exec(meta || '')?.[1] || 'image/jpeg'
  const bytes = atob(content || '')
  const buffer = new Uint8Array(bytes.length)

  for (let i = 0; i < bytes.length; i += 1) {
    buffer[i] = bytes.charCodeAt(i)
  }

  return new File([buffer], fileName, { type: mime })
}