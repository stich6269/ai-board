import {memo} from "react";

import {SelectControlled, SelectControlledProps} from "@ui/SelectControlled.tsx";
import {useProjects} from "@models/projects";

type ProjectFilterProps = Omit<SelectControlledProps, 'options' | 'disabled'>

export const ProjectFilter = memo((props: ProjectFilterProps) => {
  const {data, isFetching} = useProjects();
  
  return <SelectControlled
    {...props}
    disabled={isFetching}
    options={data}
    getOptionLabel={opt=> opt.name}
  />
})