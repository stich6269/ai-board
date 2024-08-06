import {TableStyled} from "./Table.styled.ts";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {getDailyList, Transaction, useAppStore} from "../../data";
import {useEffect, useState} from "react";
import {priceFormatter} from "../../utils/priceFormatter.ts";
import dayjs from "dayjs";

const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 200 },
    { field: 'amount', headerName: 'Amount', width: 130, valueFormatter: value => priceFormatter(value), valueGetter: v => v ? +v : 0 },
    { field: 'date', headerName: 'LDate', width: 200, valueGetter: v => +v,  valueFormatter: v => dayjs(v).format('DD MMMM YYYY HH:mm') },
    { field: 'type', headerName: 'Type', width: 170 },
    { field: 'summary', headerName: 'Information', width: 1000 },
];

export const Table = () => {
    const date = useAppStore(s => s.selectedDate);
    const [stat, setStat] = useState<Transaction[]>([]);

    useEffect(() => {
        setStat(getDailyList())
    }, [date]);

    return (
        <TableStyled>
            <DataGrid
                rows={stat}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                    },
                }}
                pageSizeOptions={[10, 100]}
            />
        </TableStyled>
    )
}
