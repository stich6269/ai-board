import {useQuery} from "@tanstack/react-query";
import duration from "dayjs/plugin/duration";
import dayjs from "dayjs";
import {IssueFilters} from "./types.ts";
import {issueApi} from "./api.ts";
dayjs.extend(duration);

export const useIssues = (filter: IssueFilters = {}) =>  {
  const filteredFields = Object.entries(filter).filter(([_, v]) => !!v);
  const queryStr = new URLSearchParams(Object.fromEntries(filteredFields) as Record<string, string>).toString();
  
  return useQuery(issueApi.search(queryStr))
}

