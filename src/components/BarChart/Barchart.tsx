import {BarchartStyled} from "./Barchart.styled.ts";
import {LineChart} from "@mui/x-charts";
import {getRangeTransactionsByType, useAppStore} from "../../data";
import {useEffect, useState} from "react";

export const Barchart = () => {
    const date = useAppStore(s => s.selectedDate);
    const week = useAppStore(s => s.selectedWeek);
    const [stat, setStat] = useState<any>([]);
    const [xSet, setXSet] = useState<string[]>([]);

    const timeline = new Array(24).fill(0).map((_it, i) => i + '');
    const dayLine = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    useEffect(() => {
        setStat(Object
            .entries(getRangeTransactionsByType())
            .map(([_k, value]) => {
                const sum = new Array(week ? 7 : 24).fill(0);

                value.forEach(it => sum[week ? it.date.weekday() : it.date.hour()] += 1);
                return {data: sum, showMark: false, label: _k}
            }))

        setXSet(week ? dayLine : timeline);
    }, [date, week])

    return (
        <BarchartStyled>
            <span className="title">ATM daily usage</span>

            <LineChart
                width={600}
                height={290}
                slotProps={{ legend: { hidden: true } }}
                xAxis={[{
                    data: xSet,
                    tickSize: 10,
                    scaleType: "point",
                    valueFormatter: it => week ? it : (it >= 10 ? `${it}:00` : `0${it}:00`)
                }]}
                series={stat}
            />
        </BarchartStyled>
    )
}
