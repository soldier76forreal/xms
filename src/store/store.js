import { createSlice, createAsyncThunk , configureStore, current } from '@reduxjs/toolkit';
import axios from 'axios';

import { useSelector } from 'react-redux';
import thunk from 'redux-thunk'; // Import the redux-thunk middleware
import { getImageSize  } from 'react-image-size';
import fileDownload from 'js-file-download';
import Fuse from 'fuse.js';
import { printHtmlDocument } from '../tools/printDocument';

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
            if(uploadQueue[i].cancel === false && uploadQueue[i].paused !== true){

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



export const newLink = createAsyncThunk('getFilesAndFolders/newLink', async (theData, { dispatch } ) => {

  try{
      dispatch(actions.newLinkCreationLoading(true))
      const response = await theData.authCtx.jwtInst({
          method:'post',
          data:{document:theData.document , timer:theData.timer , msg:theData.msg , displayName:theData.displayName},
          url:`${theData.axiosGlobal.defaultTargetApi}/files/createNewLink`,
          config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
      const data = await response.data;
      dispatch(actions.newLinkCreationLoading(false))
      // Unified short-link system (2026-07-30) — internal-only, requires
      // login. The share modal displays this and owns copying —
      // navigator.clipboard is undefined on non-secure origins (http://
      // LAN IPs), so writing it here silently failed and the user never
      // saw the link at all.
      return `${window.location.origin}/l/${data.code}`;

  }catch(error){
    dispatch(actions.newLinkCreationLoading(false))
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to create the share link', type: 'error' }))
    throw error
  }

});

// ── Download transfer center (Phase 9 follow-up) ──────────────────────────────
// Mirrors the upload queue's shape/UX: every download (single file OR a
// zip of a multi/folder selection) is tracked in state.downloadQueue with
// real progress, a CancelToken (cancel + "pause"), and a retryable failure
// state — same as uploads. Runs the actual HTTP request; runDownload is the
// worker, startDownload enqueues + kicks it off (also used for retry/resume).
export const runDownload = createAsyncThunk('getFilesAndFolders/runDownload', async (theData, { dispatch, getState }) => {
  const { authCtx, axiosGlobal, id, label } = theData;
  // Retry/resume only pass {id} — pull the original request shape back off
  // the queue entry itself rather than requiring every caller to remember it.
  const queued = getState().downloadQueue.find((d) => d.id === id) || {};
  const kind     = theData.kind     ?? queued.kind;
  const selected = theData.selected ?? queued.selected;
  const fileId   = theData.fileId   ?? queued.fileId;
  const cancelSource = axios.CancelToken.source();
  dispatch(actions.setDownloadCancelToken({ id, cancelToken: cancelSource }));
  dispatch(actions.setDownloadStatus({ id, status: 'downloading' }));

  try {
    const isSingle = kind === 'single';
    const config = {
      method: isSingle ? 'get' : 'post',
      url: isSingle
        ? `${axiosGlobal.defaultTargetApi}/files/download/${fileId}`
        : `${axiosGlobal.defaultTargetApi}/files/downloadFileFolders`,
      responseType: 'blob',
      cancelToken: cancelSource.token,
      onDownloadProgress: (evt) => {
        // Zip downloads have no Content-Length (size is unknown until the
        // archive finishes) — X-Total-Size is the ESTIMATED uncompressed
        // size instead, so progress is capped short of 100% until the
        // request actually resolves.
        let total = evt.total;
        if (!total && evt.target?.getResponseHeader) {
          const hdr = evt.target.getResponseHeader('X-Total-Size');
          if (hdr) total = Number(hdr);
        }
        const progress = total ? Math.min(99, Math.round((evt.loaded / total) * 100)) : undefined;
        dispatch(actions.updateDownloadProgress({ id, progress, receivedBytes: evt.loaded, totalBytes: total || 0 }));
      },
    };
    if (!isSingle) {
      config.data = { selected };
      config.config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    }

    const response = await authCtx.jwtInst(config);

    const contentDisp = response.headers['content-disposition'];
    const fileName = contentDisp
      ? decodeURIComponent(contentDisp.split('filename=')[1]?.replace(/"/g, '') || label)
      : label;

    const blob = new Blob([response.data]);
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    dispatch(actions.updateDownloadProgress({ id, progress: 100, receivedBytes: 0, totalBytes: 0 }));
    dispatch(actions.setDownloadStatus({ id, status: 'done' }));
  } catch (error) {
    if (axios.isCancel(error)) {
      // setDownloadStatus is set by the pause/cancel action itself (so it can
      // distinguish "paused" from "canceled") — nothing to do here.
    } else {
      dispatch(actions.setDownloadError({ id, msg: error?.response?.data?.message || 'Download failed' }));
    }
  }
});

export const startDownload = createAsyncThunk('getFilesAndFolders/startDownload', async (theData, { dispatch }) => {
  const id = theData.id || `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  if (!theData.id) {
    dispatch(actions.enqueueDownload({
      id, kind: theData.kind, label: theData.label, itemCount: theData.itemCount || 1,
      selected: theData.selected, fileId: theData.fileId,
    }));
  }
  dispatch(runDownload({ ...theData, id }));
  return id;
});






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
    temp.push({uploadType:theData.uploadType ,  uploading:false , cancel:false , paused:false , cancelToken:axios.CancelToken.source() , file:element, progress:0 , uploaded:null , show:true , error:{status:false , msg:''}})
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


export const userProfileData = createAsyncThunk('overallAssets/profileData', async (theData, { dispatch , getState } ) => {
  try{
      const response = await theData.authCtx.jwtInst({
        method:'get',
        url:`${theData.axiosGlobal.defaultTargetApi}/users/userProfileData`,
        config: { headers: {'Content-Type': 'application/x-www-form-urlencoded' }}
      })
      dispatch(actions.setUserProfile(response.data))

  }catch(err){
      console.log(err);
  }

});
//------------------------------overall assets end










//------------------------------CRM thunks (Phase 5)

export const fetchCrmCustomers = createAsyncThunk('overallAssets/fetchCrmCustomers', async (theData, { dispatch }) => {
  dispatch(actions.crmSetLoading(true));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/crm/customers`,
      params: theData.params || {},
    });
    const isFirstPage = !theData.params?.page || theData.params.page <= 1;
    if (isFirstPage) {
      dispatch(actions.crmSetCustomers({ data: response.data.data, total: response.data.total }));
    } else {
      dispatch(actions.crmAppendCustomers({ data: response.data.data, total: response.data.total }));
    }
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load customers', type: 'error' }));
  } finally {
    dispatch(actions.crmSetLoading(false));
  }
});

export const fetchCrmCustomer = createAsyncThunk('overallAssets/fetchCrmCustomer', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/crm/customers/${theData.id}`,
    });
    dispatch(actions.crmSetSelectedCustomer(response.data.data));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load customer details', type: 'error' }));
  }
});

export const deleteCrmCustomer = createAsyncThunk('overallAssets/deleteCrmCustomer', async (theData, { dispatch }) => {
  try {
    await theData.authCtx.jwtInst({
      method: 'delete',
      url: `${theData.axiosGlobal.defaultTargetApi}/crm/customers/${theData.id}`,
    });
    dispatch(actions.crmRemoveCustomer(theData.id));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Customer deleted', type: 'success' }));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to delete customer', type: 'error' }));
  }
});

//------------------------------CRM thunks end






//------------------------------MIS start (Phase 6 rebuild — Session 44)

export const fetchMisInvoices = createAsyncThunk('overallAssets/fetchMisInvoices', async (theData, { dispatch }) => {
  dispatch(actions.misInvSetLoading(true));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/mis/invoices`,
      params: theData.params || {},
    });
    const isFirstPage = !theData.params?.page || theData.params.page <= 1;
    if (isFirstPage) {
      dispatch(actions.misInvSetList({ data: response.data.data, total: response.data.total }));
    } else {
      dispatch(actions.misInvAppendList({ data: response.data.data, total: response.data.total }));
    }
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load invoices', type: 'error' }));
  } finally {
    dispatch(actions.misInvSetLoading(false));
  }
});

