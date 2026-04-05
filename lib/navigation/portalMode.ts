const USER_APP_MODE_KEY = 'superfit.user_app_mode'

export type PortalRole = 'coach' | 'admin'

export function enableUserAppModeForRole(role: PortalRole) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(USER_APP_MODE_KEY, role)
}

export function isUserAppModeEnabledForRole(role: PortalRole): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(USER_APP_MODE_KEY) === role
}

export function enableCoachUserAppMode() {
  enableUserAppModeForRole('coach')
}

export function enableAdminUserAppMode() {
  enableUserAppModeForRole('admin')
}

export function disableCoachUserAppMode() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(USER_APP_MODE_KEY)
}

export function isCoachUserAppModeEnabled(): boolean {
  return isUserAppModeEnabledForRole('coach')
}

export function isAdminUserAppModeEnabled(): boolean {
  return isUserAppModeEnabledForRole('admin')
}
