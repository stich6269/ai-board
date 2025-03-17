import {Autocomplete, TextField} from "@mui/material";
import { Controller, Control } from "react-hook-form";

interface Option {
  name: string;
  [key: string]: any;
}

export interface SelectControlledProps {
  control: Control<any>;
  name: string;
  disabled: boolean;
  label: string;
  options?: Option[];
  getOptionLabel?(option: Option): string;
}

export const SelectControlled = ({
  control,
  name,
  label,
  options = [],
  disabled,
  getOptionLabel,
}: SelectControlledProps) => {
  
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value}}) => (
        <Autocomplete
          disabled={disabled}
          disablePortal
          value={value}
          options={options}
          size="small"
          getOptionLabel={getOptionLabel}
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