import {issueApi} from "../../../../shared/model/issues/api.ts";
import {useQuery} from "@tanstack/react-query";
import {useMemo} from "react";

export const usePromptStat = () => {
  const {data} = useQuery(issueApi.getAll())
  
  const usersIssues = useMemo(() => {
    return data ? data.reduce((acc, it) => {
      if (acc[it.engineer]) acc[it.engineer] += it.aiUsage
      else acc[it.engineer] = it.aiUsage
      return acc
    }, {} as Record<string, number>) : {} as Record<string, number>
  }, [data])
  
  return {
  
  }
}
