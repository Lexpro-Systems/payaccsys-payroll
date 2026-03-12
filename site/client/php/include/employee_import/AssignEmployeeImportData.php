<?php
System::denyDirectAccess();
System::includeFile('employee_import/EmployeeImportData.php');
// This class is responsible for loading data line by line from csv file into a Data class file 
class AssignEmployeeImportData {

    /**
     * Function to load csv data to the function class 
     * @param {EmployeeImportData} $employImportData
     * @param {array} $data the data is comma seperated 
     */
    public static function  load(EmployeeImportData &$employeeImportData, array $data) : void {
        $reflectClass = new ReflectionClass($employeeImportData);
        $props = $reflectClass->getProperties(ReflectionProperty::IS_PUBLIC | ReflectionProperty::IS_PRIVATE);
        $col = 0;
        foreach ($props as $prop) {
            $reflectionProperty = $reflectClass->getProperty($prop->name);
            $value = $data[$col];
            // trim if values set
            if (isset($value) && $data !== NULL) {
                $value = trim($data[$col]);
            }
            else {
                $value  = "";
            }
            $reflectionProperty->setValue($employeeImportData, $value);
            $col++;
        }
    }

}