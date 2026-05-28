import useAuthStore from '../store/authStore'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)

  return {
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    isBootstrapping,
  }
}
