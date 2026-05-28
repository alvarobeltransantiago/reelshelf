import './Modal.css'

function Modal({ open, title, children, onClose }) {
  if (!open) {
    return null
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button type="button" className="modal__backdrop" aria-label="Cerrar modal" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__header">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar modal">
            Cerrar
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
