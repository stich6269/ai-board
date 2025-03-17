import {useMemo} from "react";
import {aiIssuesStat} from "@helpers/ai-issues-stat.ts";
import {Issue} from "@models/issues";

export const useChartData = (issues: Issue[] = []) => {
  const {
    issuesByAI,
    aiCycleTime,
    nonAiCycleTime,
    avgCycleTime
  } = useMemo(() => aiIssuesStat(issues), [issues])
  const distanceBetweenDotsInGroup = 0.02;
  const distanceBetweenGroups = 5;
  
  const aiSeries = useMemo(() => {
    return issuesByAI?.ai.map((it, i) => ({
      x: distanceBetweenDotsInGroup*i+distanceBetweenGroups, y: it.duration, id: it.id, item: it
    }))
  }, [issuesByAI])
  
  const noAiSeries = useMemo(() => {
    return issuesByAI?.nonAi.map((it, i) => ({
      x: distanceBetweenDotsInGroup*i+distanceBetweenGroups*2, y: it.duration, id: it.id, item: it
    })) ?? []
  }, [issuesByAI])
  
  return {
    aiCycleTime,
    nonAiCycleTime,
    avgCycleTime,
    aiSeries,
    noAiSeries,
  }
}