export const fetchMisInvoice = createAsyncThunk('overallAssets/fetchMisInvoice', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/mis/invoices/${theData.id}`,
    });
    dispatch(actions.misInvSetSelected(response.data));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load document', type: 'error' }));
  }
});

export const deleteMisInvoice = createAsyncThunk('overallAssets/deleteMisInvoice', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'delete',
      url: `${theData.axiosGlobal.defaultTargetApi}/mis/invoices/${theData.id}`,
      // restoreStock is only meaningful when the invoice actually decremented
      // stock (server ignores it otherwise) — see stockDecremented on the doc.
      params: theData.restoreStock ? { restoreStock: true } : undefined,
    });
    dispatch(actions.misInvRemove(theData.id));
    dispatch(actions.setShowSnackBar({
      status: true,
      msg: response.data?.stockRestored ? 'Document deleted — stock restored' : 'Document deleted',
      type: 'success',
    }));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to delete document', type: 'error' }));
  }
});

export const convertMisPreInvoice = createAsyncThunk('overallAssets/convertMisPreInvoice', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'post',
      url: `${theData.axiosGlobal.defaultTargetApi}/mis/invoices/${theData.id}/convert`,
    });
    dispatch(actions.misInvBumpRefresh());
    dispatch(actions.setShowSnackBar({ status: true, msg: `Converted — invoice #${response.data.docNumber}`, type: 'success' }));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to convert pre-invoice', type: 'error' }));
    throw err;
  }
});

export const updateMisPayment = createAsyncThunk('overallAssets/updateMisPayment', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'put',
      url: `${theData.axiosGlobal.defaultTargetApi}/mis/invoices/${theData.id}/payment`,
      data: theData.data,
    });
    dispatch(actions.misInvUpsert(response.data));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Payment recorded', type: 'success' }));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to record payment', type: 'error' }));
  }
});

// downloads the rendered PDF as a blob → triggers the browser save
// Invoice/quotation PDF — generated CLIENT-SIDE via the browser's print engine
// (see tools/printDocument.js) instead of server Puppeteer. Fetches the same
// HTML the preview uses, then opens the browser's "Save as PDF" dialog.
export const downloadMisInvoicePdf = createAsyncThunk('overallAssets/downloadMisInvoicePdf', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/mis/invoices/${theData.id}/html`,
      params: theData.lang ? { lang: theData.lang } : {},
      responseType: 'text',
    });
    printHtmlDocument(response.data);
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to open the document', type: 'error' }));
  }
});

export const fetchMisCompanyProfile = createAsyncThunk('overallAssets/fetchMisCompanyProfile', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/mis/company-profile`,
    });
    dispatch(actions.misSetCompanyProfile(response.data));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load company settings', type: 'error' }));
  }
});

export const saveMisCompanyProfile = createAsyncThunk('overallAssets/saveMisCompanyProfile', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'put',
      url: `${theData.axiosGlobal.defaultTargetApi}/mis/company-profile`,
      data: theData.data,
    });
    dispatch(actions.misSetCompanyProfile(response.data));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Settings saved', type: 'success' }));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to save settings', type: 'error' }));
  }
});

//------------------------------MIS end

//------------------------------Digital Marketing start (Phase 8)

export const fetchRawContents = createAsyncThunk('overallAssets/fetchRawContents', async (theData, { dispatch }) => {
  dispatch(actions.dmRawSetLoading(true));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/raw-contents`,
      params: theData.params || {},
    });
    const isFirstPage = !theData.params?.page || theData.params.page <= 1;
    if (isFirstPage) {
      dispatch(actions.dmRawSetList({ data: response.data.data, total: response.data.total }));
    } else {
      dispatch(actions.dmRawAppendList({ data: response.data.data, total: response.data.total }));
    }
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load raw content', type: 'error' }));
  } finally {
    dispatch(actions.dmRawSetLoading(false));
  }
});

export const fetchRawContent = createAsyncThunk('overallAssets/fetchRawContent', async (theData, { dispatch }) => {
  dispatch(actions.dmRawSetSelectedErrorStatus(null));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/raw-contents/${theData.id}`,
    });
    dispatch(actions.dmRawSetSelected(response.data));
  } catch (err) {
    // A short-link/notification deep link can hand this a record the viewer
    // isn't scoped/permitted to see — remember the status so rawContentDetail.js
    // can render the Restricted Access screen instead of a blank panel.
    dispatch(actions.dmRawSetSelectedErrorStatus(err?.response?.status || null));
    if (err?.response?.status !== 403) {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load raw content record', type: 'error' }));
    }
  }
});

// theData.formData is a pre-built FormData (files[], descriptions, voiceDescriptionFlags,
// voiceDescriptions[], language, useCase, platform) — see rawContentForm.js for the builder.
export const createRawContent = createAsyncThunk('overallAssets/createRawContent', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'post',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/raw-contents`,
      data: theData.formData,
      ...(theData.onProgress ? { onUploadProgress: theData.onProgress } : {}),
    });
    dispatch(actions.dmRawUpsert(response.data));
    dispatch(actions.dmBumpRefresh());
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Raw content uploaded', type: 'success' }));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to upload raw content', type: 'error' }));
    throw err;
  }
});

// theData.formData — same shape as create, plus optional status/removeFileIds/
// updateDescriptionFileId+Text. Used for edits AND status toggles to
// rejected/canceled/working_on_it (NOT ready_to_upload — see submitReadyToUpload).
export const updateRawContent = createAsyncThunk('overallAssets/updateRawContent', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'put',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/raw-contents/${theData.id}`,
      data: theData.formData,
      ...(theData.onProgress ? { onUploadProgress: theData.onProgress } : {}),
    });
    dispatch(actions.dmRawUpsert(response.data));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Raw content updated', type: 'success' }));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to update raw content', type: 'error' }));
    throw err;
  }
});

export const deleteRawContent = createAsyncThunk('overallAssets/deleteRawContent', async (theData, { dispatch }) => {
  try {
    await theData.authCtx.jwtInst({
      method: 'delete',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/raw-contents/${theData.id}`,
    });
    dispatch(actions.dmRawRemove(theData.id));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Raw content deleted', type: 'success' }));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to delete raw content', type: 'error' }));
  }
});

// theData.formData — files[] (edited finals), language, platform, caption.
// The ONLY way a readyToUpload record gets created — atomically flips the raw
// content's status server-side too.
export const submitReadyToUpload = createAsyncThunk('overallAssets/submitReadyToUpload', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'post',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/raw-contents/${theData.id}/ready-to-upload`,
      data: theData.formData,
      ...(theData.onProgress ? { onUploadProgress: theData.onProgress } : {}),
    });
    dispatch(actions.dmRawUpsert(response.data.rawContent));
    dispatch(actions.dmBumpRefresh());
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Marked ready to upload', type: 'success' }));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to submit ready-to-upload content', type: 'error' }));
    throw err;
  }
});

