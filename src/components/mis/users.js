import { Fragment , useContext, useState} from 'react';
import GetDatas from '../../contextApi/getDatas';
import OpenIconSpeedDial from '../../tools/buttons/speedDial';
import MainNav from '../../tools/navs/mainNav';
import ExpendUserAc from './expendUserAc';
import NewUser from './newUser';
import Style from './users.module.scss';



const Users = (props) =>{
    const userDatas = useContext(GetDatas);
    const [newUserStatus , setNewUserStatus] = useState(false);

    
    return(
        <Fragment>
            <MainNav></MainNav>
            <NewUser newUserStatus = {newUserStatus} setNewUserStatus={setNewUserStatus}></NewUser>
            <OpenIconSpeedDial onClick={()=>{setNewUserStatus(true)}}></OpenIconSpeedDial>
            <div className={Style.usersDiv}>
                <h2>کاربرها</h2>
                {userDatas.userData.map((data , i)=>{
                    return(
                        <div className={Style.expendDiv}>
                            <ExpendUserAc data={data} key={i}/> 
                        </div>
                    )
                })}

            </div>
        </Fragment>
    )
}
export default Users;