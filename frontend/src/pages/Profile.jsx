import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'

import { deleteMyAccount, downloadMyBackup, getUserProfile, updateMyProfile } from '../api/users'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import Spinner from '../components/common/Spinner'
import useToastStore from '../store/toastStore'
import { AVATAR_PRESETS, getAvatarImage } from '../utils/avatarPresets'
import './Profile.css'

const profileSchema = z.object({
  username: z.string().min(3, 'Minimo 3 caracteres').max(50, 'Maximo 50 caracteres'),
  bio: z.string().max(280, 'Maximo 280 caracteres'),
  avatar_url: z
    .string()
    .max(2000000)
    .refine(
      (value) =>
        value === '' ||
        /^https?:\/\//.test(value) ||
        /^data:image\/[a-zA-Z]+;base64,/.test(value) ||
        /^data:image\/svg\+xml(;utf8|;charset=utf-8)?,/.test(value) ||
        /^preset:[a-z-]+$/.test(value),
      'Elige un icono valido'
    ),
})

function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const clearSession = useAuthStore((state) => state.clearSession)
  const pushToast = useToastStore((state) => state.pushToast)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const isOwnProfile = currentUser?.username === username

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => getUserProfile(username),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      username: user?.username || '',
      bio: user?.bio || '',
      avatar_url: user?.avatar_url || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess(data) {
      updateUser(data)
      queryClient.setQueryData(['profile', data.username], data)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      reset({
        username: data.username || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
      })
      navigate(`/u/${data.username}`, { replace: true })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess() {
      clearSession()
      navigate('/')
    },
  })

  const backupMutation = useMutation({
    mutationFn: downloadMyBackup,
    onSuccess({ blob, filename }) {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      pushToast({
        tone: 'success',
        title: 'Backup descargado',
        message: 'El archivo SQL se ha generado correctamente.',
      })
    },
    onError(error) {
      pushToast({
        tone: 'error',
        title: 'No se pudo descargar',
        message: error.message || 'Inténtalo de nuevo más tarde.',
      })
    },
  })

  if (isLoading) {
    return <Spinner label="Cargando perfil" />
  }

  if (isError) {
    return <p className="profile__state">Error cargando perfil: {error.message}</p>
  }

  const avatarValue = watch('avatar_url')
  const avatarPreview = getAvatarImage(avatarValue)
  const profileInitial = (user.username || 'R').slice(0, 1).toUpperCase()

  function buildProfilePayload(values) {
    const payload = {}

    if (dirtyFields.username && values.username !== user.username) {
      payload.username = values.username
    }

    if (dirtyFields.bio && values.bio !== (user.bio || '')) {
      payload.bio = values.bio
    }

    if (dirtyFields.avatar_url && values.avatar_url !== (user.avatar_url || '')) {
      payload.avatar_url = values.avatar_url
    }

    return payload
  }

  function handleInvalidSubmit(formErrors) {
    const firstError = Object.values(formErrors)[0]
    pushToast({
      tone: 'error',
      title: 'Datos no válidos',
      message: firstError?.message || 'Revisa los campos del perfil.',
    })
  }

  function handleProfileSubmit(values) {
    const payload = buildProfilePayload(values)

    if (!Object.keys(payload).length) {
      pushToast({
        tone: 'info',
        title: 'Sin cambios',
        message: 'No hay nada nuevo que guardar.',
      })
      return
    }

    updateMutation.mutate(payload)
  }

  return (
    <section className="profile">
      <Helmet>
        <title>{user.username} | Reelshelf</title>
      </Helmet>

      <header className="profile__hero">
        <div className="profile__avatar" aria-hidden="true">
          {avatarPreview ? <img src={avatarPreview} alt="" loading="lazy" /> : <span>{profileInitial}</span>}
        </div>
        <div className="profile__copy">
          <p>{user.username}</p>
          <h1>Perfil</h1>
        </div>
      </header>

      <div className="profile__content">
        <form className="profile__form" onSubmit={handleSubmit(handleProfileSubmit, handleInvalidSubmit)}>
          <section className="profile__section">
            <h2>Identidad</h2>
            {isOwnProfile ? <Input label="Username" error={errors.username?.message} {...register('username')} /> : null}
            <Input label="Biografía" multiline disabled={!isOwnProfile} error={errors.bio?.message} {...register('bio')} />
          </section>

          {isOwnProfile ? (
            <section className="profile__section">
              <h2>Icono de perfil</h2>
              <div className="profile__avatar-grid" role="radiogroup" aria-label="Iconos de perfil">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`profile__avatar-choice ${avatarValue === preset.value ? 'profile__avatar-choice--active' : ''}`}
                    onClick={() => setValue('avatar_url', preset.value, { shouldDirty: true, shouldValidate: true })}
                    aria-label={`Elegir icono ${preset.label}`}
                    aria-pressed={avatarValue === preset.value}
                  >
                    <img src={preset.image} alt="" aria-hidden="true" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {isOwnProfile ? (
            <div className="profile__primary-actions">
              <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty && !updateMutation.isPending}>
                Guardar cambios
              </Button>
            </div>
          ) : null}
        </form>

        {isOwnProfile ? (
          <aside className="profile__side-actions" aria-label="Acciones de cuenta">
            <section className="profile__action-card">
              <h2>Datos</h2>
              <p>Genera un archivo SQL para restaurar tu biblioteca si lo necesitas.</p>
              <Button type="button" variant="secondary" loading={backupMutation.isPending} onClick={() => backupMutation.mutate()}>
                Descargar backup
              </Button>
              {backupMutation.isError ? <p className="profile__state">{backupMutation.error.message}</p> : null}
            </section>

            <section className="profile__action-card">
              <h2>Tutorial</h2>
              <p>Vuelve a ver la guía inicial de la biblioteca.</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  window.localStorage.removeItem('reelshelf-library-tour-completed')
                  navigate('/library?tour=1')
                }}
              >
                Ver tutorial
              </Button>
            </section>

            <section className="profile__action-card profile__action-card--danger">
              <h2>Cuenta</h2>
              <p>Esta acción elimina tu perfil, reseñas, deseos y sesiones activas.</p>
              <Button type="button" variant="danger" onClick={() => setIsDeleteOpen(true)}>
                Eliminar cuenta
              </Button>
            </section>
          </aside>
        ) : null}
      </div>

      <Modal open={isDeleteOpen} title="Eliminar cuenta" onClose={() => setIsDeleteOpen(false)}>
        <p>Se borrarán tu perfil, tus reseñas, tu lista de deseos y tus sesiones activas.</p>
        <div className="profile__primary-actions">
          <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Confirmar
          </Button>
        </div>
      </Modal>
    </section>
  )
}

export default Profile
