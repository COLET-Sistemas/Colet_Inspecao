'use client';

import { FormModal } from '../FormModal';

interface ConfirmInspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onNoClick: () => void;
    message: string;
    title?: string;
    isSubmitting?: boolean;
}

export function ConfirmInspectionModal({
    isOpen,
    onClose,
    onConfirm,
    onNoClick,
    message,
    title = "Confirmação",
    isSubmitting = false,
}: ConfirmInspectionModalProps) {
    // Custom handler for the "Não" button
    const handleNoClick = () => {
        onClose();
        onNoClick();
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleNoClick}
            onCloseX={onClose}
            title={title}
            submitLabel="Prosseguir"
            cancelLabel="Editar quantidades"
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
