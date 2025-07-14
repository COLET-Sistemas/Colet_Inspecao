'use client';

import { FormModal } from '../FormModal';

interface ConfirmInspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
    title?: string;
    isSubmitting?: boolean;
}

export function ConfirmInspectionModal({
    isOpen,
    onClose,
    onConfirm,
    message,
    title = "Confirmação",
    isSubmitting = false,
}: ConfirmInspectionModalProps) {
    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            submitLabel="Sim"
            onSubmit={async () => {
                onConfirm();
            }}
            isSubmitting={isSubmitting}
            size="sm"
        >
            <div className="py-2">
                <p className="text-gray-700">{message}</p>
            </div>
        </FormModal>
    );
}
