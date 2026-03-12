'use strict';


// UPLOAD MANAGER CLASS
//
// Config:
//
// Events:
//
//  onEnqueue               This event is fired when a new upload is enqueued.
//  onUploadStart           This event is fired when an upload is started.
//  onUploadProgress        This event is fired whenever new upload progress data becomes available.
//  onUploadComplete        This event is fired when an upload is finished.
//  onUploadRemove          This event is fired when an upload is removed from the upload manager.
app.UploadManager = function( config ) {
    
    //
    // PRIVATE VARIABLES
    //
    
    let me = this;
    let nextUploadId = null;
    let uploads = null;
    let currentUploadId = null;
    let overallProgress = null;
    let overallProgressTotal = null;
    

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to initialize the object.
    function init( config ) {
        // Initialize state
        nextUploadId = 0;
        uploads = [];
        overallProgress = 0;
        overallProgressTotal = 0;
        
        // Add event handlers
        if( typeof config !== 'undefined' && config !== null ) {
            if( config.hasOwnProperty('onEnqueue') && config.onEnqueue !== null ) me.addEventListener('enqueue', config.onEnqueue);
            if( config.hasOwnProperty('onUploadStart') && config.onUploadStart !== null ) me.addEventListener('uploadstart', config.onUploadStart);
            if( config.hasOwnProperty('onUploadProgress') && config.onUploadProgress !== null ) me.addEventListener('uploadprogress', config.onUploadProgress);
            if( config.hasOwnProperty('onUploadComplete') && config.onUploadComplete !== null ) me.addEventListener('uploadcomplete', config.onUploadComplete);
            if( config.hasOwnProperty('onUploadRemove') && config.onUploadRemove !== null ) me.addEventListener('uploadremove', config.onUploadRemove);
        }
    }
    
    // Function to process uploads
    function processUploadQueue() {
        // Check if there are any uploads in the queue
        if( uploads.length === 0 ) return;
        
        // Check if there are any files currently being uploaded.
        if( currentUploadId !== null ) return;
        
        // Get the first pending upload and make it the current upload
        let currentUploadIndex = null;
        let pendingUploads = 0;
        for( let i = 0; i < uploads.length; i++ ) {
            if( uploads[i].status === 'pending' ) {
                if( currentUploadId === null ) {
                    currentUploadId = uploads[i].id;
                    currentUploadIndex = i;
                }
                
                pendingUploads++;
            }
        }
        
        // Reset upload progress if pending uploads are 0.
        if( pendingUploads === 0 ) {
            overallProgress = 0;
            overallProgressTotal = 0;
        }
        
        // If uploadIndex is null then there are no more files to upload.
        if( currentUploadId === null ) return;
        
        // Mark the file as being uploaded
        uploads[currentUploadIndex].status = 'uploading';
        
        // Fire the uploadstart event.
        me.fireEvent('uploadstart', {
            uploadId: uploads[currentUploadIndex].id
        });
        
        // Upload the file.
        lx.sendJSON({
            url: uploads[currentUploadIndex].url,
            data: uploads[currentUploadIndex].data,
            files: [
                {name: 'file', file: uploads[currentUploadIndex].file, fileName: uploads[currentUploadIndex].fileName}
            ],
            
            onProgress: function(loaded, total) {
                // Find the file with the given ID
                let uploadIndex = null;
                for( let i = 0; i < uploads.length; i++ ) {
                    if( uploads[i].id === currentUploadId ) {
                        uploadIndex = i;
                        break;
                    }
                }
                
                uploads[uploadIndex].bytesUploaded = loaded;
                
                // Fire uploadprogress event
                me.fireEvent('uploadprogress', {
                    uploadId: currentUploadId,
                    uploadProgress: loaded,
                    uploadSize: total,
                    totalProgress: overallProgress + loaded,
                    totalSize: overallProgressTotal
                });
            },
            onSuccess: function( responseText ) {
                let response = JSON.parse( responseText );
                
                // Find the file with the given ID
                let uploadIndex = null;
                for( let i = 0; i < uploads.length; i++ ) {
                    if( uploads[i].id === currentUploadId ) {
                        uploadIndex = i;
                        break;
                    }
                }
                
                // Check if the file uploaded successfully
                if( response.ok === true ) {
                    uploads[uploadIndex].status = 'done';
                }
                else {
                    uploads[uploadIndex].status = 'failed';
                    uploads[uploadIndex].error = response.error;
                }
                
                // Update progress details
                overallProgress = overallProgress + uploads[uploadIndex].size;
                
                // Fire the uploadComplete event
                me.fireEvent('uploadcomplete', {uploadId: currentUploadId});
                
                // Clear the current file being uploaded.
                currentUploadId = null;
                
                // Process other uploads
                processUploadQueue();
            }
        });
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    // Function to add a file upload
    //
    // url          the URL the file will be submitted to
    // data         Data to post when sending the file
    // file         The file to upload.
    // return       The ID of the file upload.
    me.queueUpload = function(url, data, file) {
        // Get a new ID for the file.
        nextUploadId++;
        
        // Add the upload to the queue
        let newUpload = {
            id: nextUploadId,
            url: url,
            data: data,
            file: file,
            status: 'pending',
            size: file.size,
            bytesUploaded: 0,
        };
        
        // Add the upload to the upload queue
        uploads.push( newUpload );
        
        // Fire the enqueue event
        me.fireEvent('enqueue', {
            uploadId: nextUploadId
        });
        
        // Update progress values.
        overallProgressTotal = overallProgressTotal + newUpload.size;
        
        // Process the upload queue
        processUploadQueue();
        
        return nextUploadId;
    };
    
    // Function to remove an upload
    //
    // uploadId         The ID of the upload to remove.
    me.removeUpload = function( uploadId ) {
        for( let i = 0; i < uploads.length; i++ ) {
            if( uploads[i].id === uploadId ) {
                uploads.splice(i, 1);
                me.fireEvent('uploadremove', {uploadId: uploadId});
                return;
            }
        }
    };
    
    // Function to get the amount of uploads in the manager
    me.getUploadCount = function() {
        return uploads.length;
    };
    
    // Function to get the amount of pending uploads.
    me.getPendingCount = function() {
        let count = 0;
        for( let i = 0; i < uploads.length; i++ ) if( uploads[i].status === 'pending' ) count++;
        
        return count;
    };
    
    // Function to get the amount of finished uploads.
    me.getCompletedCount = function() {
        let count = 0;
        for( let i = 0; i < uploads.length; i++ ) if( uploads[i].status === 'done' ) count++;
        
        return count;
    };
    
    // Function to get the amount of failed uploads.
    me.getFailedCount = function() {
        let count = 0;
        for( let i = 0; i < uploads.length; i++ ) if( uploads[i].status === 'failed' ) count++;
        
        return count;
    };
    
    // Function to get the amount of active uploads
    me.getActiveCount = function() {
        let count = 0;
        for( let i = 0; i < uploads.length; i++ ) if( uploads[i].status === 'uploading' ) count++;
        
        return count;
    };
    
    // Function to get a file upload from its ID.  IF the file is not found null is returned.
    //
    // uploadId             The ID of the upload to get.
    // return               An upload object or null if an upload with the given ID does not exist.
    me.getUpload = function( uploadId ) {
        for( let i = 0; i < uploads.length; i++ ) {
            if( uploads[i].id === uploadId ) {
                return {
                    id: uploadId,
                    url: uploads[i].url,
                    data: uploads[i].data,
                    file: uploads[i].file,
                    status: uploads[i].status,
                    error: uploads[i].error
                };
            }
        }
        
        return null;
    };
    
    // Function to clear all completed downloads.
    me.clearCompleted = function() {
        for( let i = uploads.length -1; i >= 0; i-- ) {
            overallProgress = 0;
            overallProgressTotal = 0;
            if( uploads[i].status === 'done' ) uploads.splice(i, 1);
        }
    };
    
    
    //
    // INITIALIZE THE OBJECT
    //
    
    init( config );
};
