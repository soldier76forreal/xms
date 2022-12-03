import React , {useContext} from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Checkbox from '@mui/material/Checkbox';
import Avatar from '@mui/material/Avatar';
import WebSections from '../../contextApi/webSection';
import axios from 'axios';
import AuthContext from '../authAndConnections/auth';

export default function Persons(props) {
  const webSection = useContext(WebSections);
  const authCtx = useContext(AuthContext)

  const handleToggle = (value) => () => {
    const currentIndex = props.checked.indexOf(value);
    const newChecked = [...props.checked];
    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    if(newChecked.length === 0){
        props.setIsSent(false)
    }else if(newChecked.length > 0){
        props.setIsSent(true)
    }

    props.setChecked(newChecked);
  };


  return (
    <List dense sx={{ width: '100%', maxWidth: '100%', bgcolor: 'background.paper' , marginTop:'0px' }}>
      
      {props.userData.map((value) => {
        const labelId = `checkbox-list-secondary-label-${value._id}`;
        if(value.access.includes('inv')){
        return (
          <ListItem
            dir='rtl'
            key={value._id}
            secondaryAction={
              <Checkbox
                edge="end"
                onChange={handleToggle(value._id)}
                checked={props.checked.indexOf(value._id) !== -1}
                inputProps={{ 'aria-labelledby': value.firstName }}
              />
            }
            disablePadding
          >
            <ListItemButton sx={{display:'flex'}}>
              <ListItemAvatar>
                <Avatar
                  alt={`Avatar n°${value + 1}`}
                  src={`/static/images/avatar/${value + 1}.jpg`}
                />
              </ListItemAvatar>
              <div dir='rtl' style={{textAlign:'right'}}>
                <ListItemText  id={labelId} primary={`${value.lastName} ${value.firstName}`} />
                <ListItemText sx={{color:'rgb(134, 134, 134)'}}  id={labelId} 
                primary={`نقش ها:${value.access.map(data=>{
                  for(var i=0 ; webSection.listOfSections.length >i; i++){
                    if(webSection.listOfSections[i].value === data){
                      return(
                        webSection.listOfSections[i].jobTitle
                      )
                    }
                  }
                })}`}
                
                />
              </div>
            </ListItemButton>
          </ListItem>
        );
}})}
    </List>
  );
}