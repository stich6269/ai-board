import {apiInstance} from "../../libs/api-instance.ts";
import {queryOptions} from "@tanstack/react-query";
import {Engineer} from "./types.ts";

export const engineerApi = {
  getAll: () => queryOptions({
    queryKey: ['engineer'],
    placeholderData: [],
    queryFn: (meta)  => apiInstance<Engineer[]>('/engineers', meta)
  })
}