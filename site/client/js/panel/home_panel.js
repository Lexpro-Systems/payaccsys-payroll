/* globals app, lx */
'use strict';

// HOME PANEL
//
// Config:
//  renderTo:           The parent DOM object of this object.
//  width:              Set the panel width
//  height:             Set the panel height
//  flex:               CSS flex property for the panel
//
// Events:
//
//  onDestroy           This event is fired just before the component is destroyed.
//
//                      function myDestroyHandler(srcComponent)
//
//                      srcComponent    The source component for the event.
//
app.panel.Home = function(config) {
    
    //
    // PRIVATE VARIABLES
    //
    
    var me = this;
    var confirmDestroy = null;
    
    var el = null;
    
    var titleContainerEl = null;
    var titleTextEl = null;
    
    var loaderContainerEl = null;
    var loader = null;
    var contentContainerEl = null;
    
    var logoContainerEl = null;
    var logoEl = null;
    var logoTextEl = null;
    
    var welcomeHeading = null;
    var welcomeContainerEl = null;
    var welcomeLoginBtn = null;
    var welcomeRegisterBtn = null;
    
    var eventsHeading = null;
    var eventsContainerEl = null;
    
    var sponsorContainerEl = null;
    var sponsorTopRowEl = null;
    var sponsorBottomRowEl = null;
    
    var dotCloudContainerEl = null;
    var events = [];

    //
    // OBJECT EXTENSIONS
    //
    
    lx.EventEmitter.call(this);
    
    
    //
    // PRIVATE FUNCTIONS
    //
    
    // Function to create an event card
    //
    // name             The name of the event
    // startDate        The date the event starts on
    // description      The event description
    // entered          Does the user have an event entry for this event
    // onlineEntries    Does this event support online entries
    // entriesOpen      Is entries open for this event
    // return           A div element containing all event details layed out
    function createEventCard(name, startDate, description, entered, onlineEntries, entriesOpen) {
        // Convert start date to a new date object
        var eventDate = new Date( startDate );
        
        // Calculate the card border color
        var borderColor = '#14161C';
		if( entered === true ) borderColor = '#3F7FF1';
        else if( onlineEntries === true ) {
            if(entriesOpen === true ) borderColor = '#00A754';
            else borderColor = '#FFAC28';
        }
        
        // Create the event div
        var cardEl = lx.createElement('DIV', {
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                boxSizing: 'border-box',
                width: '100%',
                padding: '20px',
                backgroundColor: '#1E1E1E',
                margin: '10px 0px 0px 0px',
                borderStyle: 'solid',
                borderWidth: '1px 0px 0px 0px',
                borderColor: borderColor,
                cursor: 'pointer'
            }
        });
        cardEl.addEventListener('click', eventCardClickEventHandler);
        
        // Create the detailsContainerEl
        var detailsContainerEl = lx.createElement('DIV', {
            parent: cardEl,
            style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'left',
                flex: '1 1 100%'
            }
        });
        
        // Create title container div
        var titleContainerEl = lx.createElement('DIV', {
            parent: detailsContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                height: '20px',
                width: '100%'
            }
        });
        
        // Event Title div
        var titleEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                textOverflow: 'ellipsis',
                width: '0px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                flex: '1 1 100%',
                fontSize: '14px'
            },
            innerHTML: name
        });
        
        // Event date div
        var dateEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                flex: '0 0 auto',
                fontSize: '12px',
                padding: '0px 0px 0px 5px',
            },
            innerHTML: lx.util.toShortDate( eventDate )
        });
        
        // Create the event description div only if there is a description
        if( description !== '' && description !== null ) {
            var descriptionEl = lx.createElement('DIV', {
                parent: detailsContainerEl,
                style: {
                    color: '#A8ADB9',
                    fontSize: '12px',
                    textAlign: 'justify',
                    width: '100%',
                    minWidth: '0px',
                    margin: '10px 0px 0px 0px',
                    maxHeight: '50px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    textOverflow: 'ellipsis',
                    flex: '1 1 auto',
                    lineClamp: 3
                },
                innerHTML: description.substr(0, 512)
            });
            
            descriptionEl.style['-webkit-box-orient'] = 'vertical';
        }
        
        // Create event arrow button
        var arrowEl = lx.createElement('DIV', {
            parent: cardEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                flex: '0 0 auto',
                alignItems: 'center',
                justifyContent: 'flex-end',
                width: '40px'
            }
        });
        arrowEl.appendChild(lx.icon.create('right_chevron', '#A8ADB9', '25', '1'));
        
        return cardEl;
    }
    
    // Function to load events
    function loadEvents() {
        
        lx.sendJSON({
            url: 'exec.php?c=Event&fn=getUpcoming',
            onSuccess: function( responseText ) {
                loader.hide();
                
                var response = JSON.parse( responseText );
                
                if( !response.ok ) {
                    new lx.component.Messagebox({
                        title: 'Unable to load upcoming events',
                        message: response.error,
                        icon: 'icon_error'
                    });
                    return;
                }
                
                
                var curEvent = null;
                
                // Were no events found?
                if (response.events.length < 1) {
                    
                    // Create the noEventEl text element
                    var noEventEl = lx.createElement('DIV', {
                        parent: eventsContainerEl,
                        style: {
                            margin: '20px 0px 0px 0px',
                            textAlign: 'center',
                            color: '#FFFFFF',
                            fontSize: '14px'
                        },
                        innerHTML: 'NO EVENTS AVAILABLE'
                    });
                    
                }
                
                // List the events
                eventsContainerEl.innerHTML = '';
                for( var i = 0; i < response.events.length; i++ ) {
                    curEvent = response.events[i];
                    
                    var cardEl = createEventCard(curEvent.name, curEvent.startDate, curEvent.details, 
                        curEvent.entered, curEvent.onlineEntries, curEvent.entriesOpen);
                    eventsContainerEl.appendChild( cardEl );
                    
                    events.push({
                        id: curEvent.id,
                        el: cardEl
                    });
                }
                
            }
            
        });
    }
    
    function checkLogin() {
        // Hide login buttons if already logged in
        lx.sendJSON({
            url: 'exec.php?c=User&fn=isLoggedIn',
            onSuccess: function( responseText ) {
                
                var response = JSON.parse( responseText );
                
                if( !response.ok ) {
                    new lx.component.Messagebox({
                        message: response.error,
                        icon: 'icon_error'
                    });
                    
                    return;
                }
                
                if (response.loggedIn) {
                    welcomeHeading.hide();
                    lx.applyStyle(welcomeContainerEl, {display: 'none'});
                }
                else{
                    welcomeHeading.show();
                    lx.applyStyle(welcomeContainerEl, {display: 'flex'});
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
            flex: '1 1 100%'
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
        confirmDestroy = false;
        
        // Set up app event handlers
        lx.addEventListener('login', appLoginEventHandler);
        
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
                backgroundColor: '#151515'
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
                alignItems: 'center',
                width: '100%',
                height: '40px',
                backgroundColor: '#000000',
                flex: '0 0 auto'
            }
        });
        
        // Create the title text element
        titleTextEl = lx.createElement('DIV', {
            parent: titleContainerEl,
            style: {
                fontSize: '12px',
                margin: '0px 0px 0px 20px',
                userSelect: 'none'
            },
            innerHTML: 'HOME'
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
                height: '0px',              // This is required for Safari to work.
                flex: '1 1 auto',
                overflow: 'hidden'
            }
        });
        
        // Create our loader
        loader = new lx.component.Loader({
            renderTo: loaderContainerEl
        });
        loader.show();
        
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
                flex: '1 1 auto',
                overflow: 'auto',
                padding: '0px 0px 30px 0px'
            }
        });
        
        
        //
        // LOGO SECTION
        //
        
        // Create the logo container element
        logoContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '768px',
                height: '230px',
                backgroundImage: 'url(gfx/home_banner_background.jpg)',
                backgroundSize: '768px auto',
                padding: '20px',
                flex: '0 0 auto'
            }
        });
        
        // Create the logo element
        logoEl = lx.createElement('DIV', {
            parent: logoContainerEl,
            style: {
                width: '100px',
                height: '100px',
                backgroundImage: 'url(gfx/csa_logo_200.jpg)',
                backgroundSize: '100% 100%'
            }
        });
        
        // Create the logo text element
        logoTextEl = lx.createElement('DIV', {
            parent: logoContainerEl,
            style: {
                width: '100%',
                maxWidth: '300px',
                overflow: 'hidden',
                margin: '15px 0px 0px 0px'
            },
            innerHTML:
                '<span style="font-size: 14px;">THE OFFICIAL</span></br><b>CYCLING SOUTH AFRICA</b></br>' +
                '<span style="font-size: 12px;">MEMBERSHIP, EVENTS CALENDAR AND ENTRY SYSTEM</span>'
        });
            
            
        //
        // WELCOME SECTION
        //
        
        // Create the welcome heading
        welcomeHeading = new lx.component.Heading({
            renderTo: contentContainerEl,
            width: '100%',
            maxWidth: '768px',
            label: 'YOU ARE NOT LOGGED IN'
        });
        welcomeHeading.hide();
        
        // Create the welcome container element
        welcomeContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                display: 'none',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '768px',
                padding: '20px 20px'
            }
        });
        
        // Create the welcomeLoginBtn
        welcomeLoginBtn = new lx.component.Button({
            renderTo: welcomeContainerEl,
            label: 'LOGIN',
            width: '120px',
            
            onClick: welcomeLoginBtnClickEventHandler
        });
        
        // Create the welcomeLoginBtn
        welcomeRegisterBtn = new lx.component.Button({
            renderTo: welcomeContainerEl,
            label: 'REGISTER',
            width: '120px',
            onClick: welcomeRegisterBtnClickEventHandler
        });
        
        
        //
        //  UPCOMING EVENTS SECTION
        //
        
        // Create eventHeading
        eventsHeading = new lx.component.Heading({
            renderTo: contentContainerEl,
            width: '100%',
            maxWidth: '768px',
            label: 'UPCOMING EVENTS'
        });
        
        eventsContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '768px'
            }
        });
        
        // var testEvent = createEventCard('NISSAN TRAILSEEKER #3 HEMEL EN AARDE', '2019-07-06',
        //     '58km Mountain Bike race (or ride) through the hills of Grahamstown to Port Alfred. Fast, fun, with a mix of track and dirt road, ' +
        //     'a few climbs but mostly downhill. It\'s a race or a ride, the choice is yours. Great day out for the family. ' +
        //     'Finish is at Rosehill Mall with great views and a brilliant vibe.', false, true, false);
        // eventsContainerEl.appendChild( testEvent );
        
        // testEvent = createEventCard('GAUTENG XCO CHAMPIONSHIP - HOSTED BY XCOSA', '2019-07-06',
        //     'Enter on the Day Racing :14H00- 17h00 Registration :13H00-13H45 R60 PP- Elites and older R30 PP- Youths and Juniors Races are CSA ' +
        //     'sanctioned and CSA Membership is thus required. Entry at the gate- R10 per Adult and R5 Per Youth -Payable to Rajab our Groundsman. ' +
        //     'Racing Cats: A Cat_ Selected experienced riders B Cat_ Intermediate riders, Slower Experienced riders C Cat_ Younger and New riders ' +
        //     'Cyclists are required to complete a Track intro and skills course before they can race the league or any of our regional or national ' +
        //     'races on a track bike. The clinic is very beneficial for safety reasons, and to build confidence on the track and Road. Contact us at ' +
        //     'https://hectornorristrackcycling.co.za/contact/ for more information. There are some rental bikes available at HNP that can be used in ' +
        //     'Coached sessions and official race days. Sizes 52-58. If you would like to be added to the CGC-Track Cycling mailing list, please just ' +
        //     'follow this link to upload your information.: http://eepurl.com/dFx4ZD .All newsletters will have a link to unsubscribe should you wish ' +
        //     'to do so at a later stage. ', false, true, true);
        // eventsContainerEl.appendChild( testEvent );
        
        
        //
        // SPONSOR SECTION
        //
        
        // Create sponsorContainerEl element
        sponsorContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '768px',
                margin: '30px 0px 0px 0px',
                backgroundColor: '#FFFFFF',
                padding: '20px 10px'
            }
        });
        
        // Create the sponsorTopRowEl element
        sponsorTopRowEl = lx.createElement('DIV', {
            parent: sponsorContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around'
            }
        });
        
        // Create the national lotteries commission logo
        lx.createElement('DIV', {
            parent: sponsorTopRowEl,
            style: {
                flex: '1 1 100%',
                maxWidth: '100px'
            },
            innerHTML: '<img style="width: 100%;" src="gfx/nlc_logo.jpg" />'
        });
        
        // Create the sports and recreation south africa logo
        lx.createElement('DIV', {
            parent: sponsorTopRowEl,
            style: {
                flex: '1 1 100%',
                maxWidth: '120px'
            },
            innerHTML: '<img style="width: 100%;" src="gfx/srsa_logo_200.jpg" />'
        });
        
        // Create the UCI logo
        lx.createElement('DIV', {
            parent: sponsorTopRowEl,
            style: {
                flex: '1 1 100%',
                maxWidth: '100px'
            },
            innerHTML: '<img style="width: 100%;" src="gfx/uci_logo_300.jpg" />'
        });
        
        // Create the sponsorBottomRowEl element
        sponsorBottomRowEl = lx.createElement('DIV', {
            parent: sponsorContainerEl,
            style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                margin: '20px 0px 0px 0px'
            }
        });
        
        // Create the SASCOC logo
        lx.createElement('DIV', {
            parent: sponsorBottomRowEl,
            style: {
                flex: '1 1 100%',
                maxWidth: '100px'
            },
            innerHTML: '<img style="width: 100%;" src="gfx/sascoc_logo_200.jpg" />'
        });
        
        // Create the SAIDS logo
        lx.createElement('DIV', {
            parent: sponsorBottomRowEl,
            style: {
                flex: '1 1 100%',
                maxWidth: '120px'
            },
            innerHTML: '<img style="width: 100%;" src="gfx/saids_logo_200.jpg" />'
        });
        
        // Create the UCI logo
        lx.createElement('DIV', {
            parent: sponsorBottomRowEl,
            style: {
                flex: '1 1 100%',
                maxWidth: '100px'
            },
            innerHTML: '<img style="width: 100%;" src="gfx/csa_logo_200.jpg" />'
        });
        
        
        //
        // POWERED BY DOTCLOUD SECTION
        //
        
        dotCloudContainerEl = lx.createElement('DIV', {
            parent: contentContainerEl,
            style: {
                width: '100%',
                maxWidth: '200px',
                height: '40px',
                margin: '30px 0px 0px 0px',
                flex: '0 0 auto',
                backgroundImage: 'url(gfx/powered_by_dotcloud_white.svg)',
                backgroundSize: '100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center center'
            }
        });
        
        checkLogin();
        loadEvents();
        loader.hide();
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
    };
    
    // Function to destroy the panel and all its contents.
    //
    // NOTE: Must return true if the panel was destroyed successfully and false if the panel was not destroyed.
    me.destroy = function() {
        // If there is a onDestroy event run that before destroying the panel
        me.fireEvent('destroy', null);
        
        // Remove app event handlers
        lx.removeEventListener('login', appLoginEventHandler);
        
        // Remove the panel from its parent
        if( el.parentElement !== null ) el.parentElement.removeChild( el );
        
        return true;
    };
    
    
    //
    // EVENT HANDLERS
    //
    
    function eventCardClickEventHandler(event ) {
        
        // Find the cards top element
        var cardEl = event.target;
        while( cardEl.parentElement !== eventsContainerEl && cardEl !== null ) {
            cardEl = cardEl.parentElement;
        }
        
        var eventId = null;
        for( var i = 0; i < events.length; i++ ) {
            if( events[i].el === cardEl ) {
                eventId = events[i].id;
                break;
            }
        }
        
        var viewEventPanel = null;
        
        // Create a new container in the main panel
        var containerIndex = app.mainPanel.addContainer({
            onAfterShow: function() {
                viewEventPanel.focus();
            },
            onRemove: function() {
                viewEventPanel.destroy();
            }
        });
        
        // Create the new panel
        viewEventPanel = new app.panel.ViewEvent({
            renderTo: app.mainPanel.getContainer( containerIndex ),
            eventId: eventId
        });
        viewEventPanel.show();
        
        // Move to the new panel
        app.mainPanel.nextContainer();
        
    }
    
    // registerBtn click event handler
    function welcomeRegisterBtnClickEventHandler() {
        var registerPanel = null;
        
        // Create a new container in the main panel
        var containerIndex = app.mainPanel.addContainer({
            onAfterShow: function() {
                registerPanel.focus();
            },
            onRemove: function() {
                registerPanel.destroy();
            }
        });
        
        // Create the new panel
        registerPanel = new app.panel.Register({
            renderTo: app.mainPanel.getContainer( containerIndex )
        });
        registerPanel.show();
        
        // Move to the new panel
        app.mainPanel.nextContainer();
    }
    
    // loginBtn click event handler
    function welcomeLoginBtnClickEventHandler() {
        var loginPanel = null;
        
        // Create a new container in the main panel
        var itemIndex = app.mainPanel.addContainer({
            onAfterShow: function() {
                loginPanel.focus();
            },
            onRemove: function() {
                loginPanel.destroy();
            }
        });
        
        // Create the new panel
        loginPanel = new app.panel.Login({
            renderTo: app.mainPanel.getContainer( itemIndex ),
            onLogin: function() {
                loadEvents();
            }
        });
        loginPanel.show();
        
        // Move to the new panel
        app.mainPanel.nextContainer();
    }
    
    // app login event handler
    function appLoginEventHandler() {
        welcomeHeading.hide();
        lx.applyStyle(welcomeContainerEl, {display: 'none'});
    }
    
    
    //
    // INITIALIZE OBJECT
    //
    
    me.init( config );
};