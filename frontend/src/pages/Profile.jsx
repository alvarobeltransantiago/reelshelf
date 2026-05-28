import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { getUserProfile, updateMyProfile } from '../api/users'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Spinner from '../components/common/Spinner'
import './Profile.css'

const profileSchema = z.object({
  bio: z.string().max(280, 'Máximo 280 caracteres'),
  avatar_url: z
    .string()
    .max(2000000)
    .refine(
      (value) => value === '' || /^https?:\/\//.test(value) || /^data:image\/[a-zA-Z]+;base64,/.test(value),
      'Introduce una URL válida o sube una imagen'
    ),
})

function Profile() {
  const { username } = useParams()
  const currentUser = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
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
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      bio: user?.bio || '',
      avatar_url: user?.avatar_url || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess(data) {
      updateUser(data)
      reset({
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
      })
    },
  })

  if (isLoading) {
    return <Spinner label="Cargando perfil" />
  }

  if (isError) {
    return <p className="profile__state">Error cargando perfil: {error.message}</p>
  }

  const avatarPreview = watch('avatar_url')
  const profileInitial = (user.username || 'R').slice(0, 1).toUpperCase()

  function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setValue('avatar_url', reader.result, { shouldDirty: true, shouldValidate: true })
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="profile">
      <Helmet>
        <title>{user.username} | Reelshelf</title>
      </Helmet>

      <header className="profile__hero">
        <div className="profile__avatar" aria-hidden="true">
          {avatarPreview ? <img src={avatarPreview} alt={`Avatar de ${user.username}`} loading="lazy" /> : <span>{profileInitial}</span>}
        </div>
        <div className="profile__copy">
          <p>{user.username}</p>
          <h1>Biografía</h1>
        </div>
      </header>

      <form className="profile__form" onSubmit={handleSubmit((values) => updateMutation.mutate({ ...values, username: user.username }))}>
        <Input label="Biografía" multiline disabled={!isOwnProfile} error={errors.bio?.message} {...register('bio')} />

        {isOwnProfile ? (
          <div className="profile__avatar-edit">
            <label className="profile__upload">
              <span>Imagen de perfil</span>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
            <Input label="Avatar URL" error={errors.avatar_url?.message} {...register('avatar_url')} />
          </div>
        ) : null}

        {updateMutation.isError ? <p className="profile__state">{updateMutation.error.message}</p> : null}
        {updateMutation.isSuccess ? <p className="profile__success">Perfil actualizado.</p> : null}

        {isOwnProfile ? (
          <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty && !updateMutation.isPending}>
            Guardar cambios
          </Button>
        ) : null}
      </form>
    </section>
  )
}

export default Profile
