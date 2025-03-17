import {apiInstance} from "@libs/api-instance.ts";
import {queryOptions} from "@tanstack/react-query";
import {Project} from "./types.ts";

export const projectsApi = {
  getAll: queryOptions({
    queryKey: ['projects'],
    queryFn: (meta)  => apiInstance<Project[]>('/projects', meta)
  })
}