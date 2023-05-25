import * as React from 'react';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

const filter = createFilterOptions();

export default function SearchInput(props) {
  const [value, setValue] = React.useState(null);
  const [open, toggleOpen] = React.useState(false);

  const handleClose = () => {
    setDialogValue({
      title: '',
      year: '',
    });
    toggleOpen(false);
  };

  const [dialogValue, setDialogValue] = React.useState({
    title: '',
    year: '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setValue({
      title: dialogValue.title,
      year: parseInt(dialogValue.year, 10),
    });
    handleClose();
  };
  var tempArr =[]
  return (
    <React.Fragment>
      <Autocomplete
        value={value}
        onChange={(event, newValue) => {
          if (typeof newValue === 'string') {
            // timeout to avoid instant validation of the dialog's form.
            setTimeout(() => {
              toggleOpen(true);
              setDialogValue({
                title: newValue,
                year: '',
              });
            });
          } else if (newValue && newValue.inputValue) {
            toggleOpen(true);
            
            tempArr.push(newValue.inputValue)
            props.setSelectedTagsForFile([newValue.inputValue , ...props.selectedTagsForFile])
            setDialogValue({
              title: newValue.inputValue,
              year: '',
            });
          } else {
            setValue(newValue);
          }
        }}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          if (params.inputValue !== '') {
            filtered.push({
              inputValue: params.inputValue,
              title: `Create tag "${params.inputValue}"`,
            });
          }

          return filtered;
        }}
        id="free-solo-dialog-demo"
        options={top100Films}
        getOptionLabel={(option) => {
          // e.g value selected with enter, right from the input
          if (typeof option === 'string') {
            return option;
          }
          if (option.inputValue) {
            return option.inputValue;
          }
          return option.title;
        }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        renderOption={(props, option) => <li {...props}>{option.title}</li>}
        sx={{ width: '100%', border:'red'  , padding:'0px'}}
        freeSolo
        renderInput={(params) => <TextField variant="outlined" 
        sx={{
            padding: 0,
            backgroundColor: 'white',
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'black',
            },
            '& label': {
                color: 'black',
                fontSize:'14px',
                padding:'0px',
                border:'none'
              },
            '& input': {
            color: 'black',
            
            padding:'0px !important',
            border:'none',
            fontSize:'14px'
            },
            '& .MuiOutlinedInput-root': {
                border: '1px solid black',
                '&:hover': {
                  border: '1px solid black',
                },
                '&.Mui-focused': {
                  border: '1px solid black',
                },
                '& fieldset': {
                  border: 'none',
                },
              },
              '& .MuiOutlinedInput-input': {
                '&::placeholder': {
                  color: 'gray',
                },
              },
            }}
            {...params}
            inputProps={{
                ...params.inputProps,
                autoComplete: 'off',
                placeholder: 'Add your tags',
              }}
         
           />}
      />

    </React.Fragment>
  );
}

// Top 100 films as rated by IMDb users. http://www.imdb.com/chart/top
const top100Films = [
    { title: 'traverted', year: 1994 }
  ];