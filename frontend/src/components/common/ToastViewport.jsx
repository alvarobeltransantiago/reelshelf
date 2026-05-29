import useToastStore from '../../store/toastStore'
import './ToastViewport.css'

function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  return (
    <div className="toast-viewport" role="status" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`}>
          <div className="toast__copy">
            <strong>{toast.title}</strong>
            {toast.message ? <span>{toast.message}</span> : null}
          </div>
          <button type="button" aria-label="Cerrar aviso" onClick={() => dismissToast(toast.id)}>
            x
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastViewport
