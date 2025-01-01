import { useEffect, useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@nextui-org/react";

import { generateTableData } from "@/utils/calculator/calc-functions";

import { rpeData } from "@/utils/calculator/rpeData";

interface RPEDataTableProps {
    oneRepMax: number;
    weightUnit: string;
}

export default function RPEDataTable({
    oneRepMax,
    weightUnit,
}: RPEDataTableProps) {
    const [tableData, setTableData] = useState<typeof rpeData>({});

    const columns = [
        {
            key: "reps",
            label: "Reps",
        },
        {
            key: "1 rep",
            label: "1",
        },
        {
            key: "2 reps",
            label: "2",
        },
        {
            key: "3 reps",
            label: "3",
        },
        {
            key: "4 reps",
            label: "4",
        },
        {
            key: "5 reps",
            label: "5",
        },
        {
            key: "6 reps",
            label: "6",
        },
        {
            key: "7 reps",
            label: "7",
        },
        {
            key: "8 reps",
            label: "8",
        },
        {
            key: "9 reps",
            label: "9",
        },
        {
            key: "10 reps",
            label: "10",
        },
    ];

    useEffect(() => {
        setTableData(generateTableData(oneRepMax));
    }, [oneRepMax]);

    return (
        <div className="max-w-[800px] mx-auto">
            <Table
                aria-label="RPE data table"
                isCompact
                isStriped
                classNames={{
                    th: "text-center text-sm",
                    td: "text-center",
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.key}>
                            {column.label}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody>
                    <>
                        <TableRow>
                            {columns.map((column, index) =>
                                index === 0 ? (
                                    <TableCell key={`header-${index}`}>
                                        <span className="text-foreground-500 font-semibold">
                                            RPE
                                        </span>
                                    </TableCell>
                                ) : (
                                    <TableCell key={`header-${index}`}>
                                        <span className="text-foreground-500 font-semibold">
                                            {`(${weightUnit})`}
                                        </span>
                                    </TableCell>
                                )
                            )}
                        </TableRow>
                        {Object.entries(tableData)
                            .sort(
                                ([keyA], [keyB]) =>
                                    parseFloat(keyB) - parseFloat(keyA)
                            )
                            .map(([rpeKey, rpeData]) => (
                                <TableRow key={`rpe-${rpeKey}`}>
                                    <TableCell>
                                        <span className="text-foreground-500 font-semibold">
                                            {rpeKey}
                                        </span>
                                    </TableCell>
                                    {Object.entries(rpeData).map(
                                        ([repsKey, repsData]) => (
                                            <TableCell key={`reps-${repsKey}`}>
                                                {repsData > 0 ? repsData : "-"}
                                            </TableCell>
                                        )
                                    )}
                                </TableRow>
                            ))}
                    </>
                </TableBody>
            </Table>
        </div>
    );
}
