import { z } from 'zod'

export type GeminiConfidence = 'high' | 'medium' | 'low'

export interface GeminiDetectedFood {
  name: string
  estimated_grams: number
  portion_description: string
  confidence: GeminiConfidence
}

export interface GeminiVisionResult {
  is_food: boolean
  foods: GeminiDetectedFood[]
}

const GEMINI_REQUEST_TIMEOUT_MS = 12_000
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com'
const GEMINI_API_VERSIONS = ['v1', 'v1beta'] as const
const DEFAULT_GEMINI_MODEL_CANDIDATES = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']

const GeminiSchema = z
  .object({
    is_food: z.boolean(),
    foods: z
      .array(
        z.object({
          name: z.string().min(1),
          estimated_grams: z.number().positive(),
          portion_description: z.string().min(1),
          confidence: z.enum(['high', 'medium', 'low']),
        }),
      )
      .optional(),
  })
  .transform((value) => ({
    is_food: value.is_food,
    foods: value.is_food ? value.foods || [] : [],
  }))

const PROMPT = [
  'Detect all food items in the image and estimate portion size in grams.',
  'Return ONLY valid JSON in this exact schema:',
  '{"foods":[{"name":"string","estimated_grams":number,"portion_description":"string","confidence":"high|medium|low"}],"is_food":boolean}',
  'Rules:',
  '- No markdown',
  '- No explanations',
  '- No calories',
  '- No macros',
  '- If no food is present return {"is_food":false}',
  '- Always include estimated_grams for each detected food item',
].join('\n')

export async function detectFoodsFromImageBase64(imageData: string): Promise<GeminiVisionResult> {
  const apiKey = process.env.GEMINI_API_KEY || ''
  if (!apiKey) {
    throw new Error('Gemini configuration missing. Set GEMINI_API_KEY on the server.')
  }

  const base64 = extractBase64(imageData)
  if (!base64) {
    throw new Error('Image payload is invalid.')
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: PROMPT },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      topK: 1,
      topP: 1,
      maxOutputTokens: 768,
    },
  }

  const payload = await generateContentWithFallback(apiKey, body, {
    validateText: (candidateText) => GeminiSchema.safeParse(sanitizeGeminiJson(candidateText)).success,
  })

  const modelText = extractModelText(payload)
  let parsed = GeminiSchema.safeParse(sanitizeGeminiJson(modelText))

  if (!parsed.success) {
    try {
      const normalizedText = await normalizeRecognitionPayloadWithGemini(apiKey, modelText)
      parsed = GeminiSchema.safeParse(sanitizeGeminiJson(normalizedText))
    } catch {
      // Keep original parse result for error handling below.
    }
  }

  if (!parsed.success) {
    const heuristicFoods = extractFoodsFromLooseText(modelText)
    if (heuristicFoods.length) {
      return {
        is_food: true,
        foods: heuristicFoods,
      }
    }

    if (/\b(no\s+food|not\s+food|non[-\s]?food)\b/i.test(modelText)) {
      return { is_food: false, foods: [] }
    }

    throw new Error('Gemini returned an invalid recognition payload.')
  }

  if (!parsed.data.is_food) {
    return { is_food: false, foods: [] }
  }

  if (!parsed.data.foods.length) {
    return { is_food: false, foods: [] }
  }

  return parsed.data
}

function extractModelText(payload: unknown): string {
  const typed = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  return typed.candidates?.[0]?.content?.parts?.map((part) => String(part.text || '')).join('\n') || ''
}

async function normalizeRecognitionPayloadWithGemini(apiKey: string, rawText: string): Promise<string> {
  const compactRaw = rawText.trim().slice(0, 8000)
  if (!compactRaw.length) {
    return rawText
  }

  const normalizePrompt = [
    'Rewrite the following content into STRICT valid JSON only.',
    'Use this exact schema:',
    '{"foods":[{"name":"string","estimated_grams":number,"portion_description":"string","confidence":"high|medium|low"}],"is_food":boolean}',
    'Rules:',
    '- No markdown',
    '- No explanations',
    '- No extra keys',
    '- If there is no food, return {"is_food":false}',
  ].join('\n')

  const normalizeBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: normalizePrompt },
          { text: compactRaw },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      topK: 1,
      topP: 1,
      maxOutputTokens: 512,
    },
  }

  const normalizedPayload = await generateContentWithFallback(apiKey, normalizeBody)
  return extractModelText(normalizedPayload)
}

function extractFoodsFromLooseText(raw: string): GeminiDetectedFood[] {
  const text = raw.trim()
  if (!text.length) return []

  const foods: GeminiDetectedFood[] = []
  const seen = new Set<string>()

  const pushFood = (name: string, grams: number) => {
    const cleanedName = name
      .replace(/^[-*\d\.\)\s]+/, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!cleanedName || cleanedName.length < 2) return
    if (/\b(json|schema|is_food|foods?)\b/i.test(cleanedName)) return
    if (!Number.isFinite(grams) || grams <= 0) return

    const key = cleanedName.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)

    foods.push({
      name: cleanedName,
      estimated_grams: Number(grams.toFixed(1)),
      portion_description: `${Number(grams.toFixed(1))} g`,
      confidence: 'medium',
    })
  }

  for (const line of text.split(/\r?\n/)) {
    const compact = line.trim()
    if (!compact) continue

    const gramsMatch = compact.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)\b/i)
    if (!gramsMatch) continue

    const grams = Number(gramsMatch[1])
    const name = compact.split(/[-:,()]/)[0] || compact
    pushFood(name, grams)
  }

  if (!foods.length) {
    const inlinePattern = /([A-Za-z][A-Za-z\s]{1,40}?)\s*\(?\s*(\d+(?:\.\d+)?)\s*(?:g|grams?)\s*\)?/g
    let match: RegExpExecArray | null
    while ((match = inlinePattern.exec(text)) !== null) {
      pushFood(match[1], Number(match[2]))
      if (foods.length >= 8) break
    }
  }

  return foods.slice(0, 8)
}

