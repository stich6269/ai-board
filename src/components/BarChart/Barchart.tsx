import {BarchartStyled} from "./Barchart.styled.ts";
import {LineChart} from "@mui/x-charts";
import {getDailyTransactions, useAppStore} from "../../data";
import {useEffect, useState} from "react";

export const Barchart = () => {
    const date = useAppStore(s => s.selectedDate);
    const [stat, setStat] = useState<any>([]);
    const timeline = new Array(24).fill(0).map((_it, i) => i);
    console.log(timeline)

    useEffect(() => {
        setStat(Object
            .entries(getDailyTransactions())
            .map(([_k, value]) => {
                const sum = new Array(24).fill(0);
                value.forEach(it => sum[it.date.hour()] += 1);

                return {data: sum, showMark: false, label: _k}
            }))
    }, [date])

    return (
        <BarchartStyled>
            <span className="title">Atm daily usage</span>

            <LineChart
                width={535}
                height={290}
                slotProps={{ legend: { hidden: true } }}
                xAxis={[{
                    data: timeline,
                    tickSize: 10,
                    scaleType: "point",
                    valueFormatter: it => it >= 10 ? `${it}:00` : `0${it}:00`
                }]}
                series={stat}
            />
        </BarchartStyled>
    )
}
