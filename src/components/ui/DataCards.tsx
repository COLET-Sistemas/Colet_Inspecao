import { motion } from "framer-motion";
import React from "react";

interface DataCardsProps<T> {
    data: T[];
    renderCard: (item: T, index: number) => React.ReactNode;
    itemsPerRow?: 1 | 2 | 3 | 4;
}

export function DataCards<T extends { id: string | number }>({
    data,
    renderCard,
    itemsPerRow = 3,
}: DataCardsProps<T>) {
    // Determine grid columns based on itemsPerRow
    const gridCols = {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    }[itemsPerRow];

    return (
        <div className="p-4">
            <div className={`grid ${gridCols} gap-4`}>
                {data.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                        {renderCard(item, index)}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