// theData.kind — 'rawContent' (default) or 'readyToUpload'; picks which thread
// the shared RawContentChat component/model is reading (see rawContentChatModel.js —
// a message belongs to exactly one of rawContentId/readyToUploadId).
export const fetchRawContentChat = createAsyncThunk('overallAssets/fetchRawContentChat', async (theData, { dispatch }) => {
  try {
    const base = theData.kind === 'readyToUpload' ? 'ready-to-upload' : 'raw-contents';
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/${base}/${theData.id}/chat`,
      params: theData.params || {},
    });
    const isFirstPage = !theData.params?.page || theData.params.page <= 1;
    if (isFirstPage) {
      dispatch(actions.dmRawChatSetList({ data: response.data.data, total: response.data.total }));
    } else {
      dispatch(actions.dmRawChatPrepend(response.data.data));
    }
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load chat history', type: 'error' }));
  }
});

// theData.formData — body (text) and/or a single file (voice/attachment).
// Real-time delivery to other viewers happens server-side via Socket.io
// (dm:chat:new) — the sender also gets their own message back via this
// response so the UI can push it immediately without waiting on the socket echo.
export const sendRawContentChatMessage = createAsyncThunk('overallAssets/sendRawContentChatMessage', async (theData, { dispatch }) => {
  try {
    const base = theData.kind === 'readyToUpload' ? 'ready-to-upload' : 'raw-contents';
    const response = await theData.authCtx.jwtInst({
      method: 'post',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/${base}/${theData.id}/chat`,
      data: theData.formData,
      ...(theData.onProgress ? { onUploadProgress: theData.onProgress } : {}),
    });
    dispatch(actions.dmRawChatPush(response.data));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to send message', type: 'error' }));
    throw err;
  }
});

// theData.formData — files[] (finals), title, language, platform, caption.
// Standalone create — no source raw content, rawContentId stays unset.
export const createReadyToUpload = createAsyncThunk('overallAssets/createReadyToUpload', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'post',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/ready-to-upload`,
      data: theData.formData,
      ...(theData.onProgress ? { onUploadProgress: theData.onProgress } : {}),
    });
    dispatch(actions.dmBumpRefresh());
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Ready-to-upload content created', type: 'success' }));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to create ready-to-upload content', type: 'error' }));
    throw err;
  }
});

export const fetchReadyToUploadList = createAsyncThunk('overallAssets/fetchReadyToUploadList', async (theData, { dispatch }) => {
  dispatch(actions.dmReadySetLoading(true));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/ready-to-upload`,
      params: theData.params || {},
    });
    const isFirstPage = !theData.params?.page || theData.params.page <= 1;
    if (isFirstPage) {
      dispatch(actions.dmReadySetList({ data: response.data.data, total: response.data.total }));
    } else {
      dispatch(actions.dmReadyAppendList({ data: response.data.data, total: response.data.total }));
    }
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load ready-to-upload content', type: 'error' }));
  } finally {
    dispatch(actions.dmReadySetLoading(false));
  }
});

export const fetchReadyToUpload = createAsyncThunk('overallAssets/fetchReadyToUpload', async (theData, { dispatch }) => {
  dispatch(actions.dmReadySetSelectedErrorStatus(null));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/ready-to-upload/${theData.id}`,
    });
    dispatch(actions.dmReadySetSelected(response.data));
  } catch (err) {
    dispatch(actions.dmReadySetSelectedErrorStatus(err?.response?.status || null));
    if (err?.response?.status !== 403) {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load ready-to-upload record', type: 'error' }));
    }
  }
});

export const updateReadyToUpload = createAsyncThunk('overallAssets/updateReadyToUpload', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'put',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/ready-to-upload/${theData.id}`,
      data: theData.formData,
      ...(theData.onProgress ? { onUploadProgress: theData.onProgress } : {}),
    });
    dispatch(actions.dmReadySetSelected(response.data));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Ready-to-upload content updated', type: 'success' }));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to update', type: 'error' }));
    throw err;
  }
});

export const deleteReadyToUpload = createAsyncThunk('overallAssets/deleteReadyToUpload', async (theData, { dispatch }) => {
  try {
    await theData.authCtx.jwtInst({
      method: 'delete',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/ready-to-upload/${theData.id}`,
    });
    dispatch(actions.dmReadyRemove(theData.id));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Ready-to-upload content deleted', type: 'success' }));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to delete', type: 'error' }));
  }
});

export const fetchLinkPages = createAsyncThunk('overallAssets/fetchLinkPages', async (theData, { dispatch }) => {
  dispatch(actions.dmLinkSetLoading(true));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/link-pages`,
      params: theData.params || {},
    });
    const isFirstPage = !theData.params?.page || theData.params.page <= 1;
    if (isFirstPage) {
      dispatch(actions.dmLinkSetList({ data: response.data.data, total: response.data.total }));
    } else {
      dispatch(actions.dmLinkAppendList({ data: response.data.data, total: response.data.total }));
    }
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load link pages', type: 'error' }));
  } finally {
    dispatch(actions.dmLinkSetLoading(false));
  }
});

export const fetchLinkPage = createAsyncThunk('overallAssets/fetchLinkPage', async (theData, { dispatch }) => {
  dispatch(actions.dmLinkSetSelectedErrorStatus(null));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/link-pages/${theData.id}`,
    });
    dispatch(actions.dmLinkSetSelected(response.data));
  } catch (err) {
    dispatch(actions.dmLinkSetSelectedErrorStatus(err?.response?.status || null));
    if (err?.response?.status !== 403) {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load link page', type: 'error' }));
    }
  }
});

// theData.formData — companyName, links (JSON string), status, restrictToOwner, cover (file, optional).
export const createLinkPage = createAsyncThunk('overallAssets/createLinkPage', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'post',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/link-pages`,
      data: theData.formData,
      ...(theData.onProgress ? { onUploadProgress: theData.onProgress } : {}),
    });
    dispatch(actions.dmLinkUpsert(response.data));
    dispatch(actions.dmBumpRefresh());
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Link page created', type: 'success' }));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to create link page', type: 'error' }));
    throw err;
  }
});

export const updateLinkPage = createAsyncThunk('overallAssets/updateLinkPage', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'put',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/link-pages/${theData.id}`,
      data: theData.formData,
      ...(theData.onProgress ? { onUploadProgress: theData.onProgress } : {}),
    });
    dispatch(actions.dmLinkUpsert(response.data));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Link page updated', type: 'success' }));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to update link page', type: 'error' }));
    throw err;
  }
});

export const deleteLinkPage = createAsyncThunk('overallAssets/deleteLinkPage', async (theData, { dispatch }) => {
  try {
    await theData.authCtx.jwtInst({
      method: 'delete',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/link-pages/${theData.id}`,
    });
    dispatch(actions.dmLinkRemove(theData.id));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Link page deleted', type: 'success' }));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to delete link page', type: 'error' }));
  }
});

