import { Badge } from 'react-bootstrap';
import { STATUS_META } from '../../constants/data';

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.PENDING;

  // Map status to Bootstrap variant or custom class
  let variant = 'secondary';
  if (status === 'PAID' || status === 'COMPLETED') variant = 'success';
  else if (status === 'PENDING') variant = 'warning';
  else if (status === 'FAILED' || status === 'CANCELLED') variant = 'danger';
  else if (status === 'REFUNDED') variant = 'info';
  else if (status === 'ACTIVE') variant = 'primary';

  return (
    <Badge bg={variant} className="px-2 py-1 text-xs font-semibold uppercase tracking-wider">
      {meta.label}
    </Badge>
  );
}