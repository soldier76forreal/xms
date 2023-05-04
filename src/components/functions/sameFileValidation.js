export default function areFilesEqual(file1, file2) {
  if (Object.keys(file2).length === 0 && Object.keys(file1).length !== 0) {
    return false;
  }
  if (Object.keys(file2).length === 0 && Object.keys(file1).length === 0) {
    return true;
  }
  if (Object.keys(file2).length !== 0 && Object.keys(file1).length !== 0) {
  
    if (file1.name !== file2.name) {
      return false;
    } 
      // Compare file names
      if (file1.name !== file2.name) {
        return false;
      }
    
      // Compare file sizes
      if (file1.size !== file2.size) {
        return false;
      }
    
      // Compare file contents
      const file1Reader = new FileReader();
      const file2Reader = new FileReader();
    
      return new Promise((resolve, reject) => {
        file1Reader.onload = () => {
          const file1Contents = file1Reader.result;
          file2Reader.readAsBinaryString(file2);
    
          file2Reader.onload = () => {
            const file2Contents = file2Reader.result;
            resolve(file1Contents === file2Contents);
          };
    
          file2Reader.onerror = () => {
            reject(file2Reader.error);
          };
        };
    
        file1Reader.onerror = () => {
          reject(file1Reader.error);
        };
    
        file1Reader.readAsBinaryString(file1);
      });

  }   
  }
  