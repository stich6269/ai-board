import {FilterItem, FilterItemProps} from "./filterItem.tsx";
import {useQuery} from "@tanstack/react-query";
import {useMemo} from "react";
import {projectsApi} from "../../../../../shared/model/projects/api.ts";

type ProjectFilterProps = Omit<FilterItemProps, 'options' | 'isFetching'>

export const ProjectFilter = (props: ProjectFilterProps) => {
  const {data, isFetching} = useQuery(projectsApi.getAll());
  
  const options = useMemo(() => {
    return (data || [])
      .map(({name, ...item}) => ({label: name, ...item}));
  }, [data]);
  
  return <FilterItem
    {...props}
    isFetching={isFetching}
    options={options}
  />
}