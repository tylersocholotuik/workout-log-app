import {useMemo} from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
} from "@heroui/react";

import {generateTableData, convertEffortRating} from "@/utils/calculator/calculator";

import {rpeData} from "@/utils/calculator/rpeData";

import {WeightUnit, EffortRatingType} from "@/types";

interface RPEDataTableProps {
    oneRepMax: number;
    weightUnit: WeightUnit;
    effortType: EffortRatingType;
}

export default function RPEDataTable({
                                         oneRepMax,
                                         weightUnit,
                                         effortType,
                                     }: RPEDataTableProps) {
    const tableData = useMemo<typeof rpeData>(
        () => generateTableData(oneRepMax),
        [oneRepMax]
    );

    const columns = [
        { key: "reps", label: "Reps" },
        { key: "1 rep", label: "1" },
        { key: "2 reps", label: "2" },
        { key: "3 reps", label: "3" },
        { key: "4 reps", label: "4" },
        { key: "5 reps", label: "5" },
        { key: "6 reps", label: "6" },
        { key: "7 reps", label: "7" },
        { key: "8 reps", label: "8" },
        { key: "9 reps", label: "9" },
        { key: "10 reps", label: "10" }
    ];

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
                                            {effortType === "rpe" ? "RPE" : "RIR"}
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
                                    {[
                                        <TableCell key={`rpe-label-${rpeKey}`}>
                                            <span className="text-foreground-500 font-semibold">
                                                {/* Don't display RIR equivalent of x.5 RPE values */}
                                                {effortType === "rpe"
                                                    ? rpeKey
                                                    : Number.isInteger(parseFloat(rpeKey))
                                                        ? convertEffortRating(parseFloat(rpeKey))
                                                        : ""
                                                }
                                            </span>
                                        </TableCell>,
                                        ...Object.entries(rpeData).map(
                                            ([repsKey, repsData]) => (
                                                <TableCell key={`reps-${repsKey}`}>
                                                    {(effortType === "rir" &&
                                                        !Number.isInteger(parseFloat(rpeKey))) ||
                                                    repsData === 0
                                                        ? "-" : repsData
                                                    }
                                                </TableCell>
                                            )
                                        ),
                                    ]}
                                </TableRow>
                            ))}
                    </>
                </TableBody>
            </Table>
        </div>
    );
}
