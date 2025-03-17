import {Issue, IssueType} from "@models/issues";
import {countDuration} from "./count-duration.ts";

type StatisticsByType = Record<IssueType, {
  percentage: number;
  durations: number;
  items: number;
}>

export const typeIssueStat =  (issues: Issue[] = []): StatisticsByType => {
  if (!issues?.length) return {} as StatisticsByType;
  
  const itemsByType = issues.reduce((acc, it) => {
    if(acc[it.type]) acc[it.type].push(it);
    else acc[it.type] = [it];
    return acc;
  }, {} as Record<IssueType, Issue[]>)
  
  return (Object.keys(itemsByType) as IssueType[])
    .reduce((acc, type) => {
      return {...acc, [type]: {
          percentage: +(itemsByType[type].length / (issues?.length ?? 1) * 100).toFixed(1),
          durations: countDuration(itemsByType[type]),
          items: itemsByType[type].length
        }};
    }, {} as StatisticsByType);
}