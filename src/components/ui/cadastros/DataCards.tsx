import { motion } from "framer-motion";
import React, { memo, useCallback } from "react";

interface DataCardsProps<T> {
    data: T[];
    renderCard: (item: T, index: number) => React.ReactNode;
    itemsPerRow?: 1 | 2 | 3 | 4;
}

// Componente de item de card memoizado
function CardItem<T extends { id: string | number }>({
    item,
    renderCard,
    index,
}: {
    item: T;
    renderCard: (item: T, index: number) => React.ReactNode;
    index: number;
}) {
    return (
        <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.5) }}
        >
            {renderCard(item, index)}
        </motion.div>
    );
}

const MemoizedCardItem = memo(CardItem) as <T extends { id: string | number }>({
    item,
    renderCard,
    index,
}: {
    item: T;
    renderCard: (item: T, index: number) => React.ReactNode;
    index: number;
}) => React.ReactElement;

// Componente DataCards otimizado com memoização
export const DataCards = memo(<T extends { id: string | number }>({
    data,
    renderCard,
    itemsPerRow = 3,
}: DataCardsProps<T>) => {
    // Determine grid columns based on itemsPerRow
    const gridCols = {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    }[itemsPerRow];

    // Memoize renderCard para garantir estabilidade de referência
    const memoizedRenderCard = useCallback(renderCard, [renderCard]);

    return (
        <div className="p-4">
            <div className={`grid ${gridCols} gap-4`}>
                {data.map((item, index) => (
                    <MemoizedCardItem
                        key={item.id}
                        item={item}
                        renderCard={memoizedRenderCard}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
}) as <T extends { id: string | number }>(props: DataCardsProps<T>) => React.ReactElement;
