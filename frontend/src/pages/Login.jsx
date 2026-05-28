import { Helmet } from 'react-helmet-async'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { loginUser } from '../api/auth'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import './Auth.css'

const loginSchema = z.object({
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(1, 'Introduce tu contraseña'),
})

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((state) => state.setSession)
  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess(data) {
      setSession(data)
      navigate(location.state?.from || '/')
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  return (
    <section className="auth-page">
      <Helmet>
        <title>Entrar | Reelshelf</title>
      </Helmet>

      <div className="auth-page__panel">
        <div className="auth-page__copy">
          <p>Vuelve a tu biblioteca</p>
          <h1>Inicia sesión para editar reseñas, borradores y perfil.</h1>
        </div>

        <form className="auth-page__form" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Contraseña" type="password" error={errors.password?.message} {...register('password')} />
          {mutation.isError ? <p className="auth-page__error">{mutation.error.message}</p> : null}
          <Button type="submit" loading={mutation.isPending} fullWidth>
            Entrar
          </Button>
          <p>
            ¿No tienes cuenta? <Link to="/register">Créala aquí</Link>
          </p>
        </form>
      </div>
    </section>
  )
}

export default Login
