// Icons with a distinct SHAPE per status, so status is never conveyed by colour alone.
// Always rendered next to a text label; the icon itself is aria-hidden.
const shapes = {
  // match statuses
  match: <><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.5" fill="none" /></>,
  barrier: <><path d="M12 2L23 21H1z" fill="currentColor" /><path d="M12 9v5M12 16.5v1.5" stroke="#fff" strokeWidth="2.5" /></>,
  unknown: <><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2.5" /><text x="12" y="16.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor">?</text></>,
  info: <><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 10v7M12 7v.5" stroke="currentColor" strokeWidth="2.5" /></>,
  // reliability statuses
  confirmed: <><path d="M12 1l3 3h5v5l3 3-3 3v5h-5l-3 3-3-3H4v-5l-3-3 3-3V4h5z" fill="currentColor" /><path d="M7.5 12.5l3 3 6-6" stroke="#fff" strokeWidth="2.5" fill="none" /></>,
  open_data: <><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M7 9h10M7 13h10M7 17h6" stroke="currentColor" strokeWidth="2" /></>,
  user_report: <><path d="M3 4h18v12H10l-5 4v-4H3z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" /></>,
  conflicting: <><path d="M12 1l11 11-11 11L1 12z" fill="currentColor" /><path d="M8 10h8l-2-2M16 14H8l2 2" stroke="#fff" strokeWidth="2" fill="none" /></>,
  outdated: <><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M12 6v6l4 3" stroke="currentColor" strokeWidth="2.5" fill="none" /></>,
  missing: <><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2.5" /><path d="M8 12h8" stroke="currentColor" strokeWidth="2.5" /></>,
  sample: <><path d="M4 3h16v18H4z" fill="none" stroke="currentColor" strokeWidth="2.5" /><path d="M8 8h8M8 12h8M8 16h4" stroke="currentColor" strokeWidth="2" strokeDasharray="2 1.5" /></>,
}

export default function StatusIcon({ status, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {shapes[status] ?? shapes.info}
    </svg>
  )
}
