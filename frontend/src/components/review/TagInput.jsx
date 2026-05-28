import { useState } from 'react'

import Button from '../common/Button'
import Badge from '../common/Badge'
import { slugify } from '../../utils/slugify'
import './TagInput.css'

function TagInput({ value = [], onChange, error }) {
  const [draftTag, setDraftTag] = useState('')

  function handleAddTag() {
    const nextTag = slugify(draftTag)

    if (!nextTag || value.includes(nextTag) || value.length >= 5) {
      return
    }

    onChange([...value, nextTag])
    setDraftTag('')
  }

  function handleRemoveTag(tagToRemove) {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="tag-input">
      <div className="tag-input__row">
        <input
          type="text"
          value={draftTag}
          maxLength={30}
          placeholder="Añade un tag"
          onChange={(event) => setDraftTag(event.target.value)}
          aria-label="Añadir tag"
        />
        <Button type="button" variant="secondary" onClick={handleAddTag} disabled={value.length >= 5}>
          Añadir
        </Button>
      </div>

      <div className="tag-input__list">
        {value.map((tag) => (
          <button key={tag} type="button" className="tag-input__tag" onClick={() => handleRemoveTag(tag)}>
            <Badge>{tag}</Badge>
          </button>
        ))}
      </div>

      {error ? <span className="tag-input__error">{error}</span> : null}
    </div>
  )
}

export default TagInput
