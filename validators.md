## Data validation

### Structure for the configuration document

Place this subdocument into the proper configuration document:
~~~
"Validators" : [ 
        {
            "name" : "Card Currency",
            "type" : "enumerate",
            "constraints" : {
                "values" : [ 
                    "USD", 
                    "EUR", 
                    "GBP", 
                    "CAD", 
                    "AUD", 
                    "JPY", 
                    "SEK", 
                    "AED", 
                    "NZD"
                ],
                "multiple" : true
            }
        }, 
        {
            "name" : "Card Network",
            "type" : "enumerate",
            "constraints" : {
                "values" : [ 
                    "Visa", 
                    "Master Card"
                ]
            }
        }, 
        {
            "name" : "Additional fees charged by bank (percent) for conversion",
            "type" : "numeric",
            "constraints" : {
                "positive" : true
            }
        }, 
        {
            "name" : "Enter interest rate",
            "type" : "numeric"
        }, 
        {
            "name" : "Enter the APR (annual percentage rate)",
            "type" : "numeric",
            "constraints" : {
                "positive" : true
            }
        }, 
        {
            "name" : "FX Fee charged by bank (percent)",
            "type" : "numeric",
            "constraints" : {
                "gte" : 0,
                "lte" : 100
            }
        }, 
        {
            "name" : "The annual fee applies to the first year only and may be eliminated by making 10 transactions within the first 3 months of using the card.",
            "type" : "text",
            "constraints" : {
                "maxLength" : 256
            }
        }, 
        {
            "name" : "T&C link where the info was found",
            "type" : "text",
            "constraints" : {
                "maxLength" : 256,
                "pattern" : "https://.*"
            }
        }, 
        {
            "name" : "CollectedDate",
            "type" : "date",
            "constraints" : {
                "gte" : ISODate("2019-01-01T21:21:20.201Z"),
                "lte" : ISODate("2020-01-01T21:21:20.202Z")
            }
        }
    ]
~~~

### Allowed data types

- numeric
- text
- date
- email
- url
- enumerate

### Allowed constraints

- positive (positive number if true, negative otherwise)
- gte (greater-than-or-equal)
- lte (less-than-or-equal)
- maxLength
- notEmpty
- pattern (place regexp here)

### Enumerate 

Place following subdocument into constraints section for 'type': 'enumerate':

~~~
"values" : [ "Visa", "Master Card"],
"multiple" : true
~~~

If 'multiple': true you can list allowed values separated by comma.

For country codes and currency codes, instead of values array you can use constants:
COUNTRY_CODES and CURRENCY_CODES, like this:
~~~
"values" : CURRENCY_CODES,
"multiple" : true
~~~   
