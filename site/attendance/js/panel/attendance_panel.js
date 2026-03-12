/* globals app, lx */
'use strict';


// ATTENDANCE PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//  show:               If true the panel will be shown immediately after it was created.  If false the panel will be created but not shown.
//                      Default to false.
//
// Events:
//
//  onDestroy           This event is fired just before the panel is destroyed.
//
app.panel.Attendance = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    var persons = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    var departmentSelect = null;
    let tagsSelect = null;
    var searchTxt = null;
    var addVisitorBtn = null;
    var historyBtn = null;
    
    var loaderContainerEl = null;
    var contentContainerEl = null;
    var loader = null;
    
    // var addVisitorEl = null;
    var employeeSectionEl = null;
    var tagsIdValue = null;

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to load departments
    function loadDepartments() {
        lx.sendJSON({
            url: 'exec.php?c=Department&fn=getList',
            data: {
                searchString: departmentSelect.getSearchString(),
                limit: 10,
                offset: departmentSelect.getItemCount() -1,
                sortOrder: 'ASC'
            },
            onSuccess: function( responseText ) {
                var response = JSON.parse(responseText);
                
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Departments Failed',
                        message: response.error
                    });
                }
                
                // Populate departments select box
                var departments = [];
                for( var i = 0; i < response.departments.length; i++ ) {
                    
                    departments.push({
                        value: response.departments[i].id,
                        text: response.departments[i].name
                    });
                    
                }
                departmentSelect.addItems( departments );
                
            }
        });
    }

    let loadedTags = [];

    // Function to load tags
    function loadTags() {
        lx.sendJSON({
        url: 'exec.php?c=Tags&fn=getList',
        data: {
        searchString: tagsSelect.getSearchString(),
        limit: 10,
        offset: tagsSelect.getItemCount() - 1,
        sortOrder: 'ASC'
        },
        onSuccess: function(responseText) {
        loader.hide();
        let response = JSON.parse(responseText);
        
        if (response.ok !== true) {
        new lx.component.Messagebox({
        title: 'Loading Tags Failed',
        message: response.error
        });
        return;
        }
        
        loadedTags = []; // Clear the previous loaded tags
        loadedTags.push({
        value: null,
        text: 'All Tags'
        }); // Ensure "All Tags" is always the first option
        
        for (var i = 0; i < response.tags.length; i++) {
        loadedTags.push({
        value: response.tags[i].id,
        text: response.tags[i].name
        });
        }
        tagsSelect.addItems(loadedTags);
        
        // After tags are loaded, initialize the selected value
        initializeTagSelection();
        }
        });
        }

    // Function to initialize tag selection from localStorage
    function initializeTagSelection() {
        // Retrieve the selected tag's value and text from local storage
        var savedTag = localStorage.getItem('selectedTag');
        if (savedTag) {
            var savedTagObj = JSON.parse(savedTag);

            if (savedTagObj && savedTagObj.value !== undefined && savedTagObj.text !== undefined) {
                tagsSelect.setValue(savedTagObj.value, savedTagObj.text);
            } else {
                tagsSelect.setValue(null, 'All Tags');
                console.log('Set tag to default: All Tags 1');
            }
        } else {
            tagsSelect.setValue(null, 'All Tags');
            console.log('Set tag to default: All Tags 2');
        }
    }    
    
    // Function to update attendance
    function updateAttendance( id , isEmployee, reasonForVisit, temperature, note, signInDate, signInTime, signOutDate, signOutTime) {
        let person = null;
        let currentPersonIndex = null;
        
        for( let i = 0; i < persons.length; i++ ) {
            if( persons[i].id === id && persons[i].isEmployee === isEmployee) {
                person = persons[i];
                currentPersonIndex = i;
            }
        }
        
        if (isEmployee) {
            if (signInTime === null) {
                // Signt out
                lx.sendJSON({
                    url: 'exec.php?c=Attendance&fn=signOutEmployee',
                    data: {
                        employeeId: id,
                        temperature: temperature,
                        note: note,
                        signOutDate: signOutDate,
                        signOutTime: signOutTime
                    },
                    onSuccess: function( responseText ) {
                        loader.hide();
                        
                        let response = JSON.parse(responseText);
                        
                        if( response.ok !== true ) {
                            new lx.component.Messagebox({
                                title: 'Updating Attendance Failed',
                                message: response.error
                            });
                            return;
                        }
                        
                        let timeIn = '--:--';
                        if (response.timeIn !== null) {
                            timeIn = response.timeIn;
                            person.inOutBtn.setLabel('Sign Out');
                            person.statusEl.style.backgroundColor = '#45A517';
                            person.signedIn = true;
                        }
                        else if (response.timeIn === null) {
                            person.inOutBtn.setLabel('Sign In');
                            person.signedIn = false;
                        }
                        
                        let timeOut = '--:--';
                        if (response.timeOut !== null) {
                            timeOut = response.timeOut;
                            person.inOutBtn.setLabel('Sign In');
                            person.statusEl.style.backgroundColor = '#eb4034';
                            person.signedIn = false;
                        }
                        else if (response.timeOut === null) {
                            person.inOutBtn.setLabel('Sign Out');
                            person.statusEl.style.backgroundColor = '#45A517';
                            person.signedIn = true;
                        }
                        
                        if (response.timeIn === null && response.timeOut === null) {
                            person.inOutBtn.setLabel('Sign In');
                            person.statusEl.style.backgroundColor = '#eb4034';
                            person.signedIn = false;
                        }
                        
                        person.timeInDate = signInDate;
                        person.timeIn = signInTime;
                        person.timeLabelEl.innerHTML = timeIn + ' / ' + timeOut;
                    }
                });
                
            }
            else {
                
                // Signt out
                lx.sendJSON({
                    url: 'exec.php?c=Attendance&fn=signInEmployee',
                    data: {
                        employeeId: id,
                        temperature: temperature,
                        note: note,
                        signInDate: signInDate,
                        signInTime: signInTime,
                        signOutDate: signOutDate,
                        signOutTime: signOutTime
                    },
                    onSuccess: function( responseText ) {
                        loader.hide();
                        
                        let response = JSON.parse(responseText);
                        
                        if( response.ok !== true ) {
                            new lx.component.Messagebox({
                                title: 'Updating Attendance Failed',
                                message: response.error
                            });
                            return;
                        }
                        
                        let timeIn = '--:--';
                        if (response.timeIn !== null) {
                            timeIn = response.timeIn;
                            person.inOutBtn.setLabel('Sign Out');
                            person.statusEl.style.backgroundColor = '#45A517';
                            person.signedIn = true;
                        }
                        else if (response.timeIn === null) {
                            person.inOutBtn.setLabel('Sign In');
                            person.signedIn = false;
                        }
                        
                        let timeOut = '--:--';
                        if (response.timeOut !== null) {
                            timeOut = response.timeOut;
                            person.inOutBtn.setLabel('Sign In');
                            person.statusEl.style.backgroundColor = '#eb4034';
                            person.signedIn = false;
                        }
                        else if (response.timeOut === null) {
                            person.inOutBtn.setLabel('Sign Out');
                            person.statusEl.style.backgroundColor = '#45A517';
                            person.signedIn = true;
                        }
                        
                        if (response.timeIn === null && response.timeOut === null) {
                            person.inOutBtn.setLabel('Sign In');
                            person.statusEl.style.backgroundColor = '#eb4034';
                            person.signedIn = false;
                        }
                        
                        person.timeInDate = signInDate;
                        person.timeIn = signInTime;
                        person.timeLabelEl.innerHTML = timeIn + ' / ' + timeOut;
                    }
                });
            }
            return;
        }
        else {
            lx.sendJSON({
                url: 'exec.php?c=Attendance&fn=updateVisitorAttendance',
                data: {
                    visitorId: id,
                    reasonForVisit: reasonForVisit,
                    temperature: temperature,
                    note: note,
                    signInDate: signInDate,
                    signInTime: signInTime,
                    signOutDate: signOutDate,
                    signOutTime: signOutTime
                },
                onSuccess: function( responseText ) {
                    loader.hide();
                    
                    var response = JSON.parse(responseText);
                    
                    if( response.ok !== true ) {
                        new lx.component.Messagebox({
                            title: 'Visitor Sign Out Failed',
                            message: response.error
                        });
                    }
                    
                    if( person === null ) {
                        lx.sendJSON({
                            url: 'exec.php?c=Attendance&fn=getPerson',
                            data: {
                                id: id,
                                isEmployee: isEmployee
                            },
                            onSuccess: function( responseText ) {
                                loader.hide();
                                
                                var response = JSON.parse(responseText);
                                if( response.ok !== true ) {
                                    new lx.component.Messagebox({
                                        title: 'Loading Attendance Failed',
                                        message: response.error
                                    });
                                }
                                createAttendanceCard( response.person, false );
                            }
                        });
                    }
                    else {
                        let timeIn = '--:--';
                        if (response.timeIn !== null) {
                            timeIn = response.timeIn;
                            person.inOutBtn.setLabel('Sign Out');
                            person.statusEl.style.backgroundColor = '#45A517';
                            person.signedIn = true;
                        }
                        else if (response.timeIn === null) {
                            employeeSectionEl.removeChild(person.el);
                            let removed = [];
                            for (var i = 0; i < persons.length; i++) {
                                if (i === currentPersonIndex) {
                                    continue;
                                }
                                removed.push(persons[i]);
                            }
                            persons = removed;
                        }
                        
                        let timeOut = '--:--';
                        if (response.timeOut !== null) {
                            employeeSectionEl.removeChild(person.el);
                            let removed = [];
                            for (let i = 0; i < persons.length; i++) {
                                if (i === currentPersonIndex) {
                                    continue;
                                }
                                removed.push(persons[i]);
                            }
                            persons = removed;
                        }
                        else if (response.timeOut === null) {
                            person.inOutBtn.setLabel('Sign Out');
                            person.statusEl.style.backgroundColor = '#45A517';
                            person.signedIn = true;
                        }
                        
                        if (response.timeIn === null && response.timeOut === null) {
                            employeeSectionEl.removeChild(person.el);
                            let removed = [];
                            for (let i = 0; i < persons.length; i++) {
                                if (i === currentPersonIndex) {
                                    continue;
                                }
                                removed.push(persons[i]);
                            }
                            persons = removed;
                        }
                        
                        person.timeInDate = signInDate;
                        person.timeIn = signInTime;
                        person.timeLabelEl.innerHTML = timeIn + ' / ' + timeOut;
                        person.nameEl.innerHTML = response.alias;
                    }
                }
            });
        }
    }
    
    // Function to create a employee card.
    function createAttendanceCard( person, isEmployee ) {
        let newEmployee = {};
        
        // Store employee's ID
        newEmployee.id = person.id;
        newEmployee.isEmployee = isEmployee;
        newEmployee.signedIn = false;
        newEmployee.timeIn = person.timeIn;
        newEmployee.timeInDate = person.timeInDate;
        
        // Create employeeEl
        newEmployee.el = lx.createElement('DIV', {
            parent: employeeSectionEl,
            className: 'attendance-grid-item',
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '1px',
                backgroundColor: '#FFFFFF',
                padding: '15px',
                margin: '20px 0px 0px 20px'
            }
        });
        
        // Create nameEl
        newEmployee.nameEl = lx.createElement('DIV', {
            parent: newEmployee.el,
            style: {
                margin: '0px 0px 0px 0px',
                width: '100%',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            },
            innerHTML: person.alias
        });
        
        // Create the status element
        newEmployee.statusEl = lx.createElement('DIV', {
            parent: newEmployee.el,
            style: {
                fontSize: '12px',
                margin: '15px 0px 0px 0px',
                backgroundColor: '#45A517',
                width: '100%',
                height: '1px'
            }
        });
        
        // Create time label
        newEmployee.timeLabelEl = lx.createElement('DIV', {
            parent: newEmployee.el,
            style: {
                margin: '25px 0px 0px 0px',
                fontSize: '12px'
            },
            innerHTML: '--:-- / --:--'
        });
        
        // Create in/out button
        newEmployee.inOutBtn = new lx.component.Button({
            renderTo: newEmployee.el,
            label: 'Sign Out',
            width: '100%',
            margin: 'auto 0px 0px 0px',
            
            onClick: inOutBtnClickEventHandler
        });
        
        let timeIn = '--:--';
        if (person.timeIn !== null) {
            timeIn = person.timeIn;
            newEmployee.inOutBtn.setLabel('Sign Out');
            newEmployee.statusEl.style.backgroundColor = '#45A517';
            newEmployee.signedIn = true;
        }
        else if (person.timeIn === null) {
            newEmployee.inOutBtn.setLabel('Sign In');
            newEmployee.statusEl.style.backgroundColor = '#eb4034';
            newEmployee.signedIn = false;
        }
        
        let timeOut = '--:--';
        if (person.timeOut !== null) {
            timeOut = person.timeOut;
            newEmployee.inOutBtn.setLabel('Sign In');
            newEmployee.statusEl.style.backgroundColor = '#eb4034';
            newEmployee.signedIn = false;
        }
        else if (person.timeOut === null) {
            newEmployee.inOutBtn.setLabel('Sign Out');
            newEmployee.statusEl.style.backgroundColor = '#45A517';
            newEmployee.signedIn = true;
        }
        
        if (person.timeIn === null && person.timeOut === null) {
            newEmployee.inOutBtn.setLabel('Sign In');
            newEmployee.statusEl.style.backgroundColor = '#eb4034';
            newEmployee.signedIn = false;
        }
        
        newEmployee.timeLabelEl.innerHTML = timeIn + ' / ' + timeOut;
        
        persons.push( newEmployee );
    }
    
    // Function to load employees.
    function loadAttendance() {

        const savedTag = localStorage.getItem('selectedTag'); // Retrieve saved tag from localStorage
        // alert('demo ' + savedTag);
        let tagsIdValue;
        if (savedTag !== null && savedTag !== 'null') {
        const savedTagObj = JSON.parse(savedTag);
        tagsIdValue = savedTagObj.value;
        } else {
        tagsIdValue = tagsSelect.getValue();
        }

        lx.sendJSON({
            url: 'exec.php?c=Attendance&fn=getAttendance',
            data: {
                sortOrder: 'ASC',
                searchString: searchTxt.getValue(),
                departmentId: departmentSelect.getValue(),
                tagsId: tagsIdValue
            },
            onSuccess: function( responseText ) {
                loader.hide();
                
                var response = JSON.parse(responseText);
                if( response.ok !== true ) {
                    new lx.component.Messagebox({
                        title: 'Loading Employees Failed',
                        message: response.error
                    });
                }
                
                // Add employee card for each employee
                for( var i = 0; i < response.attendance.employees.length; i++ ) {
                    createAttendanceCard( response.attendance.employees[i], true );
                }
                
                for( let i = 0; i < response.attendance.visitors.length; i++ ) {
                    if (response.attendance.visitors[i].timeOut !== null) {
                        continue;
                    }
                    createAttendanceCard( response.attendance.visitors[i], false );
                }
            }
        });
        
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
            show: false
        };
        
        // Parse user config
        if( typeof config !== 'undefined' && config !== null ) {
            for( var property in config ) {
                if( config.hasOwnProperty(property) ) compConfig[property] = config[property];
            }
        }
        
        // Attach external event handlers
        if( compConfig.hasOwnProperty('onDestroy') ) me.addEventListener('destroy', compConfig.onDestroy);
        
        // Initialize state
        persons = [];
        confirmDestroy = false;
        
        // Create root element
        el = lx.createElement('DIV', {
            parent: compConfig.renderTo,
            style: {
                display: 'none',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: compConfig.width,
                height: compConfig.height,
                flex: compConfig.flex,
                overflow: '',
                backgroundColor: '#F4F5F6'
            }
        });
        
        
        //
        // TITLE SECTION
        //
        
        titleContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                width: '100%',
                height: '50px',
                backgroundColor: '#FFFFFF',
                borderStyle: 'solid',
                borderColor: '#DFDFDF',
                borderWidth: '0px 0px 1px 0px'
            }
        });
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '16px',
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'Attendance'
        });
        
        // Create departmentSelect component
        departmentSelect = new lx.component.Selectbox({
            renderTo: titleContainerEl,
            label: '',
            maxWidth: '250px',
            margin: '0px 0px 0px auto',
            height: '32px',
            
            
            search: true,
            
            onSearch: function() {
                // Clear the departments
                departmentSelect.clear();
                
                // Add the item for all departments
                var departments = [];
                departments.push({
                    value: null,
                    text: 'All Departments'
                });
                departmentSelect.addItems( departments );
                
                // Load the departments
                loadDepartments();
            },
            
            onListScrollEnd: function() {
                // Load the departments
                loadDepartments();
            },
            
            onChange: onSearchResetBtnClickEventHandler
        });
        
        // Select the default department
        var departments = [];
        departments.push({
            value: null,
            text: 'All Departments'
        });
        departmentSelect.addItems( departments );
        loadDepartments();
        departmentSelect.setValue(null, 'All Departments');

        // Create tagsSelect component
        tagsSelect = new lx.component.Selectbox({
            renderTo: titleContainerEl,
            label: '',
            maxWidth: '250px',
            margin: '0px 0px 0px 20px',
            height: '32px',
            
            
            search: true,
            
            onSearch: function() {
                // Clear the tags
                tagsSelect.clear();
                
                // Load the tags
                loadTags();
                // Clear the tags
                // tagsSelect.clear();
                
                // Add the item for all tags
                // var tags = [];
                // tags.push({
                //     value: null,
                //     text: 'All Tags'
                // });
                // tagsSelect.addItems( tags );
                
                // Load the tags
                loadTags();
            },
            
            onListScrollEnd: function() {
                // Load the tags
                loadTags();
            },
            
            onChange: function() {
                // Store the selected tag object in localStorage
                const selectedTag = tagsSelect.getValue();
                const selectedTagObj = loadedTags.find(item => item.value === selectedTag);

                // Save the entire tag object to localStorage
                if (selectedTagObj) {
                    localStorage.setItem('selectedTag', JSON.stringify(selectedTagObj));
                }
                // Call reset handler after change
                onSearchResetBtnClickEventHandler();
                }
        });
        
        // Select the default tags
        var tags = [];
        tags.push({
            value: null,
            text: 'All Tags'
        });
        tagsSelect.addItems( tags );
        loadTags();
        //tagsSelect.setValue(null, 'All Tags');
        
        // Create the member search component
        searchTxt = new lx.component.Searchbox({
            renderTo: titleContainerEl,
            width: '',
            maxWidth: '250px',
            height: '32px',
            flex: '1 1 auto',
            margin: '0px 0px 0px 20px',

            onSearch: onSearchEventHandler,
            onReset: onSearchResetBtnClickEventHandler
        });
        
        addVisitorBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'Sign In Visitor',
            height: '32px',
            width: '120px',
            margin: '0px 0px 0px 20px',
            
            onClick: addVisitorBtnClickEventHandler
        });
        
        historyBtn = new lx.component.Button({
            renderTo: titleContainerEl,
            label: 'History',
            height: '32px',
            width: '120px',
            margin: '0px 20px 0px 20px',
            
            onClick: historyBtnClickEventHandler
        });
        
        
        //
        // CONTENT SECTION
        //
        
        // Create loaderContainerEl
        loaderContainerEl = lx.createElement('DIV', {
            parent: el,
            style: {
                position: 'relative',
                width: '100%',
                height: '0px',
                flex: '1 1 auto'
            }
        });
        
        // Create our loader
        loader = new lx.component.Loader({
            renderTo: loaderContainerEl
        });
        
        // Create the content container
        contentContainerEl = lx.createElement('DIV', {
            parent: loaderContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxSizing: 'border-box',
                width: '100%',
                height: '100%',
                overflow: 'auto'
            }
        });
        
        
        //
        // EMPLOYEE SECTION
        //
        
        // Create the employeeSectionEl element
        employeeSectionEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            className: 'attendance-grid-container',
            style: {
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                boxSizing: 'border-box',
                padding: '0px 20px 20px 0px'
            }
        });
        
        // Load employees
        loader.show();
        loadAttendance();
        
        // If show is set to true show the panel.
        if( compConfig.show === true ) me.show();
    };
    
    // Function to set the renderTo target of the panel.
    //
    // renderTo         The new DOM element to render this component to.
    me.setRenderTarget = function(renderTo) {
        // Remove it from its current target
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        // Add it to the new renderTo element
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
        searchTxt.focus();
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    function addVisitorBtnClickEventHandler () {
        var signInVisitorModal = new lx.component.ModalWindow({
            margin: '40px',
            maxWidth: '450px',
            maxHeight: '528px'
        });
        
        // Create the signInVisitorPanel panel
        var signInVisitorPanel = new app.panel.SignInVisitor({
            renderTo: signInVisitorModal.getContainer(),
            show: true,
            
            onCancel: function() {
                app.route.popState();
            },
            
            onSignIn: function( result ) {
                updateAttendance(result.visitorId, false, result.reasonForVisit, result.temperature, result.note, result.signInDate, result.signInTime, null, null);
                app.route.popState();
            }
        });
        
        // Add destroy event listener to modal to destroy the contained panel.
        signInVisitorModal.addEventListener('destroy', function() {
            signInVisitorPanel.destroy();
        });
        
        // Create a route entry for the panel
        var state = {
            modal: signInVisitorModal
        };
        app.route.pushState(state, function( state ) {
            state.modal.destroy();
        });
        
        // Show the modal window and focus on the panel
        signInVisitorModal.show();
        signInVisitorPanel.focus();
    }
    
    function historyBtnClickEventHandler () {
        me.hide();
        
        var listAttendanceHistoryPanel = new app.panel.ListAttendanceHistory({
            renderTo: app.mainPanel.getContainer(),
            show: true,
            onAdd: function() {
                // employeesGrid.clear();
                searchTxt.setValue('');
                loadAttendance();
                app.route.popState();
            }
        });
        listAttendanceHistoryPanel.focus();
        
        var panelState = {
            previousPanel: me,
            panel: listAttendanceHistoryPanel
        };
        
        app.route.pushState(panelState, function( state ) {
            state.panel.destroy();
            state.previousPanel.show();
        });
    }
    
    // Search component event handlers
    function onSearchEventHandler (){
        employeeSectionEl.innerHTML = '';
        loadAttendance();
    }
    
    function onSearchResetBtnClickEventHandler () {
        employeeSectionEl.innerHTML = '';
        searchTxt.setValue('');
        loadAttendance();
        
    }
    
    // inOutBtn click event handler
    function inOutBtnClickEventHandler( event ) {
        
        // Find the person that was clicked
        let person = null;
        for( let i = 0; i < persons.length; i++ ) {
            if( persons[i].inOutBtn === event.srcComponent ) {
                person = persons[i];
                break;
            }
        }
        
        // Return if we didn't find an person
        if( person === null ) return;
        
        if (!person.isEmployee) {
            
            var signOutVisitorModal = new lx.component.ModalWindow({
                margin: '40px',
                maxWidth: '450px',
                maxHeight: '265px'
            });
            
            // Create the signOutVisitorPanel panel
            var signOutVisitorPanel = new app.panel.SignOutVisitor({
                renderTo: signOutVisitorModal.getContainer(),
                show: true,
                timeIn: person.timeIn,
                timeInDate: person.timeInDate,
                
                onCancel: function() {
                    app.route.popState();
                },
                
                onAdd: function( result ) {
                    updateAttendance(person.id, person.isEmployee,'', '', '', null, null, result.signOutDate, result.signOutTime);
                    app.route.popState();
                }
            });
            
            // Add destroy event listener to modal to destroy the contained panel.
            signOutVisitorModal.addEventListener('destroy', function() {
                signOutVisitorPanel.destroy();
            });
            
            // Create a route entry for the panel
            let state = {
                modal: signOutVisitorModal
            };
            app.route.pushState(state, function( state ) {
                state.modal.destroy();
            });
            
            // Show the modal window and focus on the panel
            signOutVisitorModal.show();
            signOutVisitorPanel.focus();
            
        }
        else {
            // Is the employee signing in?
            if ( !person.signedIn) {
                // Display the attendance reason panel
                let signInEmployeeModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '450px',
                    maxHeight: '479px'
                });
                
                // Create the signInEmployeePanel panel
                let signInEmployeePanel = new app.panel.SignInEmployee({
                    renderTo: signInEmployeeModal.getContainer(),
                    show: true,
                    
                    lastNote: '',
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    
                    onSignIn: function( result ) {
                        updateAttendance(person.id, person.isEmployee, '', result.temperature, result.note, result.signInDate, result.signInTime, null, null);
                        app.route.popState();
                        return;
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                signInEmployeeModal.addEventListener('destroy', function() {
                    signInEmployeePanel.destroy();
                });
                
                // Create a route entry for the panel
                let state = {
                    modal: signInEmployeeModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                // Show the modal window and focus on the panel
                signInEmployeeModal.show();
                signInEmployeePanel.focus();
            }
            else {
                
                let signOutVisitorModal = new lx.component.ModalWindow({
                    margin: '40px',
                    maxWidth: '450px',
                    maxHeight: '265px'
                });
                
                // Create the signOutVisitorPanel panel
                let signOutVisitorPanel = new app.panel.SignOutVisitor({
                    renderTo: signOutVisitorModal.getContainer(),
                    show: true,
                    timeIn: person.timeIn,
                    timeInDate: person.timeInDate,
                    
                    onCancel: function() {
                        app.route.popState();
                    },
                    
                    onAdd: function( result ) {
                        updateAttendance(person.id, person.isEmployee,'', '', '', null, null, result.signOutDate, result.signOutTime);
                        app.route.popState();
                    }
                });
                
                // Add destroy event listener to modal to destroy the contained panel.
                signOutVisitorModal.addEventListener('destroy', function() {
                    signOutVisitorPanel.destroy();
                });
                
                // Create a route entry for the panel
                var state = {
                    modal: signOutVisitorModal
                };
                app.route.pushState(state, function( state ) {
                    state.modal.destroy();
                });
                
                // Show the modal window and focus on the panel
                signOutVisitorModal.show();
                signOutVisitorPanel.focus();
                
            }
        }
        
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};