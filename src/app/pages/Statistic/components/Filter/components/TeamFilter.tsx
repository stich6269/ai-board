import {useEffect, useMemo} from "react";

import {SelectControlled, SelectControlledProps} from "@ui/SelectControlled.tsx";
import {Team, useTeams} from "@models/teams";
import {Project} from "@models/projects";

type TeamFilterProps = Omit<SelectControlledProps, 'options' | 'disabled'> & {
  project: Project | null;
  setValue: (name: any, v: Team | null) => void;
}

export const TeamFilter = ({project, setValue, ...props}: TeamFilterProps) => {
  const {data, isFetching} = useTeams();
  
  const options = useMemo(() => {
    return (data || []).filter(it => project ? project.teams.includes(it.id) : true)
  }, [data, project]);
  
  useEffect(() => {
    // autofill if only one option in a list
    if(!project || project.teams.length !== 1) setValue(props.name, null);
    else setValue(props.name, options[0])
  }, [options, setValue]);
  
  
  useEffect(() => {
    if(!data?.length) return;
    // autofill if only one option in a list
    if(!project || project.teams.length !== 1) setValue(props.name, null);
    else setValue(props.name, options[0])
  }, [project]);
  
  return <SelectControlled
    {...props}
    disabled={isFetching}
    options={options}
    getOptionLabel={opt=> opt.name}
  />
}