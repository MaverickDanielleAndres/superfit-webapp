export async function sendEmailWithResend(params: {
  to: string
  subject: string
  html: string
}) {
  const runtimeEnv = getRuntimeEnv()
  const resendApiKey = runtimeEnv.RESEND_API_KEY
  const fromEmail = runtimeEnv.RESEND_FROM_EMAIL || 'SuperFit <no-reply@superfit.app>'

  if (!resendApiKey) {
    return { sent: false, reason: 'RESEND_API_KEY missing' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Resend request failed: ${response.status} ${errorText}`)
  }

  return { sent: true }
}

function getRuntimeEnv() {
  const denoEnv = (globalThis as typeof globalThis & {
    Deno?: { env?: { get?: (key: string) => string | undefined } }
  }).Deno?.env

  if (denoEnv?.get) {
    return {
      RESEND_API_KEY: denoEnv.get('RESEND_API_KEY'),
      RESEND_FROM_EMAIL: denoEnv.get('RESEND_FROM_EMAIL'),
    }
  }

  const nodeEnv = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> }
  }).process?.env

  return {
    RESEND_API_KEY: nodeEnv?.RESEND_API_KEY,
    RESEND_FROM_EMAIL: nodeEnv?.RESEND_FROM_EMAIL,
  }
}
