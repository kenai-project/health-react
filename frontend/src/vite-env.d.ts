/// <reference types="vite/client" />

declare module 'react'

declare module 'react-dom/client'

declare module 'react/jsx-runtime'

declare module '*.css' {
  const classes: Record<string, string>
  export default classes
}

