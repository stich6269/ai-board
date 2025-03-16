import {StatisticStyled} from "./Statistic.styled.ts";
import {Chart} from "./components/chart";
import {Filter} from "./components/filter";
import {Overview} from "./components/overview";
import {FilterForm} from "./components/filter/Filter.tsx";
import {useState} from "react";
import {useQueryIssues} from "./use-query-issues.ts";

export const Statistic = () => {
  const [filter, setFilter] = useState<FilterForm>({} as FilterForm);
  const {data} = useQueryIssues(filter);
  
  return (
    <StatisticStyled>
      <Overview />
      <Filter onFilterChange={setFilter} />
      <Chart issues={data} />
    </StatisticStyled>
  )
}