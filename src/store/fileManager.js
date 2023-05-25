import { createSlice, createAsyncThunk , configureStore, current } from '@reduxjs/toolkit';
import axios from 'axios';
import { useSelector } from 'react-redux';
import thunk from 'redux-thunk'; // Import the redux-thunk middleware

export const fetchData = createAsyncThunk('getFilesAndFolders/fetchData', async (theData, { dispatch } ) => {
  try{
    dispatch(actions.loading(true))
    const response = await theData.authCtx.jwtInst({
        method:'get',
        url:`${theData.axiosGlobal.defaultTargetApi}/files/getAllFileAndFolders`,
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
    })
    dispatch(actions.data(response.data))
    dispatch(actions.loading(false))
  }catch(err){
    dispatch(actions.error(err))
  }
});
export const uploadFile = createAsyncThunk('getFilesAndFolders/uploadFile', async (theData, { dispatch , getState } ) => {

  const uploadQueue = getState().uploadQueue
    for(var i = 0 ; uploadQueue.length>i ; i++){
      if(uploadQueue[i].uploaded !== true){
        if(uploadQueue[i].cancel === false){
          dispatch(actions.updateUploadStatus({index:i , status:true}))
          const formData = new FormData();
          formData.append('images' , uploadQueue[i].file);
          formData.append('supFolder' , theData.currentDisplay.id)
          const cancelToken = axios.CancelToken.source()
          console.log(cancelToken)
          try{
              const response = await theData.authCtx.jwtInst({
                  method:'post',
                  url:`${theData.axiosGlobal.defaultTargetApi}/files/uploadFile`,
                  data:formData ,
                  cancelToken:cancelToken,
                  //progress bar precentage
                  onUploadProgress: data => {                           
                      dispatch(actions.updateProgress({index:i , progress:Math.round((100 * data.loaded) / data.total)}))
                    },
                  config: { headers: {'Content-Type': 'multipart/form-data' }}
              })
              dispatch(actions.updateUploadStatus({index:i , status:false}))
              dispatch(actions.updateUploadOveralStatus({index:i , status:true}))
              const data = await response.data;
          }catch(error){
            dispatch(actions.updateUploadError({index:i , error:{status:true , msg:error}}))
            dispatch(actions.updateUploadOveralStatus({index:i , status:false}))

          }
        }  
      }
    }

});



export const setFilesAsync = createAsyncThunk('getFilesAndFolders/fetchData', async (theData, { dispatch , getState  } ) => {
  
  var temp = []
  await theData.files.forEach(element => {
    temp.push({uploading:false , cancel:false , file:element, progress:0 , uploaded:null , error:{status:false , msg:''}})
  })
  return temp;
});
const dataSlice = createSlice({
  name: 'getFilesAndFolders',
  initialState: { data: [] , currentDisplay:{} , float:[] , loading: false, error: null , uploadQueue:[] },
  reducers: {
    data(state , action){
      state.data = action.payload
      state.float=[]
      const pathname = window.location.pathname;
      const parts = pathname.split('/');
      const deleteEmpty = parts.filter(e => {return e !== ''})
      const root= action.payload.filter(e =>{return e.doc.supFolder === 'root'})
      state.float.push({name:'XFILE' , id:'root',docs:root})
      var tempId = 'root'
      var tempSubs = []
      if(deleteEmpty.length > 1){
        for(var j = 1 ; deleteEmpty.length > j ; j++){
          var lastFloat = state.float[state.float.length-1]
          for(var k = 0 ; lastFloat.docs.length > k ; k++){
            if(lastFloat.docs[k].doc.name === deleteEmpty[j]){
              for(var n = 0 ; action.payload.length > n ; n++){
                if(JSON.stringify(action.payload[n].doc.supFolder) === JSON.stringify(lastFloat.docs[k].doc._id)){
                  tempSubs.push(action.payload[n])
                }
              }
              state.float.push({name:lastFloat.docs[k].doc.name , id:lastFloat.docs[k].doc._id, docs:tempSubs});
              tempSubs=[]
            }
          }
        }
      }
      state.currentDisplay = state.float[state.float.length-1]
    },
    loading(state , action){
      state.loading = action.payload
    },
    error(state , action){
      state.error = action.payload
    },
    setFolder(state , action){
      state.float=[]
      const pathname = window.location.pathname;
      const parts = pathname.split('/');
      const deleteEmpty = parts.filter(e => {return e !== ''})
      const root= state.data.filter(e =>{return e.doc.supFolder === 'root'})
      state.float.push({name:'XFILE' , id:'root',docs:root})
      var tempSubs = []
      if(deleteEmpty.length > 1){
        for(var j = 1 ; deleteEmpty.length > j ; j++){
          var lastFloat = state.float[state.float.length-1]
          for(var k = 0 ; lastFloat.docs.length > k ; k++){
            if(lastFloat.docs[k].doc.name === deleteEmpty[j]){
              for(var n = 0 ; state.data.length > n ; n++){
                if(JSON.stringify(state.data[n].doc.supFolder) === JSON.stringify(lastFloat.docs[k].doc._id)){
                  tempSubs.push(state.data[n])
                }
              }
              state.float.push({name:lastFloat.docs[k].doc.name , id:lastFloat.docs[k].doc._id, docs:tempSubs});
              tempSubs=[]
            }
          }
        }
      }
      state.currentDisplay = state.float[state.float.length-1]
    },
    updateUploadStatus(state , action){
      state.uploadQueue[action.payload.index].uploading = action.payload.status
      console.log(current(state.uploadQueue))
    },
    updateProgress(state , action){
      state.uploadQueue[action.payload.index].progress = action.payload.progress
      console.log(current(state.uploadQueue))
    },
    updateUploadError(state , action){
      state.uploadQueue[action.payload.index].error = action.payload.error
      console.log(current(state.uploadQueue))
    },
    updateUploadOveralStatus(state , action){
      state.uploadQueue[action.payload.index].uploaded = action.payload.status
      console.log(current(state.uploadQueue))
    },
    cancelTheUploading(state , action){
      state.uploadQueue[action.payload.index].uploaded = action.payload.uploaded;
      state.uploadQueue[action.payload.index].uploading = action.payload.uploading;
      state.uploadQueue[action.payload.index].cancel = action.payload.cancel;
    }
  },
  extraReducers:builder =>{
    builder.addCase(setFilesAsync.fulfilled, (state,action)=>{
      if(action.payload !== undefined){
        const temp =action.payload;
        state.uploadQueue = state.uploadQueue.concat(temp);
      }
    })
  }
});

export const { actions, reducer } = dataSlice;
  const store = configureStore({
      reducer: dataSlice.reducer,
      middleware: [thunk] // Include the redux-thunk middleware
  }
 )
 

 export default store;