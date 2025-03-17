import {apiInstance} from "@libs/api-instance.ts";
import {queryOptions} from "@tanstack/react-query";
import {Team} from "./types.ts";

export const teamsApi = {
  getAll: queryOptions({
    queryKey: ['teams'],
    placeholderData: [],
    queryFn: (meta)  => apiInstance<Team[]>('/teams', meta)
  })
}