export const fetchWhatsappShares = createAsyncThunk('overallAssets/fetchWhatsappShares', async (theData, { dispatch }) => {
  dispatch(actions.dmWhatsappSetLoading(true));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/whatsapp-shares`,
      params: theData.params || {},
    });
    const isFirstPage = !theData.params?.page || theData.params.page <= 1;
    if (isFirstPage) {
      dispatch(actions.dmWhatsappSetList({ data: response.data.data, total: response.data.total }));
    } else {
      dispatch(actions.dmWhatsappAppendList({ data: response.data.data, total: response.data.total }));
    }
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load WhatsApp shares', type: 'error' }));
  } finally {
    dispatch(actions.dmWhatsappSetLoading(false));
  }
});

export const fetchWhatsappShare = createAsyncThunk('overallAssets/fetchWhatsappShare', async (theData, { dispatch }) => {
  dispatch(actions.dmWhatsappSetSelectedErrorStatus(null));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/whatsapp-shares/${theData.id}`,
    });
    dispatch(actions.dmWhatsappSetSelected(response.data));
  } catch (err) {
    dispatch(actions.dmWhatsappSetSelectedErrorStatus(err?.response?.status || null));
    if (err?.response?.status !== 403) {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load WhatsApp share', type: 'error' }));
    }
  }
});

export const deleteWhatsappShare = createAsyncThunk('overallAssets/deleteWhatsappShare', async (theData, { dispatch }) => {
  try {
    await theData.authCtx.jwtInst({
      method: 'delete',
      url: `${theData.axiosGlobal.defaultTargetApi}/digitalMarketing/whatsapp-shares/${theData.id}`,
    });
    dispatch(actions.dmWhatsappRemove(theData.id));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'WhatsApp share deleted', type: 'success' }));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to delete WhatsApp share', type: 'error' }));
  }
});

//------------------------------Digital Marketing end

//------------------------------Tutorial Center start

export const fetchTutorials = createAsyncThunk('overallAssets/fetchTutorials', async (theData, { dispatch }) => {
  dispatch(actions.tutSetLoading(true));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/tutorials`,
      params: theData.params || {},
    });
    const isFirstPage = !theData.params?.page || theData.params.page <= 1;
    if (isFirstPage) {
      dispatch(actions.tutSetList({ data: response.data.data, total: response.data.total }));
    } else {
      dispatch(actions.tutAppendList({ data: response.data.data, total: response.data.total }));
    }
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load tutorials', type: 'error' }));
  } finally {
    dispatch(actions.tutSetLoading(false));
  }
});

export const fetchTutorial = createAsyncThunk('overallAssets/fetchTutorial', async (theData, { dispatch }) => {
  dispatch(actions.tutSetSelectedErrorStatus(null));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/tutorials/${theData.id}`,
    });
    dispatch(actions.tutSetSelected(response.data));
  } catch (err) {
    dispatch(actions.tutSetSelectedErrorStatus(err?.response?.status || null));
    if (err?.response?.status !== 403) {
      dispatch(actions.setShowSnackBar({ status: true, msg: 'Failed to load tutorial', type: 'error' }));
    }
  }
});

// Permission catalog grouped by module — powers the tag picker in tutorialForm.js.
export const fetchTutorialActionTags = createAsyncThunk('overallAssets/fetchTutorialActionTags', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/tutorials/action-tags`,
    });
    dispatch(actions.tutSetActionTags(response.data.byModule || {}));
  } catch (err) { /* tag picker just shows empty groups */ }
});

// theData.formData — title, description, language, section, tags (JSON string), files[].
export const createTutorial = createAsyncThunk('overallAssets/createTutorial', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'post',
      url: `${theData.axiosGlobal.defaultTargetApi}/tutorials`,
      data: theData.formData,
      ...(theData.onProgress ? { onUploadProgress: theData.onProgress } : {}),
    });
    dispatch(actions.tutUpsert(response.data));
    dispatch(actions.tutBumpRefresh());
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Tutorial uploaded', type: 'success' }));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to upload tutorial', type: 'error' }));
    throw err;
  }
});

export const updateTutorial = createAsyncThunk('overallAssets/updateTutorial', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'put',
      url: `${theData.axiosGlobal.defaultTargetApi}/tutorials/${theData.id}`,
      data: theData.formData,
      ...(theData.onProgress ? { onUploadProgress: theData.onProgress } : {}),
    });
    dispatch(actions.tutUpsert(response.data));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Tutorial updated', type: 'success' }));
    return response.data;
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to update tutorial', type: 'error' }));
    throw err;
  }
});

export const deleteTutorial = createAsyncThunk('overallAssets/deleteTutorial', async (theData, { dispatch }) => {
  try {
    await theData.authCtx.jwtInst({
      method: 'delete',
      url: `${theData.axiosGlobal.defaultTargetApi}/tutorials/${theData.id}`,
    });
    dispatch(actions.tutRemove(theData.id));
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Tutorial deleted', type: 'success' }));
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: err?.response?.data?.message || 'Failed to delete tutorial', type: 'error' }));
  }
});

//------------------------------Tutorial Center end








  //------------------------------contact list
    
    export const getContacts = createAsyncThunk('contact/getContacts', async (theData, { dispatch , getState } ) => {
        try{
            const response = await theData.authCtx.jwtInst({
              method:'get',
              url:`${theData.axiosGlobal.defaultTargetApi}/users`,
              params: { limit: 200 }
            });
            const users = response.data.data || response.data || [];
            // Map flat user list to the legacy contactList shape expected by MIS components
            dispatch(actions.setContactListDetails({
              rs: { sa: users, inv: users, req: users, all: users, allAll: users },
              ln: users.length
            }));
        }catch(err){
            console.log(err);
        }
    });
  //------------------------------contact list

// Lightweight id -> {firstName,lastName,profileImage} map, used to render a
// real avatar anywhere a user's identity is shown by id (chat bubbles, task
// assignee, activity actor, "shared by"...) without needing every module's
// own actor-name route to also carry profileImage. Fetched once per session.
export const fetchUserDirectory = createAsyncThunk('users/fetchUserDirectory', async (theData, { dispatch, getState }) => {
  if (getState().userDirectoryLoaded) return;
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/users/directory`,
    });
    const map = {};
    (response.data.data || []).forEach((u) => { map[u._id] = u; });
    dispatch(actions.setUserDirectory(map));
  } catch (err) {
    console.log(err);
  }
});
//------------------------------user directory


//------------------------------inventory start

export const fetchProducts = createAsyncThunk('inventory/fetchProducts', async (theData, { dispatch }) => {
  dispatch(actions.invSetLoading(true));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/inventory/products`,
      params: theData.params || {},
    });
    const isFirstPage = !theData.params?.skip || theData.params.skip <= 0;
    if (isFirstPage) {
      dispatch(actions.invSetProducts({ data: response.data.data, total: response.data.total }));
    } else {
      dispatch(actions.invAppendProducts({ data: response.data.data, total: response.data.total }));
    }
  } catch (err) {
    dispatch(actions.invSetError(err?.response?.data?.message || 'Failed to load products'));
  } finally {
    dispatch(actions.invSetLoading(false));
  }
});

export const fetchProduct = createAsyncThunk('inventory/fetchProduct', async (theData, { dispatch }) => {
  dispatch(actions.invSetCurrentProductLoading(true));
  dispatch(actions.invSetCurrentProductErrorStatus(null));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/inventory/products/${theData.id}`,
    });
    dispatch(actions.invSetCurrentProduct(response.data.data));
  } catch (err) {
    dispatch(actions.invSetCurrentProduct(null));
    // A short-link/notification deep link can hand this a product the viewer
    // isn't scoped/permitted to see — remember the status so showProduct.js
    // can render the Restricted Access screen instead of a blank panel.
    dispatch(actions.invSetCurrentProductErrorStatus(err?.response?.status || null));
  } finally {
    dispatch(actions.invSetCurrentProductLoading(false));
  }
});

