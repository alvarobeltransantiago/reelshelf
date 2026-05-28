import { forwardRef } from 'react'

import './Input.css'

const Input = forwardRef(function Input({ label, error, multiline = false, ...props }, ref) {
  const Component = multiline ? 'textarea' : 'input'

  return (
    <label className="input-field">
      <span className="input-field__label">{label}</span>
      <Component className="input-field__control" ref={ref} {...props} />
      {error ? <span className="input-field__error">{error}</span> : null}
    </label>
  )
})

export default Input
