import React, { Fragment, useState } from 'react';
import Style from './projects.module.css';
import ReactDom from 'react-dom';
import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import { useDispatch } from 'react-redux';
import { actions } from '../../store/store';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import NewProject from './newProject';
import { Grid } from '@mui/material';

const ProjectPortal = () => {
  const [newPreInvoiceStatus , setNewPreInvoiceStatus] = useState(false);
  const dispatch = useDispatch();
  const history = useHistory();
  return (
      <Fragment>
          <OpenIconSpeedDial onClick={()=>{dispatch(actions.toggleProject()); history.push('#addProjects')}}></OpenIconSpeedDial>
          <NewProject  setNewPreInvoiceStatus={setNewPreInvoiceStatus} newPreInvoiceStatus={newPreInvoiceStatus}></NewProject>
          
          <div className={Style.projects}>
            <Grid   columns={{ xs: 12, sm: 12, md: 12 , lg:12  }} sx={{ flexGrow: 1 }} rowSpacing={1} container spacing={1} item>

              <Grid item xs={2} sm='2' md='4' xl='4' >
                <div style={{height:'100px',backgroundColor:'red'}}>
                  <div className={Style.briefMarketingDiv}>
                      <div>
                        
                      </div>
                  </div>
                </div>
              </Grid>
              <Grid item xs={2} sm='2' md='6' xl='6' >
                <div style={{height:'100px',backgroundColor:'yellow'}}>
                  test
                </div>
              </Grid>
              <Grid item xs={2} sm='2' md='2' xl='2' >
                <div style={{height:'100px',backgroundColor:'blue'}}>
                  test
                </div>
              </Grid>
            </Grid>
            

          </div>
      </Fragment>
    );
};






const Projects = (props)=>{
    return(
        <Fragment>
          
            {ReactDom.createPortal(
                <ProjectPortal>

                </ProjectPortal>
                ,
                document.getElementById('crm')
                )}
        </Fragment>
    )
}
export default Projects;