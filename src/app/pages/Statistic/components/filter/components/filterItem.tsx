import {Autocomplete, TextField} from "@mui/material";
import { Controller, Control } from "react-hook-form";
import {ReactNode} from "react";

interface Option {
  label: ReactNode;
  [key: string]: any;
}

export interface FilterItemProps {
  control: Control<any>;
  name: string;
  isFetching: boolean;
  label: string;
  options: Option[];
}

export const FilterItem = ({
  control,
  name,
  label,
  options,
  isFetching
}: FilterItemProps) => {
  
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value}}) => (
        <Autocomplete
          disabled={isFetching}
          disablePortal
          value={value}
          options={options}
          size="small"
          onChange={((_, newValue) => onChange(newValue))}
          sx={{ width: 300 }}
          renderInput={(params) => <TextField
            {...params}
            label={label}
            placeholder={'All ' + name + 's'}
            slotProps={{inputLabel: { shrink: true }}} />}
        />
      )}>
    </Controller>
  )
}