import { create } from 'zustand'

const initialState = {
  accessToken: null,
  user: null,
  isBootstrapping: true,
}

const useAuthStore = create((set) => ({
  ...initialState,
  setSession(session) {
    set({
      accessToken: session.accessToken,
      user: session.user,
      isBootstrapping: false,
    })
  },
  setBootstrapped() {
    set({ isBootstrapping: false })
  },
  clearSession() {
    set({
      accessToken: null,
      user: null,
      isBootstrapping: false,
    })
  },
  updateUser(user) {
    set((state) => ({
      user: state.user ? { ...state.user, ...user } : user,
    }))
  },
}))

export default useAuthStore