function getModelCandidates(): string[] {
  const configuredModel = (process.env.GEMINI_MODEL || '').trim()
  const configuredVersion = (process.env.GEMINI_API_VERSION || '').trim().toLowerCase()

  const rawCandidates = [
    configuredModel,
    ...DEFAULT_GEMINI_MODEL_CANDIDATES,
  ]

  const uniqueCandidates = Array.from(new Set(rawCandidates.filter(Boolean)))

  if (configuredVersion && !GEMINI_API_VERSIONS.includes(configuredVersion as (typeof GEMINI_API_VERSIONS)[number])) {
    throw new Error('GEMINI_API_VERSION must be either "v1" or "v1beta" when provided.')
  }

  return uniqueCandidates
}

async function generateContentWithFallback(
  apiKey: string,
  body: unknown,
  options?: { validateText?: (text: string) => boolean },
): Promise<unknown> {
  const configuredVersion = (process.env.GEMINI_API_VERSION || '').trim().toLowerCase()
  const versions = configuredVersion
    ? ([configuredVersion] as Array<(typeof GEMINI_API_VERSIONS)[number]>)
    : [...GEMINI_API_VERSIONS]
  const models = getModelCandidates()

  let lastFallbackEligibleDetail = ''
  let sawQuotaExceeded = false

  for (const version of versions) {
    const discoveredModels = await listGenerateContentModels(apiKey, version)
    const modelsForVersion = Array.from(new Set([...models, ...discoveredModels]))

    for (const model of modelsForVersion) {
      const url = `${GEMINI_API_BASE}/${version}/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`
      const response = await fetchWithRetryOnce(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      })

      if (response.ok) {
        const successPayload = await response.json()
        if (options?.validateText) {
          const candidateText = extractModelText(successPayload)
          if (!options.validateText(candidateText)) {
            lastFallbackEligibleDetail = 'Model returned a non-parseable recognition payload.'
            continue
          }
        }
        return successPayload
      }

      const detail = await safeReadText(response)
      if (response.status === 400 || response.status === 403 || response.status === 404 || response.status === 429 || response.status >= 500) {
        if (response.status === 429) {
          sawQuotaExceeded = true
        }
        lastFallbackEligibleDetail = detail
        continue
      }

      throw new Error(detail || `Gemini vision request failed (${response.status}).`)
    }
  }

  if (sawQuotaExceeded) {
    throw new Error(lastFallbackEligibleDetail || 'Gemini quota exceeded for available models. Check plan and billing.')
  }

  if (lastFallbackEligibleDetail) {
    throw new Error(lastFallbackEligibleDetail)
  }

  throw new Error('No compatible Gemini model could be resolved for generateContent.')
}

async function listGenerateContentModels(apiKey: string, version: (typeof GEMINI_API_VERSIONS)[number]): Promise<string[]> {
  const url = `${GEMINI_API_BASE}/${version}/models?key=${apiKey}`
  const response = await fetchWithTimeout(url, { cache: 'no-store' }, GEMINI_REQUEST_TIMEOUT_MS)

  if (!response.ok) {
    return []
  }

  const payload = (await response.json()) as {
    models?: Array<{
      name?: string
      supportedGenerationMethods?: string[]
    }>
  }

  const candidates = (payload.models || [])
    .filter((model) => Array.isArray(model.supportedGenerationMethods) && model.supportedGenerationMethods.includes('generateContent'))
    .map((model) => String(model.name || '').replace(/^models\//, '').trim())
    .filter(Boolean)

  return Array.from(new Set(candidates))
}

function extractBase64(input: string): string {
  const trimmed = input.trim()
  if (!trimmed.length) return ''
  if (trimmed.includes(',')) {
    return trimmed.split(',').pop()?.trim() || ''
  }
  return trimmed
}

function sanitizeGeminiJson(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed.length) return { is_food: false }

  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  const firstBrace = withoutFence.indexOf('{')
  const lastBrace = withoutFence.lastIndexOf('}')
  const candidate = firstBrace >= 0 && lastBrace > firstBrace
    ? withoutFence.slice(firstBrace, lastBrace + 1)
    : withoutFence

  try {
    return normalizeParsedPayload(JSON.parse(candidate))
  } catch {
    const repaired = repairJsonCandidate(candidate)
    try {
      return normalizeParsedPayload(JSON.parse(repaired))
    } catch {
      throw new Error('Unable to parse Gemini JSON payload.')
    }
  }
}

function repairJsonCandidate(value: string): string {
  return value
    .replace(/}\s*{/g, '},{')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
}

function normalizeParsedPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return {
      is_food: value.length > 0,
      foods: value,
    }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.is_food === 'boolean') {
      return record
    }

    if (typeof record.isFood === 'boolean') {
      return {
        ...record,
        is_food: record.isFood,
      }
    }
  }

  return value
}

async function fetchWithRetryOnce(url: string, init: RequestInit): Promise<Response> {
  try {
    const first = await fetchWithTimeout(url, init, GEMINI_REQUEST_TIMEOUT_MS)
    if (first.ok) return first
    if (first.status >= 500 || first.status === 429) {
      return await fetchWithTimeout(url, init, GEMINI_REQUEST_TIMEOUT_MS)
    }
    return first
  } catch {
    return await fetchWithTimeout(url, init, GEMINI_REQUEST_TIMEOUT_MS)
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500)
  } catch {
    return ''
  }
}