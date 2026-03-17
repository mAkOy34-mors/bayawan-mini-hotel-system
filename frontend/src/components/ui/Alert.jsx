import { Alert as BootstrapAlert } from 'react-bootstrap';

export function Alert({ alert }) {
  if (!alert) return null;

  const variant = alert.type === 'success' ? 'success' : 'danger';

  return (
    <BootstrapAlert variant={variant} className="mb-4">
      {alert.msg}
    </BootstrapAlert>
  );
}