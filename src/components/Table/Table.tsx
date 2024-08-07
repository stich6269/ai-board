import {TableStyled} from "./Table.styled.ts";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {Transaction} from "../../data";
import {priceFormatter} from "../../utils/priceFormatter.ts";
import dayjs from "dayjs";

const columns: GridColDef[] = [
    { field: 'number', headerName: 'Number', width: 200 },
    { field: 'amount', headerName: 'Amount', width: 130, valueFormatter: value => priceFormatter(value), valueGetter: v => v ? +v : 0 },
    { field: 'date', headerName: 'LDate', width: 200, valueGetter: v => +v,  valueFormatter: v => dayjs(v).format('DD MMMM YYYY HH:mm') },
    { field: 'type', headerName: 'Type', width: 170 },
    { field: 'summary', headerName: 'Information', width: 1000 },
];

interface TableProps {
    list: Transaction[];
    pageSize?: number;
    className?: string;
}
export const Table = ({list, pageSize = 10, className}: TableProps) => {
    return (
        <TableStyled className={className}>
            <DataGrid
                rows={list}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: { page: 0, pageSize },
                    },
                }}
                pageSizeOptions={[10, 100]}
            />
        </TableStyled>
    )
}
