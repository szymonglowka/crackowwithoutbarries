// The four required states for every app page: loading, empty, offline, source error.

export function Loading({ lines = 3 }) {
  return (
    <div role="status" aria-live="polite">
      <span className="visually-hidden">Wczytywanie</span>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton" style={{ margin: '0.75rem 0', height: i === 0 ? 32 : 20 }} />
      ))}
    </div>
  )
}

export function ErrorState({ error, children }) {
  return (
    <div className="notice notice--warning" role="alert">
      <strong>Nie udało się pobrać danych.</strong>{' '}
      {children ?? (error?.status ? `Serwer odpowiedział błędem ${error.status}.` : 'Sprawdź połączenie z internetem.')}
    </div>
  )
}

export function Empty({ title = 'Nic nie znaleźliśmy', children }) {
  return (
    <div className="notice notice--info">
      <strong>{title}</strong>
      {children && <div>{children}</div>}
    </div>
  )
}
