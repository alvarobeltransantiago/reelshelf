import useToastStore from '../../store/toastStore'
import './ToastViewport.css'

function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.tone}`}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
        >
          <span className="toast__marker" aria-hidden="true" />
          <div className="toast__copy">
            <strong>{toast.title}</strong>
            {toast.message ? <span>{toast.message}</span> : null}
          </div>
          <button type="button" aria-label="Cerrar aviso" onClick={() => dismissToast(toast.id)}>
            Cerrar
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastViewport
