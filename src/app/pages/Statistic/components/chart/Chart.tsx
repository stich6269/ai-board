import {ChartStat, ChartStyled} from "./Chart.styled.ts";
import {
  ResponsiveChartContainer,
  ScatterPlot,
  ChartsGrid,
  ChartsTooltip, ChartsYAxis, ChartsReferenceLine, ChartsXAxis
} from "@mui/x-charts";
import {Issue} from "../../../../shared/model/issues/types.ts";
import {memo, useMemo} from "react";


export const Chart = memo(({issues}: {issues?: Issue[]}) => {
  const issuesMap = useMemo(() => {
    const aiMap: Record<'ai' | 'nonAi', Issue[]> = {ai: [], nonAi: []};
    issues?.forEach(item => aiMap[item.aiUsage ? 'ai' : 'nonAi'].push(item))
    return aiMap
  }, [issues])
  

  const aiSeries = useMemo(() => {
    return issuesMap.ai.map((it, i) => ({
      x: 0.01*i+5,
      y: it.duration,
      id: it.id
    }))
  }, [issuesMap])
  
  const noAiSeries = useMemo(() => {
    return issuesMap.nonAi.map((it, i) => ({
      x: 0.01*i+10,
      y: it.duration,
      id: it.id
    }))
  }, [issuesMap])
  
  console.log(aiSeries, noAiSeries);
  
  const avg1 = aiSeries.reduce((acc, it) => acc + it.y, 0) / aiSeries.length;
  const avg2 = noAiSeries.reduce((acc, it) => acc + it.y, 0) / noAiSeries.length;
  
  return (
    <ChartStyled>
      <ResponsiveChartContainer
        margin={{ top: 10, right: 50, bottom: 5, left: 30 }}
        xAxis={[{ id: 'a1', min: 0, max: 20},]}
        height={500}
        series={[
          {type: 'scatter', data: aiSeries},
          {type: 'scatter', data: noAiSeries},
        ]}
      >
        
        <ScatterPlot />
        <ChartsGrid vertical horizontal />
        <ChartsReferenceLine
          y={avg1}
          lineStyle={{ strokeDasharray: '5 5' }}
          labelStyle={{ fontSize: '10' }}
          label={`Ai assistance`}
          labelAlign="start"
        />
        <ChartsReferenceLine
          y={avg2}
          lineStyle={{ strokeDasharray: '5 5' }}
          labelStyle={{ fontSize: '10' }}
          label={`No AI assistant`}
          labelAlign="start"
        />
        <ChartsYAxis />
        <ChartsXAxis disableTicks={true} />
        <ChartsTooltip trigger='item' />
      </ResponsiveChartContainer>
      
      <ChartStat>
      </ChartStat>
    </ChartStyled>
  )
})