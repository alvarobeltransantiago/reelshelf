import { Helmet } from 'react-helmet-async'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { deleteMyAccount, updateMyProfile } from '../api/users'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'
import './Settings.css'

const settingsSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(50).regex(/^[A-Za-z0-9_]+$/, 'Solo letras, números y guion bajo'),
  bio: z.string().max(280, 'Máximo 280 caracteres'),
  avatar_url: z
    .string()
    .max(2000000)
    .refine(
      (value) => value === '' || /^https?:\/\//.test(value) || /^data:image\/[a-zA-Z]+;base64,/.test(value),
      'Introduce una URL válida o sube una imagen'
    ),
})

function Settings() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const clearSession = useAuthStore((state) => state.clearSession)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const updateMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess(data) {
      updateUser(data)
      navigate(`/u/${data.username}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMyAccount,
    onSuccess() {
      clearSession()
      navigate('/')
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      username: user?.username || '',
      bio: user?.bio || '',
      avatar_url: user?.avatar_url || '',
    },
  })

  const avatarPreview = watch('avatar_url')
  const profileInitial = (user?.username || 'R').slice(0, 1).toUpperCase()

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
    <section className="settings">
      <Helmet>
        <title>Ajustes | Reelshelf</title>
      </Helmet>

      <div className="settings__hero">
        <p>Tu perfil</p>
        <h1>Edita la identidad pública de tu biblioteca.</h1>
      </div>

      <form className="settings__form" onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
        <div className="settings__avatar-panel">
          <div className="settings__avatar-preview" aria-hidden="true">
            {avatarPreview ? <img src={avatarPreview} alt="Vista previa del avatar" /> : <span>{profileInitial}</span>}
          </div>
          <div className="settings__avatar-actions">
            <label className="settings__upload">
              <span>Subir foto de perfil</span>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
            <Input label="Avatar URL" error={errors.avatar_url?.message} {...register('avatar_url')} />
          </div>
        </div>

        <Input label="Username" error={errors.username?.message} {...register('username')} />
        <Input label="Bio" multiline error={errors.bio?.message} {...register('bio')} />
        {updateMutation.isError ? <p className="settings__error">{updateMutation.error.message}</p> : null}
        <div className="settings__actions">
          <Button type="submit" loading={updateMutation.isPending}>
            Guardar cambios
          </Button>
          <Button type="button" variant="danger" onClick={() => setIsDeleteOpen(true)}>
            Eliminar cuenta
          </Button>
        </div>
      </form>

      <Modal open={isDeleteOpen} title="Eliminar cuenta" onClose={() => setIsDeleteOpen(false)}>
        <p>Se borrarán tu perfil, tus reseñas y tus tokens activos.</p>
        <div className="settings__actions">
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

export default Settings
