import {FilterItem, FilterItemProps} from "./filterItem.tsx";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useMemo} from "react";
import {teamsApi} from "../../../../../shared/model/teams/api.ts";
import {Project} from "../../../../../shared/model/projects/types.ts";
import {Team} from "../../../../../shared/model/teams/types.ts";

type TeamFilterProps = Omit<FilterItemProps, 'options' | 'isFetching'> & {
  project: Project | null;
  setValue: (name: any, v: Team | null) => void;
}

export const TeamFilter = ({project, setValue, ...props}: TeamFilterProps) => {
  const {data, isFetching} = useQuery(teamsApi.getAll());
  
  const options = useMemo(() => {
    return (data || [])
      .filter(it => project ? project.teams.includes(it.id) : true)
      .map(it => ({label: it.name, ...it}))
  }, [data, project]);
  
  useEffect(() => {
    if(!project || project.teams.length !== 1) setValue(props.name, null);
    else setValue(props.name, options[0])
  }, [project]);
  
  return <FilterItem
    {...props}
    isFetching={isFetching}
    options={options}
  />
}