export const fetchVariants = createAsyncThunk('inventory/fetchVariants', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/inventory/products/${theData.productId}/variants`,
    });
    dispatch(actions.invSetVariants(response.data.data));
  } catch (err) {
    console.error(err);
  }
});

const toast = (dispatch, msg, type = 'success') =>
  dispatch(actions.setShowSnackBar({ status: true, msg, type }));

export const createProduct = createAsyncThunk('inventory/createProduct', async (theData, { dispatch }) => {
  const response = await theData.authCtx.jwtInst({
    method: 'post',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/products`,
    data: theData.data,
  });
  dispatch(actions.invRefresh());
  toast(dispatch, 'Product created');
  return response.data.data;
});

export const updateProduct = createAsyncThunk('inventory/updateProduct', async (theData, { dispatch }) => {
  const response = await theData.authCtx.jwtInst({
    method: 'put',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/products/${theData.id}`,
    data: theData.data,
  });
  dispatch(actions.invRefresh());
  if (!theData.silent) toast(dispatch, 'Product updated');
  return response.data.data;
});

export const createVariant = createAsyncThunk('inventory/createVariant', async (theData, { dispatch }) => {
  const response = await theData.authCtx.jwtInst({
    method: 'post',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/variants`,
    data: theData.data,
  });
  const pid = theData.data.productId;
  dispatch(fetchProduct({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, id: pid }));
  dispatch(fetchVariants({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, productId: pid }));
  toast(dispatch, 'Variant added');
  return response.data;
});

export const updateVariant = createAsyncThunk('inventory/updateVariant', async (theData, { dispatch }) => {
  const response = await theData.authCtx.jwtInst({
    method: 'put',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/variants/${theData.id}`,
    data: theData.data,
  });
  dispatch(fetchProduct({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, id: theData.productId }));
  dispatch(fetchVariants({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, productId: theData.productId }));
  toast(dispatch, 'Variant updated');
  return response.data.data;
});

export const deleteVariant = createAsyncThunk('inventory/deleteVariant', async (theData, { dispatch }) => {
  await theData.authCtx.jwtInst({
    method: 'delete',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/variants/${theData.id}`,
  });
  dispatch(fetchProduct({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, id: theData.productId }));
  dispatch(fetchVariants({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, productId: theData.productId }));
  toast(dispatch, 'Variant deleted');
});

export const adjustStock = createAsyncThunk('inventory/adjustStock', async (theData, { dispatch }) => {
  const response = await theData.authCtx.jwtInst({
    method: 'post',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/variants/${theData.id}/adjust`,
    data: { delta: theData.delta, reason: theData.reason },
  });
  dispatch(fetchProduct({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, id: theData.productId }));
  dispatch(fetchVariants({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, productId: theData.productId }));
  toast(dispatch, `Stock adjusted (${theData.delta > 0 ? '+' : ''}${theData.delta})`);
  return response.data.data;
});

export const updatePrice = createAsyncThunk('inventory/updatePrice', async (theData, { dispatch }) => {
  const response = await theData.authCtx.jwtInst({
    method: 'put',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/variants/${theData.id}/price`,
    data: { price: theData.price, currency: theData.currency || 'AED' },
  });
  dispatch(fetchProduct({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, id: theData.productId }));
  dispatch(fetchVariants({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, productId: theData.productId }));
  toast(dispatch, `Price updated to ${theData.price} AED`);
  return response.data.data;
});

export const uploadInventoryMedia = createAsyncThunk('inventory/uploadMedia', async (theData, { dispatch }) => {
  const url = theData.subjectType === 'variant'
    ? `${theData.axiosGlobal.defaultTargetApi}/inventory/variants/${theData.subjectId}/media`
    : `${theData.axiosGlobal.defaultTargetApi}/inventory/products/${theData.subjectId}/media`;

  const response = await theData.authCtx.jwtInst({
    method: 'post',
    url,
    data: theData.formData,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  dispatch(fetchProduct({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, id: theData.productId }));
  toast(dispatch, 'Media uploaded');
  return response.data.data;
});

export const uploadVariantMediaBatch = createAsyncThunk('inventory/uploadVariantMediaBatch', async (theData, { dispatch }) => {
  const response = await theData.authCtx.jwtInst({
    method: 'post',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/variants/${theData.variantId}/media-batch`,
    data: theData.formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: theData.onUploadProgress,
  });
  dispatch(fetchProduct({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, id: theData.productId }));
  toast(dispatch, 'Media batch uploaded');
  return response.data.data;
});

export const downloadInventoryMediaFile = createAsyncThunk('inventory/downloadMediaFile', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: theData.fileUrl,
      responseType: 'blob',
    });
    const url  = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = theData.fileName || 'file';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Could not download file', type: 'error' }));
  }
});

export const downloadVariantMediaBatchZip = createAsyncThunk('inventory/downloadMediaBatchZip', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/inventory/variants/${theData.variantId}/media-batch/zip`,
      responseType: 'blob',
    });
    const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${theData.variantCode || 'variant'}-media-batch.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Could not download media batch', type: 'error' }));
  }
});

export const deleteInventoryMedia = createAsyncThunk('inventory/deleteMedia', async (theData, { dispatch }) => {
  await theData.authCtx.jwtInst({
    method: 'delete',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/media/${theData.fileId}`,
  });
  dispatch(fetchProduct({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, id: theData.productId }));
  toast(dispatch, 'Media deleted');
});

// Product-level media as a real batch (single XHR, real onUploadProgress) —
// PURELY ADDITIVE, mirrors uploadVariantMediaBatch but with none of that
// route's delete-and-replace semantics (product media accumulates, it isn't
// a versioned set like a variant's batch).
export const uploadProductMediaBatch = createAsyncThunk('inventory/uploadProductMediaBatch', async (theData, { dispatch }) => {
  const response = await theData.authCtx.jwtInst({
    method: 'post',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/products/${theData.productId}/media-batch`,
    data: theData.formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: theData.onUploadProgress,
  });
  dispatch(fetchProduct({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, id: theData.productId }));
  toast(dispatch, 'Media uploaded');
  return response.data.data;
});

export const bulkDeleteInventoryMedia = createAsyncThunk('inventory/bulkDeleteMedia', async (theData, { dispatch }) => {
  await theData.authCtx.jwtInst({
    method: 'post',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/media/bulk`,
    data: { fileIds: theData.fileIds, action: 'delete' },
  });
  dispatch(fetchProduct({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal, id: theData.productId }));
  toast(dispatch, 'Media deleted');
});

export const bulkDownloadInventoryMediaZip = createAsyncThunk('inventory/bulkDownloadMediaZip', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'post',
      url: `${theData.axiosGlobal.defaultTargetApi}/inventory/media/bulk`,
      data: { fileIds: theData.fileIds, action: 'zip' },
      responseType: 'blob',
    });
    const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory-media.zip';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    dispatch(actions.setShowSnackBar({ status: true, msg: 'Could not download media', type: 'error' }));
  }
});

export const fetchInventoryLogs = createAsyncThunk('inventory/fetchLogs', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/inventory/products/${theData.productId}/logs`,
      params: theData.params || {},
    });
    dispatch(actions.invSetLogs({ data: response.data.data, total: response.data.total }));
  } catch (err) {
    console.error(err);
  }
});

