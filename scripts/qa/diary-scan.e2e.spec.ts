import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

function readEnvLocal(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local')
  const result: Record<string, string> = {}

  if (!fs.existsSync(envPath)) {
    return result
  }

  const content = fs.readFileSync(envPath, 'utf8')

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 1) continue
    const key = line.slice(0, eq).trim()
    const value = line.slice(eq + 1).trim()
    result[key] = value
  }

  return result
}

test('authenticated Diary scan upload, edit macros, save meal slot', async ({ page }) => {
  const env = readEnvLocal()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
  const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000'

  const checkpoints: Array<{ name: string; status: 'passed' | 'failed'; detail?: string }> = []

  const markPassed = (name: string, detail?: string) => {
    checkpoints.push({ name, status: 'passed', detail })
  }

  const markFailed = (name: string, detail?: string) => {
    checkpoints.push({ name, status: 'failed', detail })
  }

  if (!supabaseUrl || !serviceRoleKey) {
    markFailed('env-check', 'Missing required NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    console.table(checkpoints)
    throw new Error('Missing Supabase env values in .env.local')
  }
  markPassed('env-check', 'Required Supabase env values found')

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const email = `qa.scan.${Date.now()}@example.com`
  const password = 'ScanPass123!'
  let userId: string | null = null

  try {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'QA Scan User',
        role: 'user',
        account_status: 'active',
      },
    })

    if (createError || !created.user) {
      markFailed('auth-create-user', createError?.message || 'unknown error')
      console.table(checkpoints)
      throw new Error(`Unable to create test user: ${createError?.message || 'unknown'}`)
    }
    markPassed('auth-create-user', created.user.id)
    userId = created.user.id

    const { error: upsertError } = await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: 'QA Scan User',
        role: 'user',
        account_status: 'active',
        onboarding_complete: true,
      },
      { onConflict: 'id' },
    )

    if (upsertError) {
      markFailed('auth-upsert-profile', upsertError.message)
      console.table(checkpoints)
      throw new Error(`Unable to upsert profile: ${upsertError.message}`)
    }
    markPassed('auth-upsert-profile')

    const imagePath = path.join(process.cwd(), 'public', 'qa-food.jpg')
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle' })
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.locator('input[type="password"]').first().fill(password)
    await page.locator('form').first().press('Enter')
    await expect(page).toHaveURL(/\/(dashboard|diary|onboarding|under-review|suspended)(?:\?.*)?$/, {
      timeout: 20000,
    })
    markPassed('ui-auth-login')

    await page.goto(`${baseUrl}/diary`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /AI Smart Scan/i }).click()
    markPassed('ui-open-scan')

    const fileInput = page.locator('input[type="file"][accept="image/*"]')
    await expect(fileInput).toBeAttached({ timeout: 10000 })
    await fileInput.setInputFiles(imagePath)
    markPassed('ui-upload-image', path.basename(imagePath))

    const detectedHeader = page.getByRole('heading', { name: /Detected Foods/i })
    const scanError = page.getByText(/Scan Error|No food detected|Unable to analyze/i)

    let hasDetectedFoods = true
    try {
      await detectedHeader.waitFor({ timeout: 30000 })
    } catch {
      hasDetectedFoods = false
    }

    if (!hasDetectedFoods) {
      const isScanErrorVisible = await scanError.isVisible().catch(() => false)
      const reason = isScanErrorVisible
        ? 'Analyzer returned no detected foods for uploaded image.'
        : 'Analyzer did not reach results UI in allotted time.'
      markFailed('ui-detected-foods', reason)
      console.table(checkpoints)
      throw new Error(reason)
    }
    markPassed('ui-detected-foods')

    const caloriesInput = page.locator('label:has-text("Calories") input[type="number"]').first()
    await expect(caloriesInput).toBeVisible({ timeout: 10000 })

    const originalCalories = Number(await caloriesInput.inputValue())
    const editedCalories = Number.isFinite(originalCalories) ? originalCalories + 10 : 110
    await caloriesInput.fill(String(editedCalories))
    markPassed('ui-edit-macros', `calories=${editedCalories}`)

    await page.getByRole('button', { name: /Dinner/i }).first().click()
    markPassed('ui-select-meal-slot', 'dinner')

    await page.getByRole('button', { name: /Add to Diary/i }).click()
    await expect(page.getByRole('button', { name: /AI Smart Scan/i })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText(/Dinner/i).first()).toBeVisible({ timeout: 10000 })
    markPassed('ui-save-to-diary')

    console.table(checkpoints)
  } finally {
    if (userId) {
      await admin.auth.admin.deleteUser(userId)
    }
  }
})
