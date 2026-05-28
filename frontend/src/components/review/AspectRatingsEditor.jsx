import RatingInput from './RatingInput'
import { getAspectFields } from '../../utils/reviewOptions'
import './AspectRatingsEditor.css'

function AspectRatingsEditor({ category, value = {}, onChange, error }) {
  function updateAspect(key, nextValue) {
    onChange({
      ...value,
      [key]: nextValue,
    })
  }

  return (
    <section className="aspect-ratings">
      <div className="aspect-ratings__header">
        <h2>Aspectos</h2>
        <p>Tu nota general convive con una lectura mas fina del medio.</p>
      </div>

      <div className="aspect-ratings__grid">
        {getAspectFields(category).map((aspect) => (
          <RatingInput
            key={aspect.key}
            label={aspect.label}
            value={value[aspect.key] || 7}
            onChange={(nextValue) => updateAspect(aspect.key, nextValue)}
          />
        ))}
      </div>

      {error ? <span className="aspect-ratings__error">{error}</span> : null}
    </section>
  )
}

export default AspectRatingsEditor
