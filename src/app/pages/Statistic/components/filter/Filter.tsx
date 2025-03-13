import {FilterStyled, SelectsGroup} from "./Filter.styled.ts";
import {Autocomplete, Button, TextField} from "@mui/material";
import top100Films from './top100Films';

export const Filter = () => {
  return (
    <FilterStyled>
      <SelectsGroup>
        <Autocomplete
          disablePortal
          options={top100Films}
          size="small"
          sx={{ width: 300 }}
          renderInput={(params) => <TextField {...params} label="Projects" />}
        />
        
        <Autocomplete
          disablePortal
          options={top100Films}
          size="small"
          sx={{ width: 300 }}
          renderInput={(params) => <TextField {...params} label="Teams" />}
        />
        
        <Autocomplete
          disablePortal
          options={top100Films}
          size="small"
          sx={{ width: 300 }}
          renderInput={(params) => <TextField {...params} label="Egeneers" />}
        />
      </SelectsGroup>
      
      <Button variant="outlined" size="small">Clear filters</Button>
    </FilterStyled>
  )
}