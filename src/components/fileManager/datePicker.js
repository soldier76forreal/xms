import * as React from 'react';
import dayjs from 'dayjs';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { Popper } from '@mui/material';

export default function DatePickerLimit(props) {
  const [value, setValue] = React.useState(dayjs('2014-08-18T21:11:54'));

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  return (
    <Popper open={props.opemDatePicker} anchorEl={props.anchorRef.current}>
        <div>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={3}>
                
                    <DesktopDatePicker
                    mask="____/__/__"
                    // value={props.value}
                    open={props.opemDatePicker}
                    // onChange={props.onChange}
                    minDate={Date.now()}
                    renderInput={() => null} // Render no input field
                    />
                
            

            </Stack>
            </LocalizationProvider>
        </div>
    </Popper>
    
  );
}