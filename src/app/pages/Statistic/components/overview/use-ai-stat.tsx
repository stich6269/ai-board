import {issueApi} from "../../../../shared/model/issues/api.ts";
import {useQuery} from "@tanstack/react-query";
import {useMemo} from "react";
import {Issue} from "../../../../shared/model/issues/types.ts";

export const useAiStat = () => {
  const {data} = useQuery(issueApi.getAll())
  const duration = useMemo(() => countDuration(data), [data])
  const cycleTime = useMemo(() => Math.round(duration / (data?.length ?? 1)), [duration])
  
  const issuesByAi = useMemo(() => {
    const aiMap: Record<'ai' | 'nonAi', Issue[]> = {ai: [], nonAi: []};
    data?.forEach(item => aiMap[item.aiUsage ? 'ai' : 'nonAi'].push(item))
    return aiMap
  }, [data])
  
  const aiCycle = useMemo(() => {
    return Math.round(countDuration(issuesByAi.ai) / issuesByAi.ai.length)
  }, [issuesByAi])
  
  const nonAiCycle = useMemo(() => {
    return Math.round(countDuration(issuesByAi.nonAi) / issuesByAi.nonAi.length)
  }, [issuesByAi])
  
  return {
    cycleStat: (
      <>
        Average time {cycleTime} <br/>
        No AI cycle time {nonAiCycle} <br/>
        With AI cycle time {aiCycle} <br/>
        AI performance {(100 - (aiCycle / nonAiCycle) * 100).toFixed(2)}% <br/>
        Time save by AI
      </>
    )
  }
}

const countDuration = (issues: Issue[] | undefined) => {
  return issues ? issues.reduce((acc, it) => acc + it.duration, 0) : 0;
}