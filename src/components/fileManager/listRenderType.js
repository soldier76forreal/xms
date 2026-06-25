const  ListRenderType =(theData , listType , dataType)=>{
    if(theData.file.format === 'jpg' || theData.file.format === 'JPG' || theData.file.format === 'png' ||theData.file.format === 'svg' || theData.file.format === 'jpeg'){
      return('image')  
    }else if(theData.file.format === 'mp4'){
        return('video')
    }else if(theData.file.format === 'pdf'){
        return('pdf')
    }else{
        return('others')
    }
}
export default ListRenderType