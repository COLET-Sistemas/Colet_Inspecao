import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import React, { memo, useEffect, useState } from 'react';
import { Tooltip } from './Tooltip';

interface SelectableCheckboxProps {
    id: string;
    isSelected: boolean;
    onToggle: (id: string) => void;
    renderKey?: number; // Para forçar re-renderização quando necessário
}

// Componente de checkbox que gerencia seu próprio estado visual
export const SelectableCheckbox = memo(
    ({ id, isSelected, onToggle, renderKey }: SelectableCheckboxProps) => {
        // Estado local para gerenciar a aparência visual do checkbox
        const [checked, setChecked] = useState(isSelected);

        // Atualiza o estado interno quando as props mudam
        useEffect(() => {
            setChecked(isSelected);
        }, [isSelected, renderKey]);

        const handleToggle = (e: React.MouseEvent) => {
            e.stopPropagation(); // Evita propagação do evento
            // Atualiza imediatamente o estado visual
            setChecked(!checked);
            // Notifica o componente pai sobre a mudança
            onToggle(id);
        };

        return (
            <Tooltip text={checked ? "Desmarcar" : "Marcar"}>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1 rounded p-1 cursor-pointer"
                    onClick={handleToggle}
                    aria-label={checked ? "Desmarcar" : "Marcar"}
                >
                    {checked ? (
                        <div className="w-5 h-5 rounded border border-blue-500 bg-blue-50 flex items-center justify-center">
                            <Check className="h-4 w-4 text-blue-600 stroke-[2.5px]" />
                        </div>
                    ) : (
                        <div className="w-5 h-5 rounded border border-gray-300 bg-white"></div>
                    )}
                </motion.button>
            </Tooltip>
        );
    }
);

SelectableCheckbox.displayName = 'SelectableCheckbox';