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

export default function RPEDataTable({ oneRepMax }: { oneRepMax: number }) {
    const [tableData, setTableData] = useState({});

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

    const rpeEntries = Object.entries(tableData);

    useEffect(() => {
        setTableData(generateTableData(oneRepMax));
        console.log(generateTableData(oneRepMax));
    }, [oneRepMax]);

    return (
        <Table aria-label="RPE data table" isCompact isStriped>
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <span className="text-foreground-500 font-semibold">
                            RPE
                        </span>
                    </TableCell>
                    <TableCell>{""}</TableCell>
                    <TableCell>{""}</TableCell>
                    <TableCell>{""}</TableCell>
                    <TableCell>{""}</TableCell>
                    <TableCell>{""}</TableCell>
                    <TableCell>{""}</TableCell>
                    <TableCell>{""}</TableCell>
                    <TableCell>{""}</TableCell>
                    <TableCell>{""}</TableCell>
                    <TableCell>{""}</TableCell>
                </TableRow>
                {Object.entries(tableData)
                    .sort(
                        ([keyA], [keyB]) => parseFloat(keyB) - parseFloat(keyA)
                    )
                    .map(([rpeKey, rpeData]) => (
                        <TableRow key={`rpe-${rpeKey}`}>
                            <TableCell>{rpeKey}</TableCell>
                            {Object.entries(rpeData).map(
                                ([repsKey, repsData]) => (
                                    <TableCell key={`reps-${repsKey}`}>
                                        {repsData > 0 ? repsData : "-"}
                                    </TableCell>
                                )
                            )}
                        </TableRow>
                    ))}
            </TableBody>
        </Table>
    );
}
