import { Helmet } from 'react-helmet-async'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'

import { registerUser } from '../api/auth'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import './Auth.css'

const registerSchema = z
  .object({
    username: z.string().min(3, 'Mínimo 3 caracteres').max(50).regex(/^[A-Za-z0-9_]+$/, 'Solo letras, números y guion bajo'),
    email: z.string().email('Introduce un email válido'),
    password: z.string().min(8, 'Mínimo 8 caracteres').regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Incluye al menos una letra y un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

function Register() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess(data) {
      setSession(data)
      navigate('/')
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  return (
    <section className="auth-page">
      <Helmet>
        <title>Crear cuenta | Reelshelf</title>
      </Helmet>

      <div className="auth-page__panel">
        <div className="auth-page__copy">
          <p>Empieza tu biblioteca</p>
          <h1>Crea una cuenta para publicar reseñas con voz propia.</h1>
        </div>

        <form
          className="auth-page__form"
          onSubmit={handleSubmit(({ confirmPassword, ...values }) => mutation.mutate(values))}
        >
          <Input label="Username" error={errors.username?.message} {...register('username')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Contraseña" type="password" error={errors.password?.message} {...register('password')} />
          <Input
            label="Confirmar contraseña"
            type="password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          {mutation.isError ? <p className="auth-page__error">{mutation.error.message}</p> : null}
          <Button type="submit" loading={mutation.isPending} fullWidth>
            Crear cuenta
          </Button>
          <p>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </section>
  )
}

export default Register
