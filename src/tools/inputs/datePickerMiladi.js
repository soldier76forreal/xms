import * as React from 'react';
import dayjs from 'dayjs';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import Style from './datePickerMiladi.module.scss'

export default function MiladiDatePicker(props) {
  const [value, setValue] = React.useState(dayjs('2014-08-18T21:11:54'));

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  return (
    <div className={Style.datePickerDiv}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack spacing={3}>
            <DesktopDatePicker
            mask="____/__/__"
            value={props.value}
          
            onChange={props.onChange}

            renderInput={(params) => <TextField {...params} />}
            />

        </Stack>
        </LocalizationProvider>
    </div>
  );
}