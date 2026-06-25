import * as React from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

const toggleBtnSx = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  px: 2,
  py: 0.75,
  textTransform: 'none',
};

export default function ToggleBtn(props) {
  const [listType, setListType] = React.useState('all');
  const [sort, setSort] = React.useState('all');
  const [callType, setCallType] = React.useState('');
  const [callStatus, setCallStatus] = React.useState('');
  const [prInfos, setPrInfos] = React.useState('prRequests');

  const handleChangePrInfos = (_, newValue) => {
    setPrInfos(newValue);
    props.setListType(newValue);
  };
  const handleChangeType = (_, newValue) => {
    setListType(newValue);
    props.setListType(newValue);
  };
  const handleChangeSort = (_, newValue) => {
    setSort(newValue);
    props.setListSort(newValue);
  };
  const handleChangeCallType = (_, newValue) => {
    setCallType(newValue);
    props.setCallReason(newValue);
  };
  const handleChangeCallStatus = (_, newValue) => {
    setCallStatus(newValue);
    props.setCallStatus(newValue);
  };

  if (props.type === 'type') {
    return (
      <ToggleButtonGroup color="primary" value={listType} exclusive onChange={handleChangeType}>
        <ToggleButton sx={toggleBtnSx} value="edited">ویرایش شده ها</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value="sendRequest">دریافتی ها</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value="newInvoice">تکمیل شده ها</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value="all">همه</ToggleButton>
      </ToggleButtonGroup>
    );
  }

  if (props.type === 'sort') {
    return (
      <ToggleButtonGroup color="primary" value={sort} exclusive onChange={handleChangeSort}>
        <ToggleButton sx={toggleBtnSx} value="notVisited">اعلان های مشاهده نشده</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value="visited">اعلان های مشاهده شده</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value="all">همه</ToggleButton>
      </ToggleButtonGroup>
    );
  }

  if (props.type === 'callType') {
    return (
      <ToggleButtonGroup color="primary" value={callType} exclusive onChange={handleChangeCallType}>
        <ToggleButton sx={toggleBtnSx} value="sales">Sale</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value="requestFollowUp">Follow up request</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value="invoiceFollowUp">Invoice tracking</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value="customerSatisfaction">Customer satisfaction</ToggleButton>
      </ToggleButtonGroup>
    );
  }

  if (props.type === 'callStatus') {
    return (
      <ToggleButtonGroup color="primary" value={callStatus} exclusive onChange={handleChangeCallStatus}>
        <ToggleButton sx={toggleBtnSx} value={true}>Answered</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value={false}>No answer</ToggleButton>
      </ToggleButtonGroup>
    );
  }

  if (props.type === 'prInfos') {
    return (
      <ToggleButtonGroup color="primary" value={prInfos} exclusive onChange={handleChangePrInfos}>
        <ToggleButton sx={toggleBtnSx} value="prRequests">درخواست ها</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value="prCalls">تماس ها</ToggleButton>
        <ToggleButton sx={toggleBtnSx} value="prInformation">مشخصات</ToggleButton>
      </ToggleButtonGroup>
    );
  }

  return null;
}
