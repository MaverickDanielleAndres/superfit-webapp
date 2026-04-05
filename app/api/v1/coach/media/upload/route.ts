import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const MAX_FILE_SIZE = 25 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

function extensionFromMime(type: string): string {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'video/webm') return 'webm'
  if (type === 'video/quicktime') return 'mov'
  return type.startsWith('video/') ? 'mp4' : 'jpg'
}

function mediaKindFromMime(type: string): 'image' | 'video' {
  return type.startsWith('video/') ? 'video' : 'image'
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return problemResponse({
      status: 401,
      code: 'UNAUTHORIZED',
      title: 'Unauthorized',
      detail: 'Authentication required.',
      requestId,
      retriable: false,
    })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return problemResponse({
      status: 400,
      code: 'INVALID_MULTIPART',
      title: 'Invalid Upload Payload',
      detail: 'Expected multipart form data with a media file.',
      requestId,
      retriable: false,
    })
  }

  const file = formData.get('file')
  const category = String(formData.get('category') || 'content').trim().toLowerCase()

  if (!(file instanceof File)) {
    return problemResponse({
      status: 422,
      code: 'VALIDATION_ERROR',
      title: 'Validation Error',
      detail: 'Field file is required.',
      requestId,
      retriable: false,
    })
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return problemResponse({
      status: 422,
      code: 'INVALID_FILE_TYPE',
      title: 'Validation Error',
      detail: 'Supported file types are JPG, PNG, WEBP, MP4, WEBM, and MOV.',
      requestId,
      retriable: false,
    })
  }

  if (file.size > MAX_FILE_SIZE) {
    return problemResponse({
      status: 422,
      code: 'FILE_TOO_LARGE',
      title: 'Validation Error',
      detail: 'Media file must be 25MB or smaller.',
      requestId,
      retriable: false,
    })
  }

  const extension = extensionFromMime(file.type)
  const objectPath = `${user.id}/${category || 'content'}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from('coach-media').upload(objectPath, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  })

  if (uploadError) {
    return problemResponse({
      status: 500,
      code: 'UPLOAD_FAILED',
      title: 'Upload Failed',
      detail: uploadError.message,
      requestId,
    })
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('coach-media').getPublicUrl(objectPath)

  return dataResponse({
    requestId,
    status: 201,
    data: {
      url: publicUrl,
      objectPath,
      mediaKind: mediaKindFromMime(file.type),
      contentType: file.type,
      size: file.size,
    },
  })
}