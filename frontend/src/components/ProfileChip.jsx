import { Link } from 'react-router-dom'
import { describeProfile, useProfile } from '../hooks/useProfile.js'

/** Shows, in text, which profile results are matched against. */
export default function ProfileChip() {
  const [profile] = useProfile()
  return (
    <p className="profile-chip">
      <span>Profil: {describeProfile(profile)}</span>{' '}
      <Link to="/moje-potrzeby">Zmień</Link>
    </p>
  )
}
