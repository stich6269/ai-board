import {Issue} from "@models/issues/types.ts";
import {countDuration} from "./count-duration.ts";

export const aiIssuesStat = (issues: Issue[] = []) => {
  if(!issues?.length) return {};
  const totalDuration = countDuration(issues);
  const avgCycleTime = Math.round(totalDuration / (issues?.length ?? 1));
  
  const issuesByAI: Record<'ai' | 'nonAi', Issue[]> = {ai: [], nonAi: []};
  issues.forEach(item => issuesByAI[item.aiUsage ? 'ai' : 'nonAi'].push(item))
  
  const aiCycleTime = Math.round(countDuration(issuesByAI.ai) / issuesByAI.ai.length);
  const nonAiCycleTime = Math.round(countDuration(issuesByAI.nonAi) / issuesByAI.nonAi.length);
  const aiBoostPercentage = +(100 - (aiCycleTime / nonAiCycleTime) * 100).toFixed(2);
  const aiUsageDuration =  countDuration(issuesByAI.ai);
  const aiUsagePercentage =  +((issuesByAI.ai.length / issues.length) * 100).toFixed(2);
  
  
  return {
    issuesByAI,
    totalDuration,
    aiCycleTime,
    nonAiCycleTime,
    avgCycleTime,
    aiBoostPercentage,
    aiUsageDuration,
    aiUsagePercentage
  }
}