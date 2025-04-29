import { motion } from "framer-motion";
import React, { memo, ReactNode, useMemo } from "react";

interface DataTableProps<T> {
    data: T[];
    columns: {
        key: string;
        title: string;
        render: (item: T, index: number) => ReactNode;
        className?: string; 
    }[];
}

// Componente de linha da tabela memoizado para evitar re-renderizações desnecessárias
const TableRow = memo(({
    item,
    columns,
    index,
}: {
    item: any;
    columns: Array<{
        key: string;
        title: string;
        render: (item: any, index: number) => ReactNode;
        className?: string;
    }>;
    index: number;
}) => {
    return (
        <motion.tr
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}
            className="hover:bg-gray-50"
        >
            {columns.map((column) => (
                <td
                    key={`${item.id}-${column.key}`}
                    className={`px-3 sm:px-4 md:px-6 py-2 sm:py-4 text-sm ${column.className || ""}`}
                >
                    {column.render(item, index)}
                </td>
            ))}
        </motion.tr>
    );
});

// Componente do cabeçalho da tabela memoizado
const TableHeader = memo(({
    columns,
}: {
    columns: Array<{
        key: string;
        title: string;
        render: (item: any, index: number) => ReactNode;
        className?: string;
    }>;
}) => {
    return (
        <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
                {columns.map((column) => (
                    <th
                        key={column.key}
                        scope="col"
                        className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ""}`}
                    >
                        {column.title}
                    </th>
                ))}
            </tr>
        </thead>
    );
});

// Componente DataTable otimizado com memoização
export const DataTable = memo(<T extends { id: string | number }>({
    data,
    columns,
}: DataTableProps<T>) => {
    // Memoize columns para garantir estabilidade de referência
    const memoizedColumns = useMemo(() => columns, [
        // hash simplificado das colunas para evitar re-renderizações desnecessárias
        columns.map(col => col.key).join(',')
    ]);

    return (
        <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
                <TableHeader columns={memoizedColumns} />
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, index) => (
                        <TableRow
                            key={item.id}
                            item={item}
                            columns={memoizedColumns}
                            index={index}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}) as <T extends { id: string | number }>(props: DataTableProps<T>) => React.ReactElement;
