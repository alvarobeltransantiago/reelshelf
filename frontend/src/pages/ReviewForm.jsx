import { Helmet } from 'react-helmet-async'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { createReview, getCoverSuggestions, getReview, updateReview } from '../api/reviews'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import RatingInput from '../components/review/RatingInput'
import TagInput from '../components/review/TagInput'
import Spinner from '../components/common/Spinner'
import AspectRatingsEditor from '../components/review/AspectRatingsEditor'
import CoverSuggestionPicker from '../components/review/CoverSuggestionPicker'
import { createDefaultAspectRatings, getAspectFields, getCategoryLabel } from '../utils/reviewOptions'
import { slugify } from '../utils/slugify'
import './ReviewForm.css'

const reviewSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(200),
  author: z.string().min(1, 'El autor o creador es obligatorio').max(160),
  category: z.enum(['game', 'movie', 'series', 'book']),
  cover_url: z.union([z.string().url('Introduce una URL válida'), z.literal('')]),
  rating: z.number().int().min(1).max(10),
  aspect_ratings: z.record(z.string(), z.number().int().min(1).max(10)),
  body: z.string().min(50, 'La reseña debe tener al menos 50 caracteres').max(5000),
  tags: z.array(z.string().min(1).max(30)).max(5),
  status: z.enum(['published', 'draft']),
})

function ReviewForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const initialCategory = ['game', 'movie', 'series', 'book'].includes(searchParams.get('category'))
    ? searchParams.get('category')
    : 'game'
  const currentUser = useAuthStore((state) => state.user)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      title: '',
      author: '',
      category: initialCategory,
      cover_url: '',
      rating: 7,
      aspect_ratings: createDefaultAspectRatings('game'),
      body: '',
      tags: [],
      status: 'published',
    },
  })

  const selectedCategory = useWatch({ control, name: 'category' })
  const currentTitle = useWatch({ control, name: 'title' })
  const currentCoverUrl = useWatch({ control, name: 'cover_url' })

  const { data, isLoading } = useQuery({
    queryKey: ['review-edit', id],
    queryFn: () => getReview(id),
    enabled: isEditing,
  })

  const coverSuggestionsQuery = useQuery({
    queryKey: ['cover-suggestions', currentTitle, selectedCategory],
    queryFn: () => getCoverSuggestions(currentTitle, selectedCategory),
    enabled: currentTitle.trim().length >= 2,
  })

  const mutation = useMutation({
    mutationFn: (values) => {
      const payload = {
        ...values,
        tags: values.tags.map(slugify),
      }

      return isEditing ? updateReview(id, payload) : createReview(payload)
    },
    onSuccess(review) {
      navigate(`/review/${review.id}`)
    },
  })

  useEffect(() => {
    if (!isEditing) {
      setValue('aspect_ratings', createDefaultAspectRatings(selectedCategory))
    }
  }, [isEditing, selectedCategory, setValue])

  useEffect(() => {
    if (!isEditing) {
      setValue('category', initialCategory)
    }
  }, [initialCategory, isEditing, setValue])

  useEffect(() => {
    if (data) {
      if (isEditing && currentUser?.id !== data.user_id) {
        navigate(`/review/${id}`)
        return
      }

      reset({
        title: data.title,
        author: data.author || '',
        category: data.category,
        cover_url: data.cover_url || '',
        rating: data.rating,
        aspect_ratings:
          data.aspect_ratings && Object.keys(data.aspect_ratings).length
            ? data.aspect_ratings
            : createDefaultAspectRatings(data.category),
        body: data.body,
        tags: data.tags || [],
        status: data.status,
      })
    }
  }, [currentUser?.id, data, id, isEditing, navigate, reset])

  if (isEditing && isLoading) {
    return <Spinner label="Cargando reseña para editar" />
  }

  return (
    <section className="review-form-page">
      <Helmet>
        <title>{isEditing ? 'Editar reseña' : 'Nueva reseña'} | Reelshelf</title>
      </Helmet>

      <div className="review-form-page__hero">
        <p>{isEditing ? 'Editar entrada' : 'Nueva entrada'}</p>
        <h1>{isEditing ? 'Afina la ficha hasta que represente bien tu criterio.' : 'Convierte una opinión en una pieza bien archivada.'}</h1>
      </div>

      <form className="review-form" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="review-form__grid">
          <Input label="Título" error={errors.title?.message} {...register('title')} />
          <Input label="Autor / creador" error={errors.author?.message} {...register('author')} />
        </div>

        <div className="review-form__grid">
          {isEditing ? (
            <label className="review-form__select">
              <span>Categoría</span>
              <select {...register('category')}>
                <option value="game">Videojuego</option>
                <option value="movie">Película</option>
                <option value="series">Serie</option>
                <option value="book">Libro</option>
              </select>
            </label>
          ) : (
            <div className="review-form__category-lock">
              <span>Categoría</span>
              <strong>{getCategoryLabel(selectedCategory)}</strong>
            </div>
          )}

          <label className="review-form__select">
            <span>Estado</span>
            <select {...register('status')}>
              <option value="published">Publicada</option>
              <option value="draft">Borrador</option>
            </select>
          </label>
        </div>

        <Input label="URL de portada" error={errors.cover_url?.message} {...register('cover_url')} />

        <CoverSuggestionPicker
          suggestions={coverSuggestionsQuery.data || []}
          selectedUrl={currentCoverUrl}
          isLoading={coverSuggestionsQuery.isLoading}
          onSelect={(coverUrl) => setValue('cover_url', coverUrl, { shouldDirty: true, shouldValidate: true })}
        />

        <Controller
          name="rating"
          control={control}
          render={({ field }) => <RatingInput value={field.value} onChange={field.onChange} error={errors.rating?.message} />}
        />

        <Controller
          name="aspect_ratings"
          control={control}
          render={({ field }) => (
            <AspectRatingsEditor
              category={selectedCategory}
              value={field.value}
              onChange={field.onChange}
              error={errors.aspect_ratings?.message}
            />
          )}
        />

        <Input label="Reseña" multiline error={errors.body?.message} {...register('body')} />

        <Controller
          name="tags"
          control={control}
          render={({ field }) => <TagInput value={field.value} onChange={field.onChange} error={errors.tags?.message} />}
        />

        <div className="review-form__legend">
          <span>Aspectos activos:</span>
          <strong>{getAspectFields(selectedCategory).map((item) => item.label).join(' · ')}</strong>
        </div>

        {mutation.isError ? <p className="review-form__error">{mutation.error.message}</p> : null}

        <Button type="submit" loading={mutation.isPending}>
          {isEditing ? 'Guardar cambios' : 'Guardar reseña'}
        </Button>
      </form>
    </section>
  )
}

export default ReviewForm
