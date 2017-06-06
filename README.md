# resiway
Social platform for sharing practical information about Self-Sufficiency, Transition and Permaculture
It aims to be as resilient as possible.

This project includes 
* ResiExchange : a Q&A application 
* ResiLib : a document sharing application 


### Configuration

#### PHP.ini
Following constants must be defined to a custom value, matching application requirements
check post_max_size 
upload_max_filesize

#### PHP modules
json
xml
gd
gmp
mbstring
mysql



### API usage 


#### Methods 
At the moment, only GET method is supported.


#### URLS
* documents : https://www.resiway.org/api/documents
* questions : https://www.resiway.org/api/questions


#### Parameters
* `api` : API version (by default '1.0', qui correspond au format JSON API 1.0)
* `limit`: number of objects to return in one query (min.5, max. 100)
* `start`: position of the first object to return


#### Return values
Document JSON API (RFC7159) : http://jsonapi.org/format/  

Content-Type: application/vnd.api+json  

Data structure :  

    {
        "jsonapi": {
            "version": "1.0"
        },
        "meta": {
            "total-pages": 1
        },
        "data": [ {
            "type": "document",
            "id": "1",
            "attributes": {

            },
            "relationships": {

            }
        } ]
    }