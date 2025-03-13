import {StatisticStyled} from "./Statistic.styled.ts";
import {Chart} from "./components/chart";
import {Filter} from "./components/filter";
import {Overview} from "./components/overview";

export const Statistic = () => {
  return (
    <StatisticStyled>
      <Overview />
      <Filter />
      <Chart />
    </StatisticStyled>
  )
}