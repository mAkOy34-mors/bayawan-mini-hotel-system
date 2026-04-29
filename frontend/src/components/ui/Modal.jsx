import { Modal as BootstrapModal } from 'react-bootstrap';
import { useTranslation } from 'react-i18next'

export function Modal({ title, onClose, children, maxWidth = 520, ...props }) {
  const { t } = useTranslation()
  return (
    <BootstrapModal show onHide={onClose} centered dialogClassName={t('mwmaxwidth', 'mw-{{maxWidth}}', { maxWidth })} {...props}>
      {title && (
        <BootstrapModal.Header closeButton>
          <BootstrapModal.Title className="font-serif">{title}</BootstrapModal.Title>
        </BootstrapModal.Header>
      )}
      <BootstrapModal.Body>{children}</BootstrapModal.Body>
    </BootstrapModal>
  );
}