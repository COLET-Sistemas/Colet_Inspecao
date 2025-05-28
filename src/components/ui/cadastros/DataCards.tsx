import { motion } from "framer-motion";
import React, { memo } from "react";

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

function DataCardsComponent<T extends { id: string | number }>({
    data,
    renderCard,
    itemsPerRow = 3,
}: DataCardsProps<T>) {    
    const gridCols = {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",

    }[itemsPerRow];

    return (
        <div className="p-4">
            <div className={`grid ${gridCols} gap-4`}>
                {data.map((item, index) => (
                    <MemoizedCardItem
                        key={item.id}
                        item={item}
                        renderCard={renderCard}
                        index={index}
                    />
                ))}
            </div>
        </div>

    );
}

DataCardsComponent.displayName = "DataCards";

export const DataCards = memo(DataCardsComponent) as typeof DataCardsComponent;
