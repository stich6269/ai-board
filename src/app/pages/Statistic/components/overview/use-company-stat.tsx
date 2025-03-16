import {issueApi} from "../../../../shared/model/issues/api.ts";
import {useQuery} from "@tanstack/react-query";
import {useMemo} from "react";
import {Issue, IssueType} from "../../../../shared/model/issues/types.ts";

export const useCompanyStat = () => {
  const {data} = useQuery(issueApi.getAll())
  
  const itemsByType = useMemo(() => {
    return data ? data.reduce((acc, it) => {
      if(acc[it.type]) acc[it.type].push(it);
      else acc[it.type] = [it];
      return acc;
    }, {} as Record<IssueType, Issue[]>) : {} as Record<IssueType, Issue[]>
  }, [data])
  
  const statByType = useMemo(() => {
    return (Object.keys(itemsByType) as IssueType[])
      .reduce((acc, type) => {
        return {...acc, [type]: {
            percentage: +(itemsByType[type].length / (data?.length ?? 1) * 100).toFixed(1),
            durations: countDuration(itemsByType[type])
          }};
      }, {})
  }, [itemsByType]) as Record<IssueType, {percentage: number, durations: number}>;
  
  
  return {
    companyStat: (
      <>
        {Object.entries(statByType).map(([key, value], i) => (
          <div key={i}>
            <div className="label">{key.toLowerCase()}</div>
            <div className="value">{value.percentage}% ({value.durations}h)</div>
          </div>
        ))}
      </>
    )
  }
}


const countDuration = (issues: Issue[] | undefined) => {
  return issues ? issues.reduce((acc, it) => acc + it.duration, 0) : 0;
}