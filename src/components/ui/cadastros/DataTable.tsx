import { motion } from "framer-motion";
import { memo, ReactNode, useEffect, useMemo, useState } from "react";

interface DataTableProps<T> {
    data: T[];
    columns: {
        key: string;
        title: string;
        render: (item: T, index: number) => ReactNode;
        className?: string;
        headerClassName?: string;
        isSelectable?: boolean; // Indica se a coluna contém células selecionáveis
    }[];
    renderKey?: number; // Mantido para compatibilidade, mas será usado de maneira mais eficiente
}

// Componente de célula selecionável que gerencia seu próprio estado
const SelectableCell = memo(({
    children,
    itemId,
    columnKey,
    renderKey, // Adicionando renderKey como prop
}: {
    children: ReactNode;
    itemId: string | number;
    columnKey: string;
    renderKey?: number;
}) => {
    // Cada célula selecionável mantém sua própria chave de renderização
    const [cellKey, setCellKey] = useState(0);

    // Detecta mudanças nos children e atualiza apenas esta célula quando necessário
    useEffect(() => {
        setCellKey(prev => prev + 1);
    }, [children, renderKey]); // Adicionando renderKey como dependência para forçar atualização

    return (
        <div key={`selectable-${itemId}-${columnKey}-${renderKey || 0}-${cellKey}`}>
            {children}
        </div>
    );
});
SelectableCell.displayName = "SelectableCell";

// TableRow: generic, but render uses base type
function TableRow({
    item,
    columns,
    index,
    renderKey,
}: {
    item: { id: string | number };
    columns: Array<{
        key: string;
        title: string;
        render: (item: { id: string | number }, index: number) => ReactNode;
        className?: string;
        isSelectable?: boolean;
    }>;
    index: number;
    renderKey?: number;
}) {
    return (
        <motion.tr
            key={`${item.id}-${renderKey || 0}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.5) }}
            className="hover:bg-gray-50"
        >
            {columns.map((column) => (
                <td
                    key={`${item.id}-${column.key}-${renderKey || 0}`}
                    className={`px-3 sm:px-4 md:px-6 py-2 sm:py-4 text-sm ${column.className || ""}`}
                >
                    {column.isSelectable ? (
                        <SelectableCell itemId={item.id} columnKey={column.key} renderKey={renderKey}>
                            {column.render(item, index)}
                        </SelectableCell>
                    ) : (
                        column.render(item, index)
                    )}
                </td>
            ))}
        </motion.tr>
    );
}

// TableHeader: match column type, remove duplicate className
const TableHeader = memo(({
    columns,
}: {
    columns: Array<{
        key: string;
        title: string;
        render: (item: { id: string | number }, index: number) => ReactNode;
        className?: string;
        headerClassName?: string;
        isSelectable?: boolean;
    }>;
}) => {
    return (
        <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
                {columns.map((column) => (
                    <th
                        key={column.key}
                        scope="col"
                        className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.headerClassName || ""}`}
                    >
                        {column.title}
                    </th>
                ))}
            </tr>
        </thead>
    );
});
TableHeader.displayName = "TableHeader";

// DataTable: use base type for columns
export const DataTable = ({
    data,
    columns,
    renderKey = 0,
}: DataTableProps<{ id: string | number }>) => {
    // Memoize columns para garantir estabilidade de referência
    const memoizedColumns = useMemo(() => columns, [columns]);

    return (
        <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-200 table-auto">
                <TableHeader columns={memoizedColumns} />
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, index) => (
                        <TableRow
                            key={`row-${item.id}-${renderKey}`}
                            item={item}
                            columns={memoizedColumns}
                            index={index}
                            renderKey={renderKey}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};
