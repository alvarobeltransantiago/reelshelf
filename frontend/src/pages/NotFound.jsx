import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

import './NotFound.css'

function NotFound() {
  return (
    <section className="not-found">
      <Helmet>
        <title>Página no encontrada | Reelshelf</title>
      </Helmet>

      <p>404</p>
      <h1>La página que buscas no existe o cambió de estantería.</h1>
      <Link to="/" className="not-found__link">
        Volver al inicio
      </Link>
    </section>
  )
}

export default NotFound
