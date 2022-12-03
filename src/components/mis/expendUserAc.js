import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Avatar from '@mui/material/Avatar';
import WebSections from '../../contextApi/webSection';
import { useContext } from 'react';

export default function ExpendUserAc(props) {
  const webSections = useContext(WebSections);
  return (
    <div>
      <Accordion dir='rtl'>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>
            <div style={{width:'100%' , display:'flex' , alignItems:'center'}}>
                <Avatar
                alt={`Avatar n°${1 + 1}`}
                src={`/static/images/avatar/${1 + 1}.jpg`}
                />
                <div>
                    <div style={{fontSize:'18px' , marginRight:'8px' , padding:'0px'}}>{`${props.data.firstName} ${props.data.lastName}`}</div>
                    <div style={{fontSize:'13px' , color:'rgb(69, 69, 69)' , marginRight:'8px' , padding:'0px'}}>{`نقش ها:${props.data.access.map(data=>{
                      for(var i=0 ; webSections.listOfSections.length >i; i++){
                        if(webSections.listOfSections[i].value === data){
                          return(
                            webSections.listOfSections[i].jobTitle
                          )
                        }
                      }
                    })}`}</div>
                </div>

            </div>
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            malesuada lacus ex, sit amet blandit leo lobortis eget.
          </Typography>
        </AccordionDetails>
      </Accordion>

    </div>
  );
} 