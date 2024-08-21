import {TransactionsStyled} from "./Transactions.styled.ts";
import {Table} from "../../components/Table";
import {Transaction, TransactionTypes, useAppStore} from "../../data/clients";
import {Button, ButtonGroup, TextField} from "@mui/material";
import {useEffect, useState} from "react";

export const Transactions = () => {
    const [filter, setFilter] = useState<TransactionTypes>();
    const [search, setSearch] = useState<string>('');
    const [filteredList, setFilteredList] = useState<Transaction[]>([]);
    const sourceList = useAppStore(s => s.transactions);

    useEffect(() => {
        if(filter || search) setFilteredList(
            sourceList.filter(it => {
                const isTypeOk = filter ? it.type === filter : true;
                const isSearchOk = search ? it.number.toString().includes(search) : true;

                return isSearchOk && isTypeOk
            })
        || [])
        else setFilteredList(sourceList)
    }, [filter, sourceList, search])

    return (
        <TransactionsStyled>
            <div className="controls">
                <TextField
                    label="Search"
                    sx={{width: '260px'}}
                    id="outlined-size-small"
                    value={search}
                    onChange={v =>  setSearch(v.target.value || '')}
                    size="small"
                />

                <ButtonGroup variant="contained"
                             aria-label="Basic button group"
                             disableElevation>


                    <Button onClick={() => setFilter(TransactionTypes.DEPOSIT)}
                            color={filter === TransactionTypes.DEPOSIT ? "warning" : "primary"} >
                        Deposit
                    </Button>
                    <Button onClick={() => setFilter(TransactionTypes.WITHDRAWN)}
                            color={filter === TransactionTypes.WITHDRAWN ? "warning" : "primary"} >
                        Withdrawn
                    </Button>
                    <Button onClick={() => setFilter(TransactionTypes.OTHER_TRAN)}
                            color={filter === TransactionTypes.OTHER_TRAN ? "warning" : "primary"} >
                        Other
                    </Button>
                    <Button onClick={() => setFilter(TransactionTypes.FAILED_ATM)}
                            color={filter === TransactionTypes.FAILED_ATM ? "warning" : "primary"} >
                        Failed ATM
                    </Button>
                    <Button onClick={() => setFilter(TransactionTypes.FAILED_CUSTOMER)}
                            color={filter === TransactionTypes.FAILED_CUSTOMER ? "warning" : "primary"} >
                        Failed customer
                    </Button>
                    <Button onClick={() => setFilter(undefined)}
                            color={!filter ? "warning" : "primary"} >
                        All
                    </Button>
                </ButtonGroup>
            </div>

            <Table list={filteredList} pageSize={100} className='table' />
        </TransactionsStyled>
    )
}