export const parseInventoryCode = createAsyncThunk('inventory/parseCode', async (theData, { dispatch }) => {
  dispatch(actions.invSetParsedCodeLoading(true));
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'post',
      url: `${theData.axiosGlobal.defaultTargetApi}/inventory/parse-code`,
      data: { code: theData.code },
    });
    dispatch(actions.invSetParsedCode(response.data.parsed));
  } catch (err) {
    dispatch(actions.invSetParsedCode(null));
  } finally {
    dispatch(actions.invSetParsedCodeLoading(false));
  }
});

export const fetchInventoryLookups = createAsyncThunk('inventory/fetchLookups', async (theData, { dispatch, getState }) => {
  if (getState().invLookupsLoaded) return;
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/inventory/lookups`,
    });
    dispatch(actions.invSetLookups(response.data));
  } catch (err) {
    console.error(err);
  }
});

export const fetchInvStats = createAsyncThunk('inventory/fetchStats', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/inventory/stats`,
      params: theData.params || {},
    });
    dispatch(actions.invSetStats(response.data));
  } catch (err) {
    console.error(err);
  }
});

export const fetchCategories = createAsyncThunk('inventory/fetchCategories', async (theData, { dispatch }) => {
  try {
    const response = await theData.authCtx.jwtInst({
      method: 'get',
      url: `${theData.axiosGlobal.defaultTargetApi}/inventory/categories`,
    });
    dispatch(actions.invSetCategories(response.data.data));
  } catch (err) {
    console.error(err);
  }
});

