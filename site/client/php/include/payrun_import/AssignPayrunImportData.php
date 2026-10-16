<?php
System::denyDirectAccess();
System::includeFile('payrun_import/PayrunImportData.php');

// This class is responsible for loading data line by line from a csv file into a Data class.
// It is generic (reflection based) and works for any *ImportData class whose public/private
// properties are declared in the same order as the csv columns.
class AssignPayrunImportData
{
    /**
     * Function to load csv data into the data class
     * @param {PayrunImportData} $payrunImportData
     * @param {array} $data one csv row, comma separated
     */
    public static function load(PayrunImportData &$payrunImportData, array $data): void
    {
        $reflectClass = new ReflectionClass($payrunImportData);
        $props = $reflectClass->getProperties(ReflectionProperty::IS_PUBLIC | ReflectionProperty::IS_PRIVATE);
        $col = 0;
        foreach ($props as $prop) {
            $reflectionProperty = $reflectClass->getProperty($prop->name);

            $rawValue = $data[$col] ?? null;
            $value = (isset($rawValue) && $rawValue !== null) ? trim($rawValue) : "";

            // Typed numeric properties (float/int) can't accept an empty string ("")
            // without PHP throwing a TypeError. Treat a blank cell as 0 for those.
            $propertyType = $prop->getType();
            if ($value === "" && $propertyType !== null && !$propertyType->allowsNull()) {
                $typeName = $propertyType->getName();
                if ($typeName === 'float' || $typeName === 'int') {
                    $value = 0;
                }
            }

            $reflectionProperty->setValue($payrunImportData, $value);
            $col++;
        }
    }
}
