import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  createWishlistItem,
  deleteWishlistItem,
  getMyWishlist,
  reorderWishlist,
  updateWishlistItem,
} from '../api/users'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Spinner from '../components/common/Spinner'
import { CATEGORY_TABS } from '../utils/reviewOptions'
import './Wishlist.css'

const wishlistSchema = z.object({
  title: z.string().min(1, 'El titulo es obligatorio').max(200),
  author: z.string().max(160),
  notes: z.string().max(1000),
  cover_url: z.union([z.string().url('Introduce una URL valida'), z.literal('')]),
})

function moveItem(items, draggedId, targetId) {
  const nextItems = [...items]
  const draggedIndex = nextItems.findIndex((item) => item.id === draggedId)
  const targetIndex = nextItems.findIndex((item) => item.id === targetId)

  if (draggedIndex === -1 || targetIndex === -1) {
    return items
  }

  const [draggedItem] = nextItems.splice(draggedIndex, 1)
  nextItems.splice(targetIndex, 0, draggedItem)
  return nextItems
}

function Wishlist() {
  const queryClient = useQueryClient()
  const [category, setCategory] = useState('game')
  const [editingItem, setEditingItem] = useState(null)

  const wishlistQuery = useQuery({
    queryKey: ['my-wishlist', category],
    queryFn: () => getMyWishlist(category),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(wishlistSchema),
    defaultValues: {
      title: '',
      author: '',
      notes: '',
      cover_url: '',
    },
  })

  const saveMutation = useMutation({
    mutationFn(values) {
      const payload = { ...values, category }
      return editingItem ? updateWishlistItem(editingItem.id, payload) : createWishlistItem(payload)
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['my-wishlist'] })
      setEditingItem(null)
      reset({ title: '', author: '', notes: '', cover_url: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWishlistItem,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['my-wishlist'] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (itemIds) => reorderWishlist(category, itemIds),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ['my-wishlist'] })
    },
  })

  function startEditing(item) {
    setEditingItem(item)
    reset({
      title: item.title,
      author: item.author || '',
      notes: item.notes || '',
      cover_url: item.cover_url || '',
    })
  }

  function cancelEditing() {
    setEditingItem(null)
    reset({ title: '', author: '', notes: '', cover_url: '' })
  }

  function handleMove(draggedId, targetId) {
    const items = wishlistQuery.data || []
    const nextOrder = moveItem(items, draggedId, targetId).map((item) => item.id)
    reorderMutation.mutate(nextOrder)
  }

  const items = wishlistQuery.data || []

  return (
    <section className="wishlist-page">
      <Helmet>
        <title>Lista de deseos | Reelshelf</title>
      </Helmet>

      <header className="wishlist-page__hero">
        <p>Lista de deseos</p>
        <h1>Lo siguiente que quieres ver, leer o jugar.</h1>
      </header>

      <div className="wishlist-page__tabs" role="tablist" aria-label="Categorias de lista de deseos">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`wishlist-page__tab ${category === tab.value ? 'wishlist-page__tab--active' : ''}`}
            onClick={() => {
              setCategory(tab.value)
              cancelEditing()
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="wishlist-page__layout">
        <form className="wishlist-form" onSubmit={handleSubmit((values) => saveMutation.mutate(values))}>
          <h2>{editingItem ? 'Editar deseo' : 'Nuevo deseo'}</h2>
          <Input label="Titulo" error={errors.title?.message} {...register('title')} />
          <Input label="Autor / creador" error={errors.author?.message} {...register('author')} />
          <Input label="URL de portada" error={errors.cover_url?.message} {...register('cover_url')} />
          <Input label="Notas" multiline error={errors.notes?.message} {...register('notes')} />

          <div className="wishlist-form__actions">
            <Button type="submit" loading={saveMutation.isPending}>
              {editingItem ? 'Guardar' : 'Anadir'}
            </Button>
            {editingItem ? (
              <Button type="button" variant="secondary" onClick={cancelEditing}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>

        <div className="wishlist-list" aria-live="polite">
          {wishlistQuery.isLoading ? <Spinner label="Cargando lista de deseos" /> : null}

          {!wishlistQuery.isLoading && items.length ? (
            <ol className="wishlist-list__items">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  className="wishlist-item"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const draggedId = event.dataTransfer.getData('text/plain')
                    if (draggedId && draggedId !== item.id) {
                      handleMove(draggedId, item.id)
                    }
                  }}
                >
                  <span className="wishlist-item__rank">{index + 1}</span>
                  <div className="wishlist-item__cover">
                    {item.cover_url ? <img src={item.cover_url} alt={`Portada de ${item.title}`} loading="lazy" /> : <span>{item.title.slice(0, 1)}</span>}
                  </div>
                  <div className="wishlist-item__copy">
                    <strong>{item.title}</strong>
                    {item.author ? <span>{item.author}</span> : null}
                    {item.notes ? <p>{item.notes}</p> : null}
                  </div>
                  <div className="wishlist-item__actions">
                    <button type="button" aria-label="Subir" disabled={index === 0 || reorderMutation.isPending} onClick={() => handleMove(item.id, items[index - 1]?.id)}>
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label="Bajar"
                      disabled={index === items.length - 1 || reorderMutation.isPending}
                      onClick={() => handleMove(item.id, items[index + 1]?.id)}
                    >
                      ↓
                    </button>
                    <Button variant="secondary" onClick={() => startEditing(item)}>
                      Editar
                    </Button>
                    <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(item.id)}>
                      Borrar
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          ) : null}

          {!wishlistQuery.isLoading && !items.length ? (
            <p className="wishlist-list__empty">Aun no hay elementos en esta lista.</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default Wishlist
