import { create } from 'zustand'

const TOAST_TTL = 4200
const MAX_TOASTS = 4
const toastTimers = new Map()

function createToastId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const useToastStore = create((set) => ({
  toasts: [],
  pushToast(toast) {
    const id = createToastId()
    const nextToast = {
      id,
      tone: toast.tone || 'info',
      title: toast.title,
      message: toast.message,
    }
    const fingerprint = `${nextToast.tone}:${nextToast.title}:${nextToast.message || ''}`

    set((state) => {
      const withoutDuplicate = state.toasts.filter((item) => `${item.tone}:${item.title}:${item.message || ''}` !== fingerprint)
      return { toasts: [...withoutDuplicate, nextToast].slice(-MAX_TOASTS) }
    })

    const timeoutId = window.setTimeout(() => {
      toastTimers.delete(id)
      set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
    }, TOAST_TTL)

    toastTimers.set(id, timeoutId)
  },
  dismissToast(id) {
    const timeoutId = toastTimers.get(id)

    if (timeoutId) {
      window.clearTimeout(timeoutId)
      toastTimers.delete(id)
    }

    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
  },
}))

export default useToastStore
