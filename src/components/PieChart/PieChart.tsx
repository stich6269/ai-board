import {PieChartStyled} from "./PieChart.styled.ts";
import {PieChart} from "@mui/x-charts";
import {getDailyStatistic, useAppStore} from "../../data";
import {useEffect, useState} from "react";

export const APPPieChart = () => {
    const date = useAppStore(s => s.selectedDate);
    const [stat, setStat] = useState<any>([]);

    useEffect(() => {
        setStat(Object
            .entries(getDailyStatistic())
            .map(([_k, value]) => ({
                value,
                label: _k
            })))
    }, [date]);

    return (
        <PieChartStyled>
            <div className="title">Atm statistic</div>

            <PieChart
                slotProps={{
                    legend: {
                        position: {
                            vertical: 'middle',
                            horizontal: 'right',
                        },
                        itemMarkWidth: 20,
                        itemMarkHeight: 2,
                        markGap: 5,
                        itemGap: 10,
                    }
                }}
                series={[
                    {
                        data: stat,
                        arcLabel: item => item.value + '',
                        arcLabelMinAngle: 25,
                        innerRadius: 30,
                        outerRadius: 100,
                        paddingAngle: 5,
                        cornerRadius: 5,
                        startAngle: -90,
                        endAngle: 270,
                        cx: 150,
                        cy: 130,
                    }
                ]}
            />
        </PieChartStyled>
    )
}
