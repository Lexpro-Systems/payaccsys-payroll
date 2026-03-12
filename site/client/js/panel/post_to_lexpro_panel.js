/* jslint node: true */
/* globals app, lx */
'use strict';


// POST TO LEXPRO PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown
//                      Default to false
//
// Events:
//
//  onFinish            This event is fired after the profile data was successfully saved
//  onDestroy           This event is fired just before the component is destroyed
//
app.panel.PostToLexpro = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var contentEl = null;
    var loader = null;
    
    var transactionsGrid = null;
    
    var buttonContainerEl = null;
    var repostCheckbox = null;
    var cancelBtn = null;
    var postBtn = null;
    
    var payrunId = null;
    
    
    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load the payrun data
    function loadTransactions( payrunId ) {
        loader.show(false);
        
        lx.sendJSON({
            url: 'exec.php?c=LexproAccounting&fn=getTransactionList',
            data: {
                payrunId: payrunId
            },
            onSuccess: function( responseText ) {
                loader.hide();
                var response = JSON.parse( responseText );
                
                // Check that the response is ok
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Lexpro Transactions Failed',
                        message: response.error
                    });
                }
                
                // Loop through all transaction
                let transactions = [];
                for( let i = 0; i < response.transactions.length; i++ ) {
                    transactions.push({
                        payslipId: response.transactions[i].payslipId,
                        type: response.transactions[i].type,
                        postingDate: response.transactions[i].date,
                        account: (response.transactions[i].accountNumber + ' - ' + response.transactions[i].accountName),
                        accountNumber: response.transactions[i].accountNumber,
                        bankAccount: response.transactions[i].bankAccount.name,
                        bankAccountId: response.transactions[i].bankAccount.id,
                        vat: response.transactions[i].vat,
                        description: response.transactions[i].description,
                        amount: response.transactions[i].amount,
                        amountDisplay: lx.util.formatCurrency(response.transactions[i].amount),
                        datePosted: '-',
                        amountPosted: 0,
                        amountPostedDisplay: '-',
                        exportId: 0,
                        updateCount: -1
                    });
                }
                transactionsGrid.addRows( transactions );
                
                // Select all transactions by default
                for( let j = 0; j < transactionsGrid.getRowCount(); j++ ) {
                    transactionsGrid.selectRow(j);
                }
                
                // Check if there are any previous exports
                lx.sendJSON({
                    url: 'exec.php?c=LexproAccounting&fn=getExportHistory',
                    data: {
                        searchString: '',
                        limit: null,
                        offset: 0,
                        sortOrder: 'ASC',
                        payrunId: payrunId
                    },
                    onSuccess: function( responseText ) {
                        var response = JSON.parse(responseText);
                        
                        if( response.ok !== true ) {
                            new lx.component.Messagebox({
                                title: 'Loading Lexpro Exports Failed',
                                message: response.error
                            });
                        }
                        
                        // For every export that was made
                        for( let h = 0; h < response.exports.length; h++ ) {
                            // For every transaction that was exported
                            let numFound = 0;
                            for( let i = 0; i < response.exports[h].transactions.length; i++ ) {
                                // For every item in the grid
                                for( let j = 0; j < transactionsGrid.getRowCount(); j++ ) {
                                    // Get the grid item details
                                    let record = transactionsGrid.getRow(j);
// console.log( record.type + ' | ' + response.exports[h].transactions[i].type );
// console.log( record.accountNumber + ' | ' + response.exports[h].transactions[i].accountNumber );
// console.log( record.bankAccountId + ' | ' + response.exports[h].transactions[i].bankAccountId );
// console.log( record.vat + ' | ' + response.exports[h].transactions[i].vat );
// console.log( record.description + ' | ' + response.exports[h].transactions[i].description );
// console.log( lx.util.formatCurrency(record.amount) + ' | ' + lx.util.formatCurrency(response.exports[h].transactions[i].amount) );
                                    // Has the transaction been exported already?
                                    if( (record.payslipId == response.exports[h].transactions[i].payslipId) &&
                                        (record.type == response.exports[h].transactions[i].type) &&
                                        (record.accountNumber == response.exports[h].transactions[i].accountNumber) &&
                                        (parseInt(record.bankAccountId) == parseInt(response.exports[h].transactions[i].bankAccountId)) &&
                                        (record.vat == response.exports[h].transactions[i].vat) &&
                                        (record.description == response.exports[h].transactions[i].description)) {
                                        // (lx.util.formatCurrency(record.amount) == lx.util.formatCurrency(response.exports[h].transactions[i].amount) )) {
                                        
                                        // Has this record NOT already been updated with the specified export data?
                                        if( (record.updateCount < h) && (numFound <= i) ) {
                                            // Another transaction was found
                                            numFound++;
                                            
                                            // Deselect the row, if it is selected
                                            if( transactionsGrid.rowIsSelected( j ) ) {
                                                transactionsGrid.deselectRow( j );
                                            }
                                            
                                            // Display the date posted
                                            record.datePosted = 
                                                '<span style="color: #C0C0C0;">' +
                                                    response.exports[h].exportedOn +
                                                '</span>';
                                            
                                            // Is the amount posted different than the calculated amount?
                                            if( record.updateCount < 0 ) {
                                                record.amountPosted = response.exports[h].transactions[i].amount;
                                            }
                                            else {
                                                record.amountPosted = parseFloat(record.amountPosted) + parseFloat(response.exports[h].transactions[i].amount);
                                            }
                                            
                                            // Is the amount posted different than the calculated amount?
                                            if( lx.util.formatCurrency(record.amountPosted) != record.amountDisplay ) {
                                                record.amountPostedDisplay = 
                                                    '<span style="color: #FF0000;">' +
                                                        lx.util.formatCurrency(record.amountPosted) +
                                                    '</span>';
                                            }
                                            else {
                                                record.amountPostedDisplay = 
                                                    '<span style="color: #C0C0C0;">' +
                                                        lx.util.formatCurrency(record.amountPosted) +
                                                    '</span>';
                                            }
                                            
                                            record.updateCount++;
                                            transactionsGrid.updateRow( j, record);
                                        }
                                    }
                                    
                                    // Was all transactions found?
                                    if( numFound > response.exports[h].transactions.length ) break;
                                }
                            }
                        }
                    }
                });
            }
        });
    }
    
    // Function to start editing a text cell
    //
    // rowIndex         The row index of the cell to edit.
    // colIndex         The column index of the cell to edit.
    // focus            Should the component be focussed after being created.
    function editCell(rowIndex, colIndex, focus) {
        let record = transactionsGrid.getRow(rowIndex);
        let cell = transactionsGrid.getCellContainer(rowIndex, colIndex);
        let dataIndex = transactionsGrid.getColumnDataIndex(colIndex);
        let newComponent = null;
        
        cell.innerHTML = '';
        cell.style.overflow = 'visible';
        
        // Create the edit component depending on the dataIndex
        if( dataIndex === 'postingDate' ) {
            newComponent = new lx.component.DatePicker({
                renderTo: cell,
                label: null
            });
        }
        
        // Add blur event handler
        newComponent.addEventListener('blur', function() {
            // Update the row and destroy the component before moving to the next
            record[transactionsGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
            cell.style.overflow = 'hidden';
            newComponent.destroy();
            transactionsGrid.updateRow(rowIndex, record);
        });
        
        // Add keydown handler
        newComponent.addEventListener('keydown', function( event ) {
            if( event.key === 13 ) {
                // Update the row and destroy the component before moving to the next
                record[transactionsGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                transactionsGrid.updateRow(rowIndex, record);
            }
            else if( event.key === 9 ) {
                // Update the row and destroy the component before moving to the next
                record[transactionsGrid.getColumnDataIndex(colIndex)] = newComponent.getValue();
                cell.style.overflow = 'hidden';
                newComponent.focus();
                newComponent.destroy();
                transactionsGrid.updateRow(rowIndex, record);
                
                // Edit the next cell
                if( dataIndex === 'postingDate' ) {
                    // Are there rows left to edit?
                    if( rowIndex + 1 < transactionsGrid.getRowCount() ) {
                        // Edit the next row
                        editCell(rowIndex + 1, colIndex, false);
                    }
                }
            }
        });
        
        if( focus === true ) newComponent.focus();
        newComponent.setValue( record[transactionsGrid.getColumnDataIndex(colIndex)] );
    }
    
    
    //
    // PUBLIC FUNCTIONS
    //
    
    me.init = function( config ) {
        // Initialize component config
        var compConfig = {
            renderTo: null,
            width: '100%',
            height: '100%',
            flex: '1 1 100%',
            show: false,
            
            payrunId: null,
            payrunDescription: null
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onCancel') ) me.addEventListener('cancel', compConfig.onCancel);
        if( compConfig.hasOwnProperty('onPost') ) me.addEventListener('post', compConfig.onPost);
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        confirmDestroy = false;
        payrunId = compConfig.payrunId;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
                backgroundColor: '#FFFFFF',
                overflow: 'visible'
            }
        });
        
        // Create the heading
        lx.createElement('DIV', {
            parent: el,
            style: {
                padding: '15px',
                fontSize: '18px',
                flex: '0 0 auto',
                borderStyle: 'solid',
                borderWidth: '0px 0px 1px 0px',
                borderColor: '#DFDFDF'
            },
            innerHTML: 'Post to Lexpro Accounting: ' + compConfig.payrunDescription
        });
        
        // Create the contentEl element
        contentEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                overflow: 'auto',
                position: 'relative',
                flex: '1 1 100%',
                backgroundColor: '#F4F5F6',
                padding: '0px 20px 20px 20px'
            }
        });
        
        // Create the loader
        loader = new lx.component.Loader({
            renderTo: contentEl
        });
        
        
        //
        // TRANSACTIONS SECTION
        //
        
        // Create a container for the transactions
        let transactionsContainer = lx.createElement('DIV', {
            parent: contentEl,
            className: 'flex-column flex-align-center',
            style: {
                boxSizing: 'border-box',
                padding: '0px 0px 1px 0px', // Hack required to allow the grid to fire the scroll event on Chrome browsers
                height: '100%',
                overflow: 'auto'
            }
        });
        
        // Create the headingEl element
        let headingEl = lx.createElement('DIV', {
            parent: transactionsContainer,
            style: {
                boxSizing: 'border-box',
                margin: '15px 0px 0px 0px',
                display: 'flex',
                width: '100%',
                padding: '0px 10px 0px 15px',
                minHeight: '40px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px 1px 0px 1px'
            }
        });
        
        // Display the heading text
        lx.createElement('DIV', {
            parent: headingEl,
            style: {
                margin: 'auto 0px auto 0px',
                fontSize: '16px'
            },
            innerHTML: 'Transactions to Post'
        });
        
        // Create the menu dropdown button
        let menuDropdownBtn = new lx.component.DropdownButton({
            renderTo: headingEl,
            margin: 'auto 0px auto auto',
            label: '<i class="fa fa-ellipsis-v"></i>',
            dropdownAlignment: 'right'
        });
        
        // Create the menuDropDownBtnSetPostingDateEl element
        let menuDropDownBtnSetPostingDateEl = lx.createElement('DIV', {
            parent: menuDropdownBtn.getContainer(),
            className: 'list-item',
            style: {
                width: '140px',
                padding: '10px 10px',
                borderStyle: 'solid',
                borderWidth: '0px 0px 0px 3px'
            },
            innerHTML: '<i class="fa fa-fw fa-pencil-alt" style="margin-right: 15px; font-size: 12px;"></i><span style="font-size: 14px;">Set Posting Date</span>'
        });
        menuDropDownBtnSetPostingDateEl.addEventListener('click', menuDropDownBtnSetPostingDateElClickEventHandler);
        
        // Create transactionsGrid component
        transactionsGrid = new lx.component.Grid({
            renderTo: transactionsContainer,
            // autoSize: true,
            flex: '1 1 100%',
            width: '100%',
            borderWidth: '1px',
            // margin: '15px 0px 0px 0px',
            
            columns: [
                {dataIndex: 'select', width: '50px', type: 'rowSelect', padding: '0px 0px 0px 5px'},
                {dataIndex: 'account', name: 'Account', width: '280px'},
                {dataIndex: 'bankAccount', name: 'Bank Account'},
                {dataIndex: 'description', name: 'Description'},
                {dataIndex: 'postingDate', name: 'Posting Date' + '<i class="fas fa-fw fa-pen" style="margin-left: 15px; font-size: 14px; color: #30313C;">', width: '150px'},
                {dataIndex: 'amountDisplay', name: 'Amount', alignment: 'right', width: '120px'},
                {dataIndex: 'datePosted', name: 'Time Posted', alignment: 'center', width: '140px'},
                {dataIndex: 'amountPostedDisplay', name: 'Amount Posted', alignment: 'right', width: '120px'}
            ],
            
            onCellClick: transactionsGridCellClickEventHandler
        });
        
        
        //
        // BUTTON CONTAINER SECTION
        //
        
        // Create the buttonContainerEl element
        buttonContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end',
                padding: '15px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: '#DFDFDF'
            }
        });
        
        // Create the cancelBtn component
        repostCheckbox = new lx.component.Checkbox({
            renderTo: buttonContainerEl,
            label: 'Post again',
            width: '200px',
            labelAlign: 'right',
            margin: '0px auto 0px 0px'
        });
        repostCheckbox.disable();
        
        // Create the cancelBtn component
        cancelBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Cancel',
            width: '120px',
            style: 'text',
            // margin: '0px 15px 0px 0px',
            
            onClick: cancelBtnClickEventHandler
        });
        
        
        // Create the postBtn component
        postBtn = new lx.component.Button({
            renderTo: buttonContainerEl,
            label: 'Post',
            width: '120px',
            
            onClick: postBtnClickEventHandler
        });
        
        // Load form data
        loadTransactions( compConfig.payrunId );
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Edit it to the new renderTo element
        renderTo.appendChild( el );
    };
    
    // Function to show the panel
    me.show = function() {
        lx.applyStyle(el, {display: 'flex'});
    };
    
    // Function to hide the panel
    me.hide = function() {
        lx.applyStyle(el, {display: 'none'});
    };
    
    // Function to set focus to the panel.
    me.focus = function() {
        // ...
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // Check if we need to confirm before destroying the panel.
        if( confirmDestroy === true ) {
            new lx.component.Messagebox({
                title: 'You have unsaved changes',
                message: 'If you continue the changes will be lost.',
                buttons: [
                    {name: 'cancel', label: 'Cancel', style: 'text', isCancel: true},
                    {name: 'continue', label: 'Continue', isDefault: true}
                ],
                onClose: function( event ) {
                    if( event.button === 'continue' ) {
                        confirmDestroy = false;
                        me.destroy();
                    }
                }
            });
            
            return false;
        }
        
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    // transactionsGrid cell click event handler
    function transactionsGridCellClickEventHandler(clickEvent) {
        // Get the data index of the column that was clicked
        let dataIndex = transactionsGrid.getColumnDataIndex(clickEvent.columnIndex);
        
        // Depending on the column clicked
        if( dataIndex === 'postingDate' ) {
            editCell(clickEvent.rowIndex, clickEvent.columnIndex, true);
        }
    }
    
    // Cancel button click event handler
    function cancelBtnClickEventHandler() {
        me.fireEvent('cancel', {srcPanel: me});
    }
    
    // Set posting date menu button click event handler
    function menuDropDownBtnSetPostingDateElClickEventHandler() {
        // Create a modal window
        var editPostingDateModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '232px'
        });
        
        // Create the editPostingDatePanel panel
        var editPostingDatePanel = new app.panel.EditPostingDate({
            renderTo: editPostingDateModal.getContainer(),
            show: true,
            
            postingDate: transactionsGrid.getRow(0).postingDate,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onApply: function( applyEvent ) {
                app.route.popState();
                
                // Set all the posting dates
                for( let rowIndex = 0; rowIndex < transactionsGrid.getRowCount(); rowIndex++ ) {
                    let record = transactionsGrid.getRow(rowIndex);
                    record.postingDate = applyEvent.postingDate;
                    transactionsGrid.updateRow(rowIndex, record);
                }
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        editPostingDateModal.addEventListener('destroy', function() {
            editPostingDatePanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: editPostingDateModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        editPostingDateModal.show();
        editPostingDatePanel.focus();
    }
    
    // Post button click event handler
    function postBtnClickEventHandler() {
        let $warningMessage = 'Are you certain you wish to post the payrun transactions to Lexpro Accounting?';
        
        // Make certain at least some rows are selected
        let hasSelectedRows = false;
        for( let i = 0; i < transactionsGrid.getRowCount(); i++ ) {
            if( transactionsGrid.rowIsSelected(i) ) {
                hasSelectedRows = true;
                break;
            }
        }
        
        if( !hasSelectedRows ) {
            postBtn.showWarning('No transactions have been selected. Please select the transactions you wish to post.');
            return;
        }
        
        // Check if there are any previous exports
        lx.sendJSON({
            url: 'exec.php?c=LexproAccounting&fn=getExportHistory',
            data: {
                searchString: '',
                limit: 1,
                offset: 0,
                sortOrder: 'DESC',
                payrunId: payrunId
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Lexpro Exports Failed',
                        message: response.error
                    });
                }
                
                // Update the warning message if the payrun has already been exported
                for( var i = 0; i < response.exports.length; i++ ) {
                    if( !repostCheckbox.getValue() ) { 
                        // Display the warning and give the user the option to cancel or continue
                        new lx.component.Messagebox({
                            title: 'Post to Lexpro Accounting',
                            message: 'The specified payrun was previously posted to Lexpro Accounting on ' + response.exports[i].exportedOn + '. Please check the \'Post again\' option to allow the transactions to be posted again.'
                        });
                        repostCheckbox.enable();
                        return;
                    }
                }
                
                // Display the warning and give the user the option to cancel or continue
                new lx.component.Messagebox({
                    title: 'Post to Lexpro Accounting',
                    message: $warningMessage,
                    buttons: [
                        {name: 'cancel', label: 'Cancel', isCancel: true, style: 'text'},
                        {name: 'post', label: 'Post', isDefault: true}
                    ],
                    onClose: function( closeEvent ) {
                        // Should the payrun transactions be posted?
                        if( closeEvent.button === 'post' ) {
                            // Get all the transactions from the grid
                            let transactions = [];
                            for( let i = 0; i < transactionsGrid.getRowCount(); i++ ) {
                                if( transactionsGrid.rowIsSelected(i) ) {
                                    let record = transactionsGrid.getRow(i);
                                    transactions.push({
                                        payslipId: record.payslipId,
                                        type: record.type,
                                        accountNumber: record.accountNumber,
                                        date: record.postingDate,
                                        description:  record.description,
                                        vat:  record.vat,
                                        bankAccount:{
                                            id: record.bankAccountId
                                        },
                                        amount: record.amount
                                    });
                                }
                            }
                            
                            // Post the payrun transactions
                            lx.sendJSON({
                                url: 'exec.php?c=LexproAccounting&fn=post',
                                data: {
                                    payrunId: payrunId,
                                    transactions: transactions
                                },
                                onSuccess: function( responseText ) {
                                    var response = JSON.parse(responseText);
                                    
                                    if( response.ok !== true ) {
                                        new lx.component.Messagebox({
                                            title: 'Post to Lexpro Accounting Failed',
                                            message: response.error
                                        });
                                        return;
                                    }
                                    
                                    me.fireEvent('post', {srcPanel: me});
                                }
                            });
                        }
                        else {
                            return;
                        }
                    }
                });
            }
        });
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};