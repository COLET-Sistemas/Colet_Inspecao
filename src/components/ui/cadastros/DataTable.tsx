import { motion } from "framer-motion";
import React from "react";

interface DataTableProps<T> {
    data: T[];
    columns: {
        key: string;
        title: string;
        render: (item: T, index: number) => React.ReactNode;
    }[];
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
}: DataTableProps<T>) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {column.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, index) => (
                        <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="hover:bg-gray-50"
                        >
                            {columns.map((column) => (
                                <td key={`${item.id}-${column.key}`} className="px-6 py-4">
                                    {column.render(item, index)}
                                </td>
                            ))}
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
