'use client';

import { FormModal } from '../FormModal';

interface ConfirmInspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onNoClick: () => void; // New handler for "Não" button that opens Quantity Edit Modal
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
        onClose(); // Close this modal first
        onNoClick(); // Then open the Quantity Edit Modal
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={handleNoClick} // "Não" button handler (opens quantity edit modal)
            onCloseX={onClose} // X button handler (just closes the modal)
            title={title}
            submitLabel="Sim"
            cancelLabel="Não" // Set the cancel button text to "Não"
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
