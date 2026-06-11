import { statusBadgeClasses } from '../lib/statusRules'

export default function StatusBadge({ status }) {
  return <span className={`badge ${statusBadgeClasses(status)}`}>{status}</span>
}
