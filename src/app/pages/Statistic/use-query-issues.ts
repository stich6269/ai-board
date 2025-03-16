import {FilterForm} from "./components/filter/Filter.tsx";
import {useQuery} from "@tanstack/react-query";
import {issueApi} from "../../shared/model/issues/api.ts";

export const useQueryIssues = (filter: FilterForm) => {
  const formValues = {
    project: filter.project?.id,
    team: filter.team?.id,
    engineer: filter.engineer?.id,
  }
  const filteredFields = Object.entries(formValues).filter(([_, v]) => !!v);
  const queryStr = new URLSearchParams(Object.fromEntries(filteredFields) as Record<string, string>).toString();
  const {data} = useQuery(issueApi.getAll(queryStr))
  
  return {data}
}