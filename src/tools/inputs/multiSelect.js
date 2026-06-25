import React from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import { useTheme } from '@mui/material/styles';

const MultiSelect = (props) => {
  const muiTheme = useTheme();
  const contactList = useSelector((state) => state.contactList);

  const colorStyles = buildColorStyles(muiTheme);
  const selectTheme = buildSelectTheme(muiTheme);

  if (props.selectType === 'userAccess') {
    return (
      <Select
        theme={selectTheme}
        styles={colorStyles}
        isMulti
        value={props.value}
        options={props.options.map((e) => ({ id: e.value, text: e.name }))}
        name="colors"
        onChange={props.onChange}
        getOptionLabel={(o) => o.text}
        getOptionValue={(o) => o.id}
        className="basic-multi-select"
        classNamePrefix="select"
      />
    );
  }

  return (
    <Select
      theme={selectTheme}
      styles={colorStyles}
      isMulti
      value={contactList.allAll
        .map((e) => ({ id: e._id, text: `${e.firstName} ${e.lastName}` }))
        .filter((e) => e.id === props.value)[0]}
      options={contactList.allAll.map((e) => ({ id: e._id, text: `${e.firstName} ${e.lastName}` }))}
      name="colors"
      onChange={props.onChange}
      getOptionLabel={(o) => o.text}
      getOptionValue={(o) => o.id}
      className="basic-multi-select"
      classNamePrefix="select"
    />
  );
};

function buildColorStyles(muiTheme) {
  const p = muiTheme.palette;
  return {
    control: (base, state) => ({
      ...base,
      backgroundColor: p.background.paper,
      borderColor: state.isFocused ? p.primary.main : p.divider,
      borderWidth: state.isFocused ? 2 : 1.5,
      borderRadius: 10,
      boxShadow: 'none',
      '&:hover': { borderColor: p.text.secondary },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: p.background.paper,
      border: `1.5px solid ${p.divider}`,
      borderRadius: 10,
      boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? p.action.selected
        : state.isFocused
          ? p.action.hover
          : 'transparent',
      color: p.text.primary,
      fontSize: 13,
      cursor: 'pointer',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: p.action.selected,
      borderRadius: 6,
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: p.text.primary,
      fontSize: 12,
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: p.text.secondary,
      borderRadius: '0 6px 6px 0',
      '&:hover': { backgroundColor: p.error.main, color: '#fff' },
    }),
    singleValue: (base) => ({ ...base, color: p.text.primary, fontSize: 13 }),
    placeholder: (base) => ({
      ...base,
      color: p.text.secondary,
      fontSize: 13,
    }),
    input: (base) => ({ ...base, color: p.text.primary }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: p.divider }),
    dropdownIndicator: (base) => ({
      ...base,
      color: p.text.secondary,
      '&:hover': { color: p.text.primary },
    }),
  };
}

function buildSelectTheme(muiTheme) {
  const p = muiTheme.palette;
  return (base) => ({
    ...base,
    borderRadius: 10,
    colors: {
      ...base.colors,
      primary25: p.action.hover,
      primary50: p.action.selected,
      primary: p.primary.main,
      neutral0: p.background.paper,
      neutral80: p.text.primary,
    },
  });
}

export default MultiSelect;
