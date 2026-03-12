// Required Validator
app.validators.required = function(value) {
    if( value === null || value === '' ) return 'This field is required.';
    
    return true;
};

// Non Empty Validator
app.validators.NonEmpty = function(value) {
    if( value === null || value === '' ) return 'This field can not be empty.';
    
    return true;
};