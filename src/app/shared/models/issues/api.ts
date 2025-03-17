
import {apiInstance} from "@libs/api-instance.ts";
import {queryOptions} from "@tanstack/react-query";
import {Issue} from "./types.ts";
import dayjs from "dayjs";


export const issueApi = {
  search: (query: string = '') => queryOptions({
    queryKey: ['issues', query],
    queryFn: meta  => apiInstance<Issue[]>('/issues' + (query ? `?${query}` : ''), meta),
    select: data => [...data].map(issue => ({...issue, duration: countDuration(issue)}))
  })
}

const countDuration = ({startDate, endDate}: Issue) => {
  const start = dayjs.unix(startDate);
  const end = dayjs.unix(endDate);
  const diff = dayjs.duration(start.diff(end)).asHours();
  
  return Math.abs(Math.round(diff))
}