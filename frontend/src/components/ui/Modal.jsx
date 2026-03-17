import { Modal as BootstrapModal } from 'react-bootstrap';

export function Modal({ title, onClose, children, maxWidth = 520, ...props }) {
  return (
    <BootstrapModal show onHide={onClose} centered dialogClassName={`mw-${maxWidth}`} {...props}>
      {title && (
        <BootstrapModal.Header closeButton>
          <BootstrapModal.Title className="font-serif">{title}</BootstrapModal.Title>
        </BootstrapModal.Header>
      )}
      <BootstrapModal.Body>{children}</BootstrapModal.Body>
    </BootstrapModal>
  );
}