export const createCategory = createAsyncThunk('inventory/createCategory', async (theData, { dispatch }) => {
  const response = await theData.authCtx.jwtInst({
    method: 'post',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/categories`,
    data: { name: theData.name, description: theData.description },
  });
  dispatch(fetchCategories({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal }));
  toast(dispatch, `Category "${theData.name}" created`);
  return response.data.data;
});

export const deleteCategory = createAsyncThunk('inventory/deleteCategory', async (theData, { dispatch }) => {
  await theData.authCtx.jwtInst({
    method: 'delete',
    url: `${theData.axiosGlobal.defaultTargetApi}/inventory/categories/${theData.id}`,
  });
  dispatch(fetchCategories({ authCtx: theData.authCtx, axiosGlobal: theData.axiosGlobal }));
  toast(dispatch, 'Category deleted');
});

//------------------------------inventory end




const dataSlice = createSlice({
  name: 'getFilesAndFolders',
  initialState: {
    //------------------------------file manager 
    currentImageGallery:[], tagsToShow:[], downloadNavMenu:[], tagsForList:[] , refreshTag:0 ,data: [], routeLink:[] , selectedItems:[] , currentDisplay:{} , float:[] , loading: false, error: null , tempDoc:{} , uploadQueue:[] , downloadQueue:[] ,routeLinkFilePicker:[] ,currentDisplayFilePicker:{}, floatFilePicker:[] , allTags:[] , refresh:1 , lastQueueCount:0 , onGoingUpload:false , newLinkCreationLoading:false,
    //------------------------------overall assets
    filterCrm:{},
    filterMis:{},
    userProfile:{},
    userProfileRefresh:2,
    showSnackBar:{status:false , msg:'' , type:''},
    contactList : {sa:[],inv:[],req:[] , all:[] , allAll:[] , lenght:0},
    userDirectory: {},
    userDirectoryLoaded: false,


    //------------------------------crm (Phase 5)
    crmCustomers: [],
    crmTotal: 0,
    crmLoading: false,
    crmSelectedCustomer: null,
    crmRefreshKey: 0,
    //------------------------------mis (Phase 6 rebuild)
    misInvoices: [],
    misInvoicesTotal: 0,
    misInvoicesLoading: false,
    misSelectedInvoice: null,
    misRefreshKey: 0,
    misCompanyProfile: null,
    //------------------------------digital marketing (Phase 8)
    dmRawContents: [],
    dmRawContentsTotal: 0,
    dmRawContentsLoading: false,
    dmSelectedRawContent: null,
    dmSelectedRawContentErrorStatus: null,
    dmRawContentChat: [],
    dmRawContentChatTotal: 0,
    dmReadyToUpload: [],
    dmReadyToUploadTotal: 0,
    dmReadyToUploadLoading: false,
    dmSelectedReadyToUpload: null,
    dmSelectedReadyToUploadErrorStatus: null,
    dmLinkPages: [],
    dmLinkPagesTotal: 0,
    dmLinkPagesLoading: false,
    dmSelectedLinkPage: null,
    dmSelectedLinkPageErrorStatus: null,
    dmWhatsappShares: [],
    dmWhatsappSharesTotal: 0,
    dmWhatsappSharesLoading: false,
    dmSelectedWhatsappShare: null,
    dmSelectedWhatsappShareErrorStatus: null,
    dmRefreshKey: 0,
    //------------------------------tutorial center
    tutorials: [],
    tutorialsTotal: 0,
    tutorialsLoading: false,
    tutorialActionTags: {},
    selectedTutorial: null,
    selectedTutorialErrorStatus: null,
    tutorialRefreshKey: 0,
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
    invProducts: [],
    invTotal: 0,
    invLoading: false,
    invError: null,
    invRefreshKey: '',
    invCurrentProduct: null,
    invCurrentProductLoading: false,
    invCurrentProductErrorStatus: null,
    invVariants: [],
    invLogs: [],
    invLogsTotal: 0,
    invLookups: { stoneTypes: [], grades: [], units: [], quarries: [] },
    invLookupsLoaded: false,
    invParsedCode: null,
    invParsedCodeLoading: false,
    invShowNewProduct: false,
    invEditProduct: null,
    invShowNewVariant: false,
    invEditVariant: null,
    invCurrentVariant: null,
    invShowVariantDetail: false,
    invCategories: [],
    invStats: null,
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
    // Pause is a DISTINCT state from cancel (own icon/label in the transfer
    // center) but mechanically the same abort — the File API gives no way to
    // resume a stream mid-byte-range, so "resume" (see setFileForRetry) just
    // restarts the same file, exactly like retrying a canceled/failed upload.
    pauseTheUploading(state , action){
      const item = state.uploadQueue[action.payload.index];
      item.uploading = false;
      item.paused = true;
      item.cancelToken.cancel('upload paused');
    },
    cancelToken(state , action){
      state.uploadQueue[action.payload.index].cancelToken = action.payload.token;
    },
    // ── Download transfer center ────────────────────────────────────────────
    enqueueDownload(state, action){
      state.downloadQueue.push({
        id: action.payload.id,
        kind: action.payload.kind,           // 'zip' | 'single'
        label: action.payload.label,
        itemCount: action.payload.itemCount || 1,
        // Persisted so retry/resume can re-fire the SAME request without the
        // caller having to remember/re-supply what was being downloaded.
        selected: action.payload.selected || null,   // zip: [{id,type}]
        fileId: action.payload.fileId || null,        // single: file _id
        status: 'downloading',               // downloading | paused | done | canceled | error
        progress: 0,
        receivedBytes: 0,
        totalBytes: 0,
        error: null,
        cancelToken: null,
      });
    },
    updateDownloadProgress(state, action){
      const item = state.downloadQueue.find(d => d.id === action.payload.id);
      if (!item) return;
      if (action.payload.progress !== undefined) item.progress = action.payload.progress;
      item.receivedBytes = action.payload.receivedBytes;
      if (action.payload.totalBytes) item.totalBytes = action.payload.totalBytes;
    },
    setDownloadStatus(state, action){
      const item = state.downloadQueue.find(d => d.id === action.payload.id);
      if (item) item.status = action.payload.status;
    },
    setDownloadCancelToken(state, action){
      const item = state.downloadQueue.find(d => d.id === action.payload.id);
      if (item) item.cancelToken = action.payload.cancelToken;
    },
    setDownloadError(state, action){
      const item = state.downloadQueue.find(d => d.id === action.payload.id);
      if (item) { item.status = 'error'; item.error = action.payload.msg; }
    },
    cancelDownload(state, action){
      const item = state.downloadQueue.find(d => d.id === action.payload.id);
      if (!item) return;
      item.status = action.payload.paused ? 'paused' : 'canceled';
      item.cancelToken?.cancel?.(action.payload.paused ? 'download paused' : 'download cancelled');
    },
    removeDownload(state, action){
      state.downloadQueue = state.downloadQueue.filter(d => d.id !== action.payload);
    },
    clearFinishedDownloads(state){
      state.downloadQueue = state.downloadQueue.filter(d => d.status === 'downloading' || d.status === 'paused');
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









    //------------------------------crm reducers (Phase 5)
      crmSetCustomers(state, action) {
        state.crmCustomers = action.payload.data;
        state.crmTotal     = action.payload.total;
      },
      crmAppendCustomers(state, action) {
        state.crmCustomers = [...state.crmCustomers, ...(action.payload.data || [])];
        state.crmTotal     = action.payload.total;
      },
      crmSetLoading(state, action) {
        state.crmLoading = action.payload;
      },
      crmSetSelectedCustomer(state, action) {
        state.crmSelectedCustomer = action.payload;
      },
      crmRemoveCustomer(state, action) {
        state.crmCustomers  = state.crmCustomers.filter(c => String(c._id) !== String(action.payload));
        state.crmTotal      = Math.max(0, state.crmTotal - 1);
        if (state.crmSelectedCustomer && String(state.crmSelectedCustomer._id) === String(action.payload)) {
          state.crmSelectedCustomer = null;
        }
      },
      crmUpsertCustomer(state, action) {
        const idx = state.crmCustomers.findIndex(c => String(c._id) === String(action.payload._id));
        if (idx !== -1) {
          state.crmCustomers[idx] = action.payload;
        } else {
          state.crmCustomers.unshift(action.payload);
          state.crmTotal += 1;
        }
        if (state.crmSelectedCustomer && String(state.crmSelectedCustomer._id) === String(action.payload._id)) {
          state.crmSelectedCustomer = action.payload;
        }
      },
      crmBumpRefresh(state) {
        state.crmRefreshKey = state.crmRefreshKey + 1;
      },
    //------------------------------crm reducers end
    //------------------------------mis reducers (Phase 6 rebuild)
      misInvSetList(state, action) {
        state.misInvoices      = action.payload.data;
        state.misInvoicesTotal = action.payload.total;
      },
      misInvAppendList(state, action) {
        state.misInvoices      = [...state.misInvoices, ...(action.payload.data || [])];
        state.misInvoicesTotal = action.payload.total;
      },
      misInvSetLoading(state, action) {
        state.misInvoicesLoading = action.payload;
      },
      misInvSetSelected(state, action) {
        state.misSelectedInvoice = action.payload;
      },
      misInvRemove(state, action) {
        state.misInvoices      = state.misInvoices.filter(d => String(d._id) !== String(action.payload));
        state.misInvoicesTotal = Math.max(0, state.misInvoicesTotal - 1);
        if (state.misSelectedInvoice && String(state.misSelectedInvoice._id) === String(action.payload)) {
          state.misSelectedInvoice = null;
        }
      },
      misInvUpsert(state, action) {
        const idx = state.misInvoices.findIndex(d => String(d._id) === String(action.payload._id));
        if (idx >= 0) state.misInvoices[idx] = action.payload;
        if (state.misSelectedInvoice && String(state.misSelectedInvoice._id) === String(action.payload._id)) {
          state.misSelectedInvoice = { ...state.misSelectedInvoice, ...action.payload };
        }
      },
      misInvBumpRefresh(state) {
        state.misRefreshKey = state.misRefreshKey + 1;
      },
      misSetCompanyProfile(state, action) {
        state.misCompanyProfile = action.payload;
      },
    //------------------------------mis reducers end
    //------------------------------digital marketing reducers (Phase 8)
      dmRawSetList(state, action) {
        state.dmRawContents      = action.payload.data;
        state.dmRawContentsTotal = action.payload.total;
      },
      dmRawAppendList(state, action) {
        state.dmRawContents      = [...state.dmRawContents, ...(action.payload.data || [])];
        state.dmRawContentsTotal = action.payload.total;
      },
      dmRawSetLoading(state, action) {
        state.dmRawContentsLoading = action.payload;
      },
      dmRawSetSelected(state, action) {
        state.dmSelectedRawContent = action.payload;
      },
      dmRawSetSelectedErrorStatus(state, action) {
        state.dmSelectedRawContentErrorStatus = action.payload;
      },
      dmRawRemove(state, action) {
        state.dmRawContents      = state.dmRawContents.filter(d => String(d._id) !== String(action.payload));
        state.dmRawContentsTotal = Math.max(0, state.dmRawContentsTotal - 1);
        if (state.dmSelectedRawContent && String(state.dmSelectedRawContent._id) === String(action.payload)) {
          state.dmSelectedRawContent = null;
        }
      },
      dmRawUpsert(state, action) {
        const idx = state.dmRawContents.findIndex(d => String(d._id) === String(action.payload._id));
        if (idx >= 0) state.dmRawContents[idx] = action.payload;
        if (state.dmSelectedRawContent && String(state.dmSelectedRawContent._id) === String(action.payload._id)) {
          state.dmSelectedRawContent = { ...state.dmSelectedRawContent, ...action.payload };
        }
      },
      dmRawChatSetList(state, action) {
        state.dmRawContentChat      = action.payload.data;
        state.dmRawContentChatTotal = action.payload.total;
      },
      dmRawChatPrepend(state, action) {
        // older-page pagination — new page loads BEFORE the currently held messages
        state.dmRawContentChat = [...action.payload, ...state.dmRawContentChat];
      },
      dmRawChatPush(state, action) {
        // a single new message — own send, or a real-time socket delivery
        const exists = state.dmRawContentChat.some(m => String(m._id) === String(action.payload._id));
        if (!exists) state.dmRawContentChat.push(action.payload);
      },
      dmReadySetList(state, action) {
        state.dmReadyToUpload      = action.payload.data;
        state.dmReadyToUploadTotal = action.payload.total;
      },
      dmReadyAppendList(state, action) {
        state.dmReadyToUpload      = [...state.dmReadyToUpload, ...(action.payload.data || [])];
        state.dmReadyToUploadTotal = action.payload.total;
      },
      dmReadySetLoading(state, action) {
        state.dmReadyToUploadLoading = action.payload;
      },
      dmReadySetSelected(state, action) {
        state.dmSelectedReadyToUpload = action.payload;
      },
      dmReadySetSelectedErrorStatus(state, action) {
        state.dmSelectedReadyToUploadErrorStatus = action.payload;
      },
      dmReadyRemove(state, action) {
        state.dmReadyToUpload      = state.dmReadyToUpload.filter(d => String(d._id) !== String(action.payload));
        state.dmReadyToUploadTotal = Math.max(0, state.dmReadyToUploadTotal - 1);
        if (state.dmSelectedReadyToUpload && String(state.dmSelectedReadyToUpload._id) === String(action.payload)) {
          state.dmSelectedReadyToUpload = null;
        }
      },
      dmBumpRefresh(state) {
        state.dmRefreshKey = state.dmRefreshKey + 1;
      },
      dmLinkSetList(state, action) {
        state.dmLinkPages      = action.payload.data;
        state.dmLinkPagesTotal = action.payload.total;
      },
      dmLinkAppendList(state, action) {
        state.dmLinkPages      = [...state.dmLinkPages, ...(action.payload.data || [])];
        state.dmLinkPagesTotal = action.payload.total;
      },
      dmLinkSetLoading(state, action) {
        state.dmLinkPagesLoading = action.payload;
      },
      dmLinkSetSelected(state, action) {
        state.dmSelectedLinkPage = action.payload;
      },
      dmLinkSetSelectedErrorStatus(state, action) {
        state.dmSelectedLinkPageErrorStatus = action.payload;
      },
      dmLinkRemove(state, action) {
        state.dmLinkPages      = state.dmLinkPages.filter(d => String(d._id) !== String(action.payload));
        state.dmLinkPagesTotal = Math.max(0, state.dmLinkPagesTotal - 1);
        if (state.dmSelectedLinkPage && String(state.dmSelectedLinkPage._id) === String(action.payload)) {
          state.dmSelectedLinkPage = null;
        }
      },
      dmLinkUpsert(state, action) {
        const idx = state.dmLinkPages.findIndex(d => String(d._id) === String(action.payload._id));
        if (idx >= 0) state.dmLinkPages[idx] = action.payload;
        if (state.dmSelectedLinkPage && String(state.dmSelectedLinkPage._id) === String(action.payload._id)) {
          state.dmSelectedLinkPage = { ...state.dmSelectedLinkPage, ...action.payload };
        }
      },
      dmWhatsappSetList(state, action) {
        state.dmWhatsappShares      = action.payload.data;
        state.dmWhatsappSharesTotal = action.payload.total;
      },
      dmWhatsappAppendList(state, action) {
        state.dmWhatsappShares      = [...state.dmWhatsappShares, ...(action.payload.data || [])];
        state.dmWhatsappSharesTotal = action.payload.total;
      },
      dmWhatsappSetLoading(state, action) {
        state.dmWhatsappSharesLoading = action.payload;
      },
      dmWhatsappSetSelected(state, action) {
        state.dmSelectedWhatsappShare = action.payload;
      },
      dmWhatsappSetSelectedErrorStatus(state, action) {
        state.dmSelectedWhatsappShareErrorStatus = action.payload;
      },
      dmWhatsappRemove(state, action) {
        state.dmWhatsappShares      = state.dmWhatsappShares.filter(d => String(d._id) !== String(action.payload));
        state.dmWhatsappSharesTotal = Math.max(0, state.dmWhatsappSharesTotal - 1);
        if (state.dmSelectedWhatsappShare && String(state.dmSelectedWhatsappShare._id) === String(action.payload)) {
          state.dmSelectedWhatsappShare = null;
        }
      },
    //------------------------------digital marketing reducers end
    //------------------------------tutorial center reducers
      tutSetList(state, action) {
        state.tutorials      = action.payload.data;
        state.tutorialsTotal = action.payload.total;
      },
      tutAppendList(state, action) {
        state.tutorials      = [...state.tutorials, ...(action.payload.data || [])];
        state.tutorialsTotal = action.payload.total;
      },
      tutSetLoading(state, action) {
        state.tutorialsLoading = action.payload;
      },
      tutSetActionTags(state, action) {
        state.tutorialActionTags = action.payload;
      },
      tutSetSelected(state, action) {
        state.selectedTutorial = action.payload;
      },
      tutSetSelectedErrorStatus(state, action) {
        state.selectedTutorialErrorStatus = action.payload;
      },
      tutRemove(state, action) {
        state.tutorials      = state.tutorials.filter(d => String(d._id) !== String(action.payload));
        state.tutorialsTotal = Math.max(0, state.tutorialsTotal - 1);
        if (state.selectedTutorial && String(state.selectedTutorial._id) === String(action.payload)) {
          state.selectedTutorial = null;
        }
      },
      tutUpsert(state, action) {
        const idx = state.tutorials.findIndex(d => String(d._id) === String(action.payload._id));
        if (idx >= 0) state.tutorials[idx] = action.payload;
        if (state.selectedTutorial && String(state.selectedTutorial._id) === String(action.payload._id)) {
          state.selectedTutorial = { ...state.selectedTutorial, ...action.payload };
        }
      },
      tutBumpRefresh(state) {
        state.tutorialRefreshKey = state.tutorialRefreshKey + 1;
      },
    //------------------------------tutorial center reducers end
      toggleDownloadNavMenu(state , action){
        state.downloadNavMenu = !state.downloadNavMenu
      },
    //------------------------------crm end















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

    //------------------------------user directory
      setUserDirectory(state, action) {
        state.userDirectory = action.payload;
        state.userDirectoryLoaded = true;
      },
    //------------------------------user directory

    



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

    //------------------------------inventory
    invSetLoading(state, action)            { state.invLoading = action.payload; },
    invSetError(state, action)              { state.invError = action.payload; },
    invSetProducts(state, action)           { state.invProducts = action.payload.data; state.invTotal = action.payload.total; },
    invAppendProducts(state, action)        { state.invProducts = [...state.invProducts, ...action.payload.data]; state.invTotal = action.payload.total; },
    invRefresh(state)                       { state.invRefreshKey = Math.random().toString(); },
    invSetCurrentProduct(state, action)     { state.invCurrentProduct = action.payload; },
    invSetCurrentProductLoading(state, action) { state.invCurrentProductLoading = action.payload; },
    invSetCurrentProductErrorStatus(state, action) { state.invCurrentProductErrorStatus = action.payload; },
    invSetVariants(state, action)           { state.invVariants = action.payload; },
    invSetLogs(state, action)               { state.invLogs = action.payload.data; state.invLogsTotal = action.payload.total; },
    invSetLookups(state, action)            { state.invLookups = action.payload; state.invLookupsLoaded = true; },
    invSetParsedCode(state, action)         { state.invParsedCode = action.payload; },
    invSetParsedCodeLoading(state, action)  { state.invParsedCodeLoading = action.payload; },
    invToggleNewProduct(state)              { state.invShowNewProduct = !state.invShowNewProduct; },
    invSetEditProduct(state, action)        { state.invEditProduct = action.payload; },
    invToggleNewVariant(state)              { state.invShowNewVariant = !state.invShowNewVariant; },
    invSetEditVariant(state, action)        { state.invEditVariant = action.payload; },
    invSetCurrentVariant(state, action)     { state.invCurrentVariant = action.payload; },
    invToggleVariantDetail(state)           { state.invShowVariantDetail = !state.invShowVariantDetail; },
    invSetCategories(state, action)         { state.invCategories = action.payload; },
    invSetStats(state, action)              { state.invStats = action.payload; },
    //------------------------------inventory

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
        paused:false,
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

    





    
  }
});

export const { actions, reducer } = dataSlice;
  const store = configureStore({
      reducer: dataSlice.reducer,
      middleware: [thunk] // Include the redux-thunk middleware
  }
 )
 

 export default store;
