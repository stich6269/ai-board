import {
  ResponsiveChartContainer,
  ScatterPlot,
  ChartsGrid,
  ChartsTooltip,
  ChartsYAxis,
  ChartsReferenceLine,
  ChartsXAxis
} from "@mui/x-charts";
import {memo} from "react";

import {useChartData} from "./use-chart-data.ts";
import {ChartStyled} from "./Chart.styled.ts";
import {Issue} from "@models/issues";
import {Tooltip} from "./Tooltip.tsx";

export const Chart = memo(({issues}: {issues?: Issue[]}) => {
  const {
    aiSeries,
    noAiSeries,
    aiCycleTime,
    nonAiCycleTime,
    avgCycleTime
  } = useChartData(issues);
  
  return (
    <ChartStyled>
      <ResponsiveChartContainer
        margin={{ top: 10, right: 50, bottom: 5, left: 30 }}
        xAxis={[{ id: 'a1', min: 0, max: 20 },]} // number to limit xAxis to show data (autoscale does not fit)
        height={500}
        series={[
          {type: 'scatter', data: aiSeries,  color: '#76b7b2', markerSize: 5},
          {type: 'scatter', data: noAiSeries,  color: '#f28e2c', markerSize: 5},
        ]}
      >
        
        <ScatterPlot />
        <ChartsGrid vertical horizontal />
        {aiCycleTime && <ChartsReferenceLine
          y={aiCycleTime}
          lineStyle={{ strokeDasharray: '5 5', stroke: '#76b7b2', strokeWidth: 2}}
          labelStyle={{ fontSize: '10' }}
          label={`Ai assistance`}
          labelAlign="end"
        />}
        {nonAiCycleTime && <ChartsReferenceLine
          y={nonAiCycleTime}
          lineStyle={{ strokeDasharray: '5 5', stroke: '#f28e2c', strokeWidth: 2}}
          labelStyle={{ fontSize: '10' }}
          label={`No AI assistant`}
          labelAlign="end"
        />}
        {avgCycleTime && <ChartsReferenceLine
          y={avgCycleTime}
          lineStyle={{ strokeDasharray: '5 5' }}
          labelStyle={{ fontSize: '10' }}
          label={`Average cycle`}
          labelAlign="end"
        />}
        <ChartsYAxis />
        <ChartsXAxis disableTicks={true} />
        <ChartsTooltip trigger='item' itemContent={Tooltip} />
      </ResponsiveChartContainer>
    </ChartStyled>
  )
})