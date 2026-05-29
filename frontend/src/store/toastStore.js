import { create } from 'zustand'

const TOAST_TTL = 4200

const useToastStore = create((set) => ({
  toasts: [],
  pushToast(toast) {
    const id = crypto.randomUUID()
    const nextToast = {
      id,
      tone: toast.tone || 'info',
      title: toast.title,
      message: toast.message,
    }

    set((state) => ({ toasts: [...state.toasts, nextToast] }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
    }, TOAST_TTL)
  },
  dismissToast(id) {
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
  },
}))

export default useToastStore
