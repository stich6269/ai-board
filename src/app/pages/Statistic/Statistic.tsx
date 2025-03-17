import {memo, useState} from "react";

import {ChartRow, StatisticStyled} from "./Statistic.styled.ts";
import {IssueFilters, useIssues} from "@models/issues";
import {ChartStat} from "./components/ChartStat";
import {Overview} from "./components/Overview";
import {Filter} from "./components/Filter";
import {Chart} from "./components/Chart";

export const Statistic = memo(() => {
  const [filter, setFilter] = useState<IssueFilters>({});
  const {data} = useIssues(filter);
  
  return (
    <StatisticStyled>
      <Overview />
      <Filter onFilterChange={setFilter} />
      
      <ChartRow>
        <Chart issues={data} />
        <ChartStat issues={data} />
      </ChartRow>
    </StatisticStyled>
  )
})