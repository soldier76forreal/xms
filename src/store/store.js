import { createSlice, createAsyncThunk , configureStore, current } from '@reduxjs/toolkit';
import axios from 'axios';

import { useSelector } from 'react-redux';
import thunk from 'redux-thunk'; // Import the redux-thunk middleware
import { getImageSize  } from 'react-image-size';
import fileDownload from 'js-file-download';
import Fuse from 'fuse.js';

const getRootFileEntries = (items = [], wrapAsFile = false) => {
  const rootEntry = items.find(e => e?.doc === 'root');
  const subs = Array.isArray(rootEntry?.subs) ? rootEntry.subs : [];
  return wrapAsFile ? subs.map(e => ({file:e})) : subs;
};

const getFolderChildren = (items = [], folderId) => {
  return items.filter(e => JSON.stringify(e?.doc?.supFolder) === JSON.stringify(folderId));
};

const getChildFiles = (entry) => {
  return Array.isArray(entry?.subs) ? entry.subs.filter(e => e?.file !== undefined) : [];
};




//------------------------------file manager start
export const fetchData = createAsyncThunk('getFilesAndFolders/fetchData', async (theData, { dispatch } ) => {
  try{
    dispatch(actions.loading(true))
    const response = await theData.authCtx.jwtInst({
        method:'get',
        url:`${theData.axiosGlobal.defaultTargetApi}/files/getAllFileAndFolders`,
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
    })
    dispatch(actions.data(response.data))
    setTimeout(()=>{
      dispatch(actions.loading(false))
    }, 500)
   
  }catch(err){
    dispatch(actions.error(err))
  }
});
export const uploadFile = createAsyncThunk('getFilesAndFolders/uploadFile', async (theData, { dispatch , getState } ) => {

  const uploadQueue = getState().uploadQueue
  
  const lastQueueCount = getState().lastQueueCount

  
    var i
    for(i = getState().lastQueueCount ; uploadQueue.length>i ; i++){

        if(uploadQueue[i].uploadType === 'fileManager'){
          dispatch(actions.setOnGoingUpload(true))

          dispatch(actions.setQueueCount({lastCount:i}))

          if(uploadQueue[i].uploaded !== true){
            if(uploadQueue[i].cancel === false){

              dispatch(actions.updateUploadStatus({index:i , status:true}))
              
              const formData = new FormData();
              formData.append('files' , uploadQueue[i].file);
              formData.append('supFolder' , theData.currentDisplay.id)
              // dispatch(actions.cancelToken({index:i , token:cancelToken}))

              try{
                  const response = await theData.authCtx.jwtInst({
                      method:'post',
                      url:`${theData.axiosGlobal.defaultTargetApi}/files/uploadFile`,
                      data:formData ,
                      cancelToken:uploadQueue[i].cancelToken.token,
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
                if (axios.isCancel(error)) {

                } else {
                  // Handle other errors
                }
                console.log(error)
                dispatch(actions.updateUploadError({index:i , error:{status:true , msg:error}}))
                dispatch(actions.updateUploadOveralStatus({index:i , status:false}))

              }
            }  
          }
      }else if(uploadQueue[i].uploadType === 'jobReport'){
        dispatch(actions.setOnGoingUpload(true))

        dispatch(actions.setQueueCount({lastCount:i}))

        if(uploadQueue[i].uploaded !== true){
          if(uploadQueue[i].cancel === false){

            dispatch(actions.updateUploadStatus({index:i , status:true}))
            
            const formData = new FormData();
            formData.append('files' , uploadQueue[i].file);
            formData.append('supFolder' , 'root')
            // dispatch(actions.cancelToken({index:i , token:cancelToken}))

            try{
                const response = await theData.authCtx.jwtInst({
                    method:'post',
                    url:`${theData.axiosGlobal.defaultTargetApi}/files/jobReportUpload`,
                    data:formData ,
                    cancelToken:uploadQueue[i].cancelToken.token,
                    //progress bar precentage
                    onUploadProgress: data => {                           
                        dispatch(actions.updateProgress({index:i , progress:Math.round((100 * data.loaded) / data.total)}))
                        
                      },
                    config: { headers: {'Content-Type': 'multipart/form-data' }}
                })
                dispatch(actions.updateUploadStatus({index:i , status:false}))
                dispatch(actions.updateUploadOveralStatus({index:i , status:true}))
                const data = await response.data;
                dispatch(actions.setJobReportProfile(data))                
            }catch(error){
              if (axios.isCancel(error)) {

              } else {
                // Handle other errors
              }
              console.log(error)
              dispatch(actions.updateUploadError({index:i , error:{status:true , msg:error}}))
              dispatch(actions.updateUploadOveralStatus({index:i , status:false}))

            }
          }  
        }
      }
    
    }
    dispatch(actions.refresh())

    dispatch(actions.setOnGoingUpload(false))

});





export const getAllTags = createAsyncThunk('getFilesAndFolders/getAllTags', async (theData, { dispatch , getState } ) => {
        
    try{
        const response = await theData.authCtx.jwtInst({
            method:'get',
            url:`${theData.axiosGlobal.defaultTargetApi}/files/getAllFileAndFoldersTags`,
            config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
        })
        const data = await response.data;
        dispatch(actions.getAllTags(data))
        dispatch(actions.tagsForListDisp())
        dispatch(actions.tagToShow())
    }catch(error){
      console.log(error)

    }

});



export const newLink = createAsyncThunk('getFilesAndFolders/newLink', async (theData, { dispatch , getState } ) => {
        
  try{
      dispatch(actions.newLinkCreationLoading(true))
      const response = await theData.authCtx.jwtInst({
          method:'post',
          data:{document:theData.document , timer:theData.timer , msg:theData.msg , displayName:theData.displayName},
          url:`${theData.axiosGlobal.defaultTargetApi}/files/createNewLink`,
          config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
      const data = await response.data;
      // Copy the text inside the text field
      navigator.clipboard.writeText(`${window.location.origin}/showLink?token=${data}`);

      setTimeout(()=>{
        dispatch(actions.newLinkCreationLoading(false))
      }, 800)

  }catch(error){
    console.log(error)

  }

});

export const downloadFileFolder = createAsyncThunk(
  'getFilesAndFolders/downloadFileFolder',
  async (theData, { dispatch, rejectWithValue }) => {
    try {
      // Start Loading
      // dispatch(setDownloading(true));


      const response = await theData.authCtx.jwtInst({
        method: 'get',
        params: { selected: theData.selected },
        responseType: "blob",
        url: `${theData.axiosGlobal.defaultTargetApi}/files/downloadFileFolders`,
        // We no longer need onDownloadProgress here
      });

      // --- Success: Trigger Browser Download ---
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisp = response.headers['content-disposition'];
      const fileName = contentDisp 
        ? contentDisp.split('filename=')[1].replace(/"/g, '') 
        : `download-${Date.now()}.zip`;

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Download Error:", error);
      return rejectWithValue(error.response?.data || "Download failed");
    } finally {
      // End Loading regardless of success or failure
      // dispatch(setDownloading(false));
      console.log('true')
    }
  }
);






export const deleteTag = createAsyncThunk('getFilesAndFolders/deleteTag', async (theData, { dispatch , getState } ) => {
        
  try{
      const response = await theData.authCtx.jwtInst({
          method:'post',
          data:{tagId:theData.tagId , selected:theData.selected},
          url:`${theData.axiosGlobal.defaultTargetApi}/files/deleteTagFromFileFolder`,
          config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
      dispatch(actions.refreshTag())


  }catch(error){
    console.log(error)

  }

});


export const setFilesAsync = createAsyncThunk('getFilesAndFolders/fetchData', async (theData, { dispatch , getState  } ) => {
  
  var temp = []
  await theData.files.forEach(element => {
    temp.push({uploadType:theData.uploadType ,  uploading:false , cancel:false , cancelToken:axios.CancelToken.source() , file:element, progress:0 , uploaded:null , show:true , error:{status:false , msg:''}})
  })
  return temp;
});

export const setFileForRetry = createAsyncThunk('getFilesAndFolders/setFileForRetry', async (theData, { dispatch , getState  } ) => {
  return theData.index
});

//------------------------------file manager end
















//------------------------------overall assets start

export const getFilter = createAsyncThunk('overallAssets/getFilter', async (theData, { dispatch , getState } ) => {
        
  try{
      const response = await theData.authCtx.jwtInst({
          method:'get',
          url:`${theData.axiosGlobal.defaultTargetApi}/users/getFilter`,
          config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
      const data = await response.data;
      dispatch(actions.setFilter(data))
    }catch(error){
    console.log(error)

  }

});

export const frequentBtnClickForCrmAxios = createAsyncThunk('overallAssets/frequentBtnClickForCrm', async (theData, { dispatch , getState } ) => {
  try{
      const response = await theData.authCtx.jwtInst({
        method:'post',
        data:{customerId:theData.customerId,btn:theData.btn},
        url:`${theData.axiosCtx.defaultTargetApi}/crm/frequentBtnClickForCrm`,
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
      
  }catch(err){
      console.log(err);
  }

});

export const userProfileData = createAsyncThunk('overallAssets/profileData', async (theData, { dispatch , getState } ) => {
  try{
      const response = await theData.authCtx.jwtInst({
        method:'get',
        url:`${theData.axiosGlobal.defaultTargetApi}/users/userProfileData`,
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
      dispatch(actions.setJobReportTitles(response.data.jobReportPresets))
      dispatch(actions.setUserProfile(response.data))

  }catch(err){
      console.log(err);
  }

});
//------------------------------overall assets end










//------------------------------CRM start

export const getCustomers = createAsyncThunk('overallAssets/getCustomers', async (theData, { dispatch , getState } ) => {
    dispatch(actions.crmLoadingStatus({loading:true , retry:false}))
    var limit = getState().crmShowLimit;
    try{
        const response = await theData.authCtx.jwtInst({
          method:'get',
          url:`${theData.axiosGlobal.defaultTargetApi}/crm/getAllCustomer`,
          config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
        })

        dispatch(actions.crmSetPr(response.data))
        dispatch(actions.crmLoadingStatus({loading:false , retry:false}))
    }catch(err){
        setTimeout(()=>{
            dispatch(actions.crmLoadingStatus({loading:false , retry:true}))
        }, 10000);
        console.log(err);
    }

});



//------------------------------CRM end






//------------------------------MIS start

export const getInvoices = createAsyncThunk('overallAssets/getInvoices', async (theData, { dispatch , getState } ) => {
  dispatch(actions.misLoadingStatus({loading:true , retry:false}))
  try{
      const response = await theData.authCtx.jwtInst({
        method:'get',
        url:`${theData.axiosGlobal.defaultTargetApi}/mis/getInvoices`,
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
      dispatch(actions.misSetInvoices(response.data))
      dispatch(actions.misLoadingStatus({loading:false , retry:false}))
  }catch(err){
      setTimeout(()=>{
          dispatch(actions.misLoadingStatus({loading:false , retry:true}))
      }, 10000);
      console.log(err);
  }

});

//------------------------------MIS end








  //------------------------------contact list
    
    export const getContacts = createAsyncThunk('contact/getContacts', async (theData, { dispatch , getState } ) => {
        try{
            const response = await theData.authCtx.jwtInst({
              method:'get',
              url:`${theData.axiosGlobal.defaultTargetApi}/users/getAllUsers`,
              config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.setContactListDetails(response.data))
        }catch(err){
            console.log(err);
        }

    });
  //------------------------------contact list


  //------------------------------job report start
      export const getSubmitedJobReports = createAsyncThunk('contact/getJobReportForCurrentUser', async (theData, { dispatch , getState } ) => {
        try{
            const response = await theData.authCtx.jwtInst({
              method:'get',
              url:`${theData.axiosGlobal.defaultTargetApi}/jobReport/getJobReportForCurrentUser`,
              config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
            })
            dispatch(actions.setJobReportsForPerson(response.data))
        }catch(err){
            console.log(err);
        }

    });
  //------------------------------job report end

  //------------------------------inventory start
    export const getProductsTree = createAsyncThunk(
      "inventory/getProductsTree",
      async (theData, { rejectWithValue }) => {
        try {
          const response = await theData.authCtx.jwtInst({
            method: "get",
            url: `${theData.axiosGlobal.defaultTargetApi}/inventory/products/tree`,
            headers: {
              "Content-Type": "application/json"
            }
          });

          return Array.isArray(response.data?.data) ? response.data.data : [];
        } catch (err) {
          return rejectWithValue(
            err.response?.data?.message || "Failed to fetch products"
          );
        }
      }
    );
  //------------------------------inventory end



const dataSlice = createSlice({
  name: 'getFilesAndFolders',
  initialState: {
    //------------------------------file manager 
    currentImageGallery:[], tagsToShow:[], downloadNavMenu:[], tagsForList:[] , refreshTag:0 ,data: [], routeLink:[] , selectedItems:[] , currentDisplay:{} , float:[] , loading: false, error: null , tempDoc:{} , uploadQueue:[] ,routeLinkFilePicker:[] ,currentDisplayFilePicker:{}, floatFilePicker:[] , allTags:[] , refresh:1 , lastQueueCount:0 , onGoingUpload:false , newLinkCreationLoading:false,
    //------------------------------overall assets
    filterCrm:{},
    filterMis:{},
    userProfile:{},
    userProfileRefresh:2,
    showSnackBar:{status:false , msg:'' , type:''},
    contactList : {sa:[],inv:[],req:[] , all:[] , allAll:[] , lenght:0},


    //------------------------------job report start
    jobReportsForPerson:[],
    jobReportTitles:[],

    //------------------------------job report end

    //------------------------------overall assets

    jobReportUploadedFile:[],
    //------------------------------crm
    crmRefresh:'',
    crmLoading:{loading:false , retry:false},
    customerToShow:[],
    crmAllPersons:[],
    setTargetDocForCom:{docItSelf:'' , status:false , platform:'' , channel:''},
    crmLimit:20,
    crmHasMore:false,
    newCustomer:false,
    newProject:false,
    lastInsertedCustomer:{id:'',name:''},
    searchRes:[],
    searchForCrm :{searched:[] ,  loading:false , retry:false},
    //------------------------------mis
    misRefresh:'',
    invoicesToShow:[],
    misAllInvoices:[],
    misLimit:20,
    newInvoice:false,
    editInvoice:false,
    misHasMore:false,
    misLoading:{loading:false , retry:false},
    //------------------------------inventory
    newRootProduct:false,
    newSubProduct:false,
    productsTree: [],
    productLoading: false,
    productError: null,
    productRefresh:'', 
    selectedRootProduct:null
  },
  reducers: {
    //------------------------------file manager start
    data(state , action){
      state.loading = false
      const filesAndFolders = Array.isArray(action.payload) ? action.payload : [];
      state.data = filesAndFolders
      state.float=[]
      const pathname = decodeURI(window.location.pathname);
      const parts = pathname.split('/');
      const deleteEmpty = parts.filter(e => {return e !== ''})
      const root= getFolderChildren(filesAndFolders, 'root')
      var reMapFiles = getRootFileEntries(filesAndFolders)
      var conactFileAndFolderForRoot = root.concat(reMapFiles)
      state.float.push({name:'XFILE' , id:'root',docs:conactFileAndFolderForRoot})
      var tempSubs = []
      if(deleteEmpty.length > 1){
        for(var j = 1 ; deleteEmpty.length > j ; j++){
          var lastFloat = state.float[state.float.length-1]
          if(Array.isArray(lastFloat?.docs) && lastFloat.docs.length > 0)
            for(var k = 0 ; lastFloat.docs.length > k ; k++){
              if(lastFloat.docs[k].doc !== undefined)
                if(lastFloat.docs[k].doc.name === deleteEmpty[j]){
                  for(var n = 0 ; filesAndFolders.length > n ; n++){
                    if(JSON.stringify(filesAndFolders[n]?.doc?.supFolder) === JSON.stringify(lastFloat.docs[k].doc._id)){
                      tempSubs.push(filesAndFolders[n])
                    }
                  }
                  var childFiles = getChildFiles(lastFloat.docs[k]);
                  for(var g = 0 ; childFiles.length>g ; g++){
                    tempSubs.push(childFiles[g]);
                  }
                  state.float.push({name:lastFloat.docs[k].doc.name , id:lastFloat.docs[k].doc._id, docs:tempSubs});
                  tempSubs=[]
                }
            }
        }
      }

      state.currentDisplay = state.float[state.float.length-1]
      
      state.floatFilePicker = state.float
      state.routeLinkFilePicker = state.routeLink
      state.currentDisplayFilePicker = state.currentDisplay
      //delete root route from the url
      
      var tempForRoute = deleteEmpty.filter(e=>e !== 'files');
      var route = '';
      state.routeLink = []
      for(var r = 0 ; tempForRoute.length>r ; r++){
        for(var s = 0 ; tempForRoute.length>s ; s++){
          //if they were not equal push secont one to the route
          if(tempForRoute[r] !== tempForRoute[s]){
            route = `${route}/${decodeURI(tempForRoute[s])}`
          //if they were equal push the last of the first in the end of the route and go for next
          }else if(tempForRoute[r] === tempForRoute[s]){
            route = `${route}/${decodeURI(tempForRoute[r])}`
            break
          }
        }
        state.routeLink.push(route)
        route = ''
      }
      state.loading = false

    },
    loading(state , action){
      state.loading = action.payload
    },
    error(state , action){
      state.error = action.payload
    },
    setFolder(state , action){
      state.loading = true
      state.float=[]
      const pathname = decodeURI(window.location.pathname);
      const parts = pathname.split('/');
      const deleteEmpty = parts.filter(e => {return e !== ''})
      const root= getFolderChildren(state.data, 'root')
      var reMapFiles = getRootFileEntries(state.data)
      var conactFileAndFolderForRoot = root.concat(reMapFiles)
      state.float.push({name:'XFILE' , id:'root',docs:conactFileAndFolderForRoot})
      var tempSubs = []
      if(deleteEmpty.length > 1){
        for(var j = 1 ; deleteEmpty.length > j ; j++){
          var lastFloat = state.float[state.float.length-1]
          if(Array.isArray(lastFloat?.docs) && lastFloat.docs.length > 0)
            for(var k = 0 ; lastFloat.docs.length > k ; k++){
              if(lastFloat.docs[k].doc !== undefined)
                if(lastFloat.docs[k].doc.name === deleteEmpty[j]){
                  for(var n = 0 ; state.data.length > n ; n++){
                    if(JSON.stringify(state.data[n]?.doc?.supFolder) === JSON.stringify(lastFloat.docs[k].doc._id)){
                      tempSubs.push(state.data[n])
                    }
                  }
                  var childFiles = getChildFiles(lastFloat.docs[k]);
                  for(var g = 0 ; childFiles.length>g ; g++){
                    tempSubs.push(childFiles[g]);
                  }
                  state.float.push({name:lastFloat.docs[k].doc.name , id:lastFloat.docs[k].doc._id, docs:tempSubs});
                  tempSubs=[]
                }
            }
        }
      }
      state.currentDisplay = state.float[state.float.length-1]
      state.floatFilePicker = state.float
      state.routeLinkFilePicker = state.routeLink
      state.currentDisplayFilePicker = state.currentDisplay

        //delete root route from the url
        var tempForRoute = deleteEmpty.filter(e=>e !== 'files');
        var route = '';
        state.routeLink = []
        for(var r = 0 ; tempForRoute.length>r ; r++){
          for(var s = 0 ; tempForRoute.length>s ; s++){
            //if they were not equal push secont one to the route
            if(tempForRoute[r] !== tempForRoute[s]){
              route = `${route}/${decodeURI(tempForRoute[s])}`
            //if they were equal push the last of the first in the end of the route and go for next
            }else if(tempForRoute[r] === tempForRoute[s]){
              route = `${route}/${decodeURI(tempForRoute[r])}`
              break
            }
          }
          state.routeLink.push(route)
          route = ''
        }
        state.loading = false
    },


    openFilePickerFolder(state , action){
      state.floatFilePicker=[]
      const pathname = window.location.pathname.replace(/%20/g, ' ');
      const parts = pathname.split('/');
      const deleteEmpty = parts.filter(e => { return e !== ''})
      const root= getFolderChildren(state.data, 'root')
      var reMapFiles = getRootFileEntries(state.data, true)
      var conactFileAndFolderForRoot = root.concat(reMapFiles)
      state.floatFilePicker.push({name:'XFILE' , id:'root',docs:conactFileAndFolderForRoot})
      var tempSubs = []
      if(deleteEmpty.length > 1){
        for(var j = 1 ; deleteEmpty.length > j ; j++){
          var lastFloat = state.floatFilePicker[state.floatFilePicker.length-1]
          if(Array.isArray(lastFloat?.docs) && lastFloat.docs.length > 0)
            for(var k = 0 ; lastFloat.docs.length > k ; k++){
              if(lastFloat.docs[k].doc !== undefined)
                if(lastFloat.docs[k].doc.name === deleteEmpty[j]){
                  for(var n = 0 ; state.data.length > n ; n++){
                    if(JSON.stringify(state.data[n]?.doc?.supFolder) === JSON.stringify(lastFloat.docs[k].doc._id)){
                      tempSubs.push(state.data[n])
                    }
                  }
                  var childFiles = getChildFiles(lastFloat.docs[k]);
                  for(var g = 0 ; childFiles.length>g ; g++){
                    tempSubs.push(childFiles[g]);
                  }
                  state.floatFilePicker.push({name:lastFloat.docs[k].doc.name , id:lastFloat.docs[k].doc._id, docs:tempSubs});
                  tempSubs=[]
                }
            }
        }
      }
      state.currentDisplayFilePicker = state.floatFilePicker[state.floatFilePicker.length-1]
        //delete root route from the url
        var tempForRoute = deleteEmpty.filter(e=>e !== 'files');
        var route = '';
        state.routeLinkFilePicker = []
        for(var r = 0 ; tempForRoute.length>r ; r++){
          for(var s = 0 ; tempForRoute.length>s ; s++){
            //if they were not equal push secont one to the route
            if(tempForRoute[r] !== tempForRoute[s]){
              route = `${route}/${tempForRoute[s]}`
            //if they were equal push the last of the first in the end of the route and go for next
            }else if(tempForRoute[r] === tempForRoute[s]){
              route = `${route}/${tempForRoute[r]}`
              break
            }
          }
          state.routeLinkFilePicker.push(route)
          route = ''
        }
        
    },
    updateUploadStatus(state , action){
      state.uploadQueue[action.payload.index].uploading = action.payload.status
    },
    updateProgress(state , action){
      state.uploadQueue[action.payload.index].progress = action.payload.progress

    },
    updateUploadError(state , action){
      state.uploadQueue[action.payload.index].error = action.payload.error
    },
    unselectAll(state , action){
      state.selectedItems = []
    },
    updateUploadOveralStatus(state , action){
      state.uploadQueue[action.payload.index].uploaded = action.payload.status
    },
    cancelTheUploading(state , action){
      state.uploadQueue[action.payload.index].uploaded = action.payload.uploaded;
      state.uploadQueue[action.payload.index].uploading = action.payload.uploading;
      state.uploadQueue[action.payload.index].cancel = action.payload.cancel;
      state.uploadQueue[action.payload.index].cancelToken.cancel('upload has been cancelled')
    },
    cancelToken(state , action){
      state.uploadQueue[action.payload.index].cancelToken = action.payload.token;
    },
    selectUnselect(state , action){
      if(state.selectedItems.filter(e=>{return e.id === action.payload.id}).length === 0){
        state.selectedItems.push(action.payload)
      }else if(state.selectedItems.filter(e=>{return e.id === action.payload.id}).length > 0){
        state.selectedItems = state.selectedItems.filter(e=>e.id !== action.payload.id)
      }
    },
    refresh(state , action){
      state.refresh = Math.random()
    },
    selectAll(state , action){
      if(state.selectedItems.length > 0){
        state.selectedItems=[]
      }else if(state.selectedItems.length === 0){
        var temp = state.currentDisplay.docs.map(e=>{
          if(e.file !== undefined){
            return {id:e.file._id , type:'file'}
          }else if(e.file === undefined){
            return {id:e.doc._id , type:'folder'}
          }
  
        })
        state.selectedItems = temp
      }
    },
    getAllTags(state , action){
      state.allTags = action.payload
    },
    setQueueCount(state , action){
      state.lastQueueCount = action.payload.lastCount
    },
    setOnGoingUpload(state , action){
      state.onGoingUpload = action.payload
    }
    ,
    newLinkCreationLoading(state , action){
      state.newLinkCreationLoading = action.payload
    },
    tagToShow(state , action){
      if(state.selectedItems.length === 1){
            if(state.selectedItems[0].type==='file'){
              const temp = state.allTags.filter(e=>{return(e.files.includes(state.selectedItems[0].id))})
              state.tagsToShow = temp
            }else if(state.selectedItems[0].type==='folder'){
              const temp = state.allTags.filter(e=>{return(e.folders.includes(state.selectedItems[0].id))})
              state.tagsToShow = temp
            }
        }else if(state.selectedItems.length === 0){
          state.tagsToShow=[]
        }
    },
    removeTag(state , action){
      const filter = state.tagsToShow.filter(e=>{return JSON.stringify(e._id) !== JSON.stringify(action.payload)})
      state.tagsToShow = filter
    },
    refreshTag(state , action){
      state.refreshTag = Math.random()
    },
    tagsForListDisp(state , action){
      if(state.selectedItems.length === 1){
        if(state.selectedItems[0].type === 'file'){
          const filter = state.allTags.filter(e=>{ if(e.files.filter(a=>{return a === state.selectedItems[0].id}).length === 0)return e})
          state.tagsForList = filter
        }else if(state.selectedItems[0].type === 'folder'){
          const filter = state.allTags.filter(e=>{ if(e.folders.filter(a=>{return a === state.selectedItems[0].id}).length === 0)return e})
          state.tagsForList = filter
          console.log(filter)
        }
        
      }else{
        state.tagsForList = state.allTags
      }
    },
    //------------------------------file manager end










    //------------------------------overall assets start
      setFilter(state , action){
        state.filterCrm = action.payload.filterMemory.crm
        state.filterMis = action.payload.filterMemory.mis
      },
      setJobReportTitles(state , action){
        state.jobReportTitles = action.payload
      },
      setShowSnackBar(state , action){
        state.showSnackBar = {status:action.payload.status,msg:action.payload.msg,type:action.payload.type}
      },
      setUserProfileRefresh(state , action){
        state.userProfileRefresh = Math.random()
      },
      setUserProfile(state , action){
        state.userProfile = action.payload
      },
    //------------------------------overall assets end



    //------------------------------job report start
      setJobReportProfile(state , action){
        state.jobReportUploadedFile.push(action.payload)
      },
      setJobReportsForPerson(state , action){
        state.jobReportsForPerson = action.payload
      },
    //------------------------------job report end










    //------------------------------crm start
      addCrmLimit(state , action){
        state.crmLimit = state.crmLimit+20
      },
      crmRefresh(state , action){
        state.crmRefresh = Math.random()
      },
      crmLoadingStatus(state , action){
        state.crmLoading = {loading:action.payload.loading , retry:action.payload.retry}
      },
      crmSetPr(state , action){
        var arr = action.payload;
        state.crmAllPersons = action.payload
        var temp = [];
        if(arr.length !==0){
            if(state.crmLimit>arr.length){
                state.crmLimit = arr.length;
                temp.length = 0
                for(var i = 0 ; i < state.crmLimit; i++){
                    if(arr !== undefined){
                        temp.push(arr[i]);
                    }
                }
                state.customerToShow = temp
                state.crmHasMore = false
            }else if(state.crmLimit <=arr.length){
                state.crmHasMore = true
                state.crmLimit = Math.min(state.crmLimit + 20, arr.length);
                temp.length =0
                for(var j = 0 ; j < state.crmLimit ; j++){
                    if(arr[j] !== undefined){
                        temp.push(arr[j]);
                    }
                }
                state.customerToShow = temp
            }
        }else{
          state.customerToShow = arr
        }
      
      },
      notfiMore(state , action){
            var temp = [];
            if(state.crmAllPersons.length !==0){
                if(state.crmLimit>state.crmAllPersons.length){
                    state.crmLimit = state.crmAllPersons.length
                    temp.length =0
                    for(var i = 0 ; i < state.crmLimit; i++){
                        if(state.crmAllPersons[i] !== undefined){
                            temp.push(state.crmAllPersons[i]);
                        }
                    }
                    state.customerToShow = temp
                    state.crmHasMore = false
                }else if(state.crmLimit<=state.crmAllPersons.length){
                  state.crmHasMore = true                    
                  state.crmLimit = state.crmLimit+20
                    temp.length =0
                    for(var j = 0 ; j < state.crmLimit; j++){
                        if(state.crmAllPersons[j] !== undefined){
                            temp.push(state.crmAllPersons[j]);
                        }
                        
                    }
                    state.customerToShow =temp

                }
            }else{
              state.customerToShow = state.crmAllPersons
            }
       
      },
      crmSearch(state , action){
        const remap = state.customerToShow.map(e=>{return {generatedBy:{...e.generatedBy},invoice:[...e.invoice] ,customer:{...e.customer, firstNameLastName: `${e.customer.personalInformation.firstName} ${e.customer.personalInformation.lastName}`} }})
        var result=[]
        if(action.payload === ''){
          state.searchForCrm = {searched:[] ,  loading:false , retry:false}
        }else if(action.payload !== ''){
          const fuse = new Fuse(remap, {
              threshold:0.3,
          keys: ['customer.firstNameLastName', 'customer.personalInformation.companyName',
            'customer.contactInfo.phoneNumbers.number' ,
            'customer.contactInfo.emails.email',
            'customer.contactInfo.instagrams.instagram' ,
            'customer.contactInfo.websites.website',
            'customer.contactInfo.linkedIns.linkedIn',
            'customer.contactInfo.linkedIns.facebooks',
            'customer.contactInfo.linkedIns.botims']
          })
          result =  fuse.search(action.payload);
          state.searchRes = result
          var temp = [];
          if(result.length !==0){
              if(state.crmLimit>result.length){
                  state.crmLimit = result.length;
                  temp.length = 0
                  for(var i = 0 ; i < state.crmLimit; i++){
                      if(result !== undefined){
                          temp.push(result[i]);
                      }
                  }
                  state.searchForCrm = {searched:temp ,  loading:false , retry:false}
                  state.crmHasMore = false
              }else if(state.crmLimit <=result.length){
                  state.crmHasMore = true
                  state.crmLimit = Math.min(state.crmLimit + 20, result.length);
                  temp.length =0
                  for(var j = 0 ; j < state.crmLimit ; j++){
                      if(result[j] !== undefined){
                          temp.push(result[j]);
                      }
                  }
                  state.searchForCrm = {searched:temp ,  loading:false , retry:false}
              }
          }else{
            state.searchForCrm = {searched:result ,  loading:false , retry:false}
            
          }
          
        }
      
      },
      notfiMoreSearch(state , action){
            var temp = [];
            if(state.searchRes.length !==0){
                if(state.crmLimit>state.searchRes.length){
                    state.crmLimit = state.searchRes.length
                    temp.length =0
                    for(var i = 0 ; i < state.crmLimit; i++){
                        if(state.searchRes[i] !== undefined){
                            temp.push(state.searchRes[i]);
                        }
                    }
                    state.searchForCrm = {searched:temp ,  loading:false , retry:false}
                    state.crmHasMore = false
                }else if(state.crmLimit<=state.searchRes.length){
                  state.crmHasMore = true                    
                  state.crmLimit = state.crmLimit+20
                    temp.length =0
                    for(var j = 0 ; j < state.crmLimit; j++){
                        if(state.searchRes[j] !== undefined){
                            temp.push(state.searchRes[j]);
                        }
                        
                    }
                    state.searchForCrm = {searched:temp ,  loading:false , retry:false}

                }
            }else{
              state.searchForCrm = {searched:state.searchRes ,  loading:false , retry:false}
             
            }
      
      },
      searchLoading(state , action){
        state.searchForCrm.loading = true
      },
      setLastAddedCustomer(state , action){
        state.lastInsertedCustomer = action.payload
      },
      toggleNewCustomer(state , action){
        state.newCustomer = !state.newCustomer
      },
      toggleProject(state , action){
        state.newProject = !state.newProject
      },
      toggleDownloadNavMenu(state , action){
        state.downloadNavMenu = !state.downloadNavMenu
      },
      setTargetDocForCommunication(state , action){

        state.setTargetDocForCom.status = action.payload.status
        state.setTargetDocForCom.channel = action.payload.channel
        state.setTargetDocForCom.docItSelf = action.payload.docItSelf
        state.setTargetDocForCom.platform = action.payload.platform
      },
    //------------------------------crm end





    //------------------------------product start
      toggleNewRootProduct(state , action){
        state.newRootProduct = !state.newRootProduct
      },
      toggleNewSubProduct(state , action){
        state.newSubProduct = !state.newSubProduct
      },
    //------------------------------product end










    //------------------------------contact list
      setContactListDetails(state , action){
        state.contactList.sa = action.payload.rs.sa;
        state.contactList.inv = action.payload.rs.inv;
        state.contactList.req = action.payload.rs.req;
        state.contactList.all = action.payload.rs.all;
        state.contactList.allAll = action.payload.rs.allAll;
        state.contactList.lenght = action.payload.ln;
      },
    //------------------------------contact list

    



    //------------------------------Mis
      misRefresh(state , action){
        state.misRefresh = Math.random()
      },
      misLoadingStatus(state , action){
        state.misLoading = {loading:action.payload.loading , retry:action.payload.retry}
      },
      misSetInvoices(state , action){
        
        var arr = action.payload.rs.filter(e=>{return e.doc !==null});
        state.misAllInvoices = arr
        var temp = [];
        if(arr.length !==0){
            if(state.misLimit>arr.length){
                state.misLimit = arr.length;
                temp.length = 0
                for(var i = 0 ; i < state.misLimit; i++){
                    if(arr !== undefined){
                        temp.push(arr[i]);
                    }
                }
                state.invoicesToShow = temp
                state.misHasMore = false
            }else if(state.misLimit <=arr.length){
                state.misHasMore = true
                state.misLimit = Math.min(state.misLimit + 20, arr.length);
                temp.length =0
                for(var j = 0 ; j < state.misLimit ; j++){
                    if(arr[j] !== undefined){
                        temp.push(arr[j]);
                    }
                }
                state.invoicesToShow = temp
            }
        }else{
          state.invoicesToShow = arr
        }
      
      },
      toggleNewInvoice(state , action){
        state.newInvoice = !state.newInvoice
      },
      toggleEditInvoice(state , action){
        state.editInvoice = !state.editInvoice
      },
      misNotfiMore(state , action){
        var temp = [];
        if(state.misAllInvoices.length !==0){
            if(state.misLimit>state.misAllInvoices.length){
                state.misLimit = state.misAllInvoices.length
                temp.length =0
                for(var i = 0 ; i < state.misLimit; i++){
                    if(state.misAllInvoices[i] !== undefined){
                        temp.push(state.misAllInvoices[i]);
                    }
                }
                state.invoicesToShow = temp
                state.misHasMore = false
            }else if(state.misLimit<=state.misAllInvoices.length){
              state.misHasMore = true                    
              state.misLimit = state.misLimit+20
                temp.length =0
                for(var j = 0 ; j < state.misLimit; j++){
                    if(state.misAllInvoices[j] !== undefined){
                        temp.push(state.misAllInvoices[j]);
                    }
                    
                }
                state.invoicesToShow =temp

            }
        }else{
          state.invoicesToShow = state.misAllInvoices
        }
    
  },
    //------------------------------Mis
    
    
    //------------------------------inventory list
      productRefresh(state , action){
        state.productRefresh = Math.random()
      },
      setSelectedRootProduct(state , action){
        state.selectedRootProduct = action.payload
      },
      setProductsTree(state , action){
        state.productsTree = Array.isArray(action.payload) ? action.payload : [];
      },
    //------------------------------inventory list
  },
  extraReducers:(builder) =>{
    //------------------------------file manager start
    builder.addCase(setFilesAsync.fulfilled, (state,action)=>{
      if(action.payload !== undefined){
        const temp =action.payload;
        state.uploadQueue = state.uploadQueue.concat(temp);
      }
    })
    builder.addCase(setFileForRetry.fulfilled, (state,action)=>{
      var temp = state.uploadQueue[action.payload]
      state.uploadQueue[action.payload].show = false
      state.uploadQueue.push({
        uploading:false,
        cancel:false,
        uploadType:state.uploadQueue[action.payload].uploadType,
        cancelToken:axios.CancelToken.source(),
        file:temp.file,
        progress:0,
        uploaded:null,
        show:true,
        error:{status:false , msg:''}
      })
    })
    //------------------------------file manager end

    
      // ================= INVENTORY =================
  builder
    .addCase(getProductsTree.pending, (state) => {
      state.productLoading = true;
      state.productError = null;
    })
    .addCase(getProductsTree.fulfilled, (state, action) => {
      state.productLoading = false;
      state.productsTree = Array.isArray(action.payload) ? action.payload : [];
    })
    .addCase(getProductsTree.rejected, (state, action) => {
      state.productLoading = false;
      state.productError = action.payload;
    });





    
  }
});

export const { actions, reducer } = dataSlice;
  const store = configureStore({
      reducer: dataSlice.reducer,
      middleware: [thunk] // Include the redux-thunk middleware
  }
 )
 

 export default store;
