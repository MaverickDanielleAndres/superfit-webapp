import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dataResponse, problemResponse } from '@/lib/api/problem'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

function extensionFromMime(type: string): string {
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  return 'jpg'
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
      detail: 'Expected multipart form data with an image file.',
      requestId,
      retriable: false,
    })
  }

  const file = formData.get('file')
  const sourceType = String(formData.get('sourceType') || 'upload')

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
      detail: 'Supported file types are JPEG, PNG, and WEBP.',
      requestId,
      retriable: false,
    })
  }

  if (file.size > MAX_FILE_SIZE) {
    return problemResponse({
      status: 422,
      code: 'FILE_TOO_LARGE',
      title: 'Validation Error',
      detail: 'Image must be 5MB or smaller.',
      requestId,
      retriable: false,
    })
  }

  const extension = extensionFromMime(file.type)
  const path = `${user.id}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage.from('nutrition-images').upload(path, file, {
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
  } = supabase.storage.from('nutrition-images').getPublicUrl(path)

  return dataResponse({
    requestId,
    status: 201,
    data: {
      path,
      url: publicUrl,
      sourceType: sourceType === 'camera' ? 'camera' : 'upload',
    },
  })
}
