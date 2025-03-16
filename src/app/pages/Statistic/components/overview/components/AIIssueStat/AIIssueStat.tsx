import {issueApi} from "../../../../../../shared/model/issues/api.ts";
import {useQuery} from "@tanstack/react-query";
import {useMemo} from "react";
import {aiIssuesStat} from "../../../../../../shared/libs/ai-issues-stat.ts";

export const AIIssueStat = () => {
  const {data} = useQuery(issueApi.getAll())
  const {
    avgCycleTime,
    aiCycleTime,
    nonAiCycleTime,
    aiBoostPercentage
  } = useMemo(() => aiIssuesStat(data), [data])
  
  return (
      <>
        Average time {avgCycleTime} <br/>
        No AI cycle time {nonAiCycleTime} <br/>
        With AI cycle time {aiCycleTime} <br/>
        AI performance {aiBoostPercentage}% <br/>
      </>
    )
}