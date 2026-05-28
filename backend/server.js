import app from './src/app.js'

const port = process.env.PORT || 3001

app.listen(port, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Backend running on http://localhost:${port}`)
  }
})
