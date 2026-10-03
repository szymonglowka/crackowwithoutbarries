import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

/** Temporary stub. Agents replace the whole page component. */
export default function Placeholder({ title, owner }) {
  useDocumentTitle(title)
  return (
    <div className="container page">
      <h1>{title}</h1>
      <p>Strona w budowie (właściciel: {owner}).</p>
    </div>
  )
}
