import {FilterStyled, SelectsGroup} from "./Filter.styled.ts";
import {Button} from "@mui/material";
import {useForm} from "react-hook-form";
import {ProjectFilter} from "./components/projectFilter.tsx";
import {TeamFilter} from "./components/teamFilter.tsx";
import {EngineerFilter} from "./components/engineerFilter.tsx";

export const Filter = () => {
  const {control, reset, watch, setValue} = useForm({
    defaultValues: {
      project: null,
      team: null,
      engineer: null,
    }
  });
  
  return (
    <FilterStyled>
      <SelectsGroup>
        <ProjectFilter
          control={control}
          name='project'
          label='Project' />
        
        <TeamFilter
          control={control}
          setValue={setValue}
          name='team'
          label='Team'
          project={watch('project')}/>
        
        <EngineerFilter
          control={control}
          setValue={setValue}
          name='engineer'
          label='Engineer'
          team={watch('team')}
          project={watch('project')}/>
      </SelectsGroup>
      
      <Button variant="outlined" size="small" onClick={() => reset({})}>Clear filters</Button>
    </FilterStyled>
  )
}