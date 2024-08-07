import {DashboardStyled} from "./Dashboard.styled.ts";
import {Control} from "../components/Control";
import {Stats} from "../components/Stats";
import {Barchart} from "../components/BarChart";
import {APPPieChart} from "../components/PieChart";
import {Table} from "../components/Table";
import {getRangeList, Transaction, useAppStore} from "../data";
import {useEffect, useState} from "react";

export const Dashboard = () => {
    const date = useAppStore(s => s.selectedDate);
    const week = useAppStore(s => s.selectedWeek);
    const [stat, setStat] = useState<Transaction[]>([]);

    useEffect(() => {
        setStat(getRangeList())
    }, [date, week]);

    return (
        <DashboardStyled>
            <Control />
            <Stats />

            <div className="row">
                <Barchart />
                <APPPieChart />
            </div>

            <Table list={stat} />
        </DashboardStyled>
    )
}
