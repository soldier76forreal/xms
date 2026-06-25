import * as React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Box } from '@mui/material';
import WebSections from '../../contextApi/webSection';
import { useState , useContext } from 'react';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
export default function MuiSelect(props) {

    const webSections = useContext(WebSections);

  return (
    <div > 
      <Autocomplete
        
        multiple
        id="tags-filled"
        options={webSections.listOfSections.map((option) => option.name)}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="filled"
            label="نقش ها"
          />
        )}
      />
      {/* <FormControl  variant="filled" sx={{ m: 1, width: props.width }}>
        <InputLabel  id="demo-simple-select-filled-label">نقش</InputLabel>
        <Select
          labelId="demo-simple-select-filled-label"
          id="demo-simple-select-filled"

        >

          {webSections.listOfSections.map((data , i) =>{
            return(
              <MenuItem key={i} value={data.value}>{data.name}</MenuItem>
            )
          })}

        </Select>
      </FormControl> */}

  </div>
  );
}
