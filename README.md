# Project #4. Private Blockchain Notary Service

This is Project 4, Private Blockchain Notary Service. This project uses blockchain to record a star ownership.
 
## Technology used.

- [NodeJS](https://nodejs.org/en/)
- [Level DB](https://github.com/Level/level)
- [Express](https://expressjs.com/)
- [Bitcoin Lib](https://github.com/bitcoinjs/bitcoinjs-lib)
- [Bitcoin Message](https://github.com/bitcoinjs/bitcoinjs-message)

## Setup project for Review.

To setup the project for review do the following:
1. Download the project.
2. Run command __npm install__ to install the project dependencies.
3. Run command __npm start__ in the root directory.

## Testing the project

You may use [Postman](https://www.getpostman.com/) or curl to test the project

## Request and response examples

### API Resources
The following API request and response is in JSON format

### GET `/block/[id]` 

Get block in the blockchain using block id

##### Response

- 200 OK:
	```
	{
	  "height": 5,
    "time": "1551192447",
    "body": {
      "address": "19CVyP5KBjJgqZsfvEiB3MTdCSwsmxUepE",
      "star": {
        "dec": "68° 52' 56.9",
        "ra": "16h 29m 1.0s",
        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "Found star using https://www.google.com/sky/"
      }
    },
    "previousBlockHash": "0a0d533cd762440a9789440a93184d1def4358852b81afc2c0e97ad1e4d4bdf9",
    "hash": "d7c99e2861ffa0d58077c35b1386573a4b4e0432e5997a6f1db71d585f3c9d78"
	}
	```
- 404 Not Found: Block is not found
- 400 Bad Request

### GET `/stars/hash:[hash]` or `/stars/address:[address]`

Get block in the blockchain using *block hash* or *wallet address*

##### Response

- 200 OK:
	```
	{
	  "height": 5,
    "time": "1551192447",
    "body": {
      "address": "19CVyP5KBjJgqZsfvEiB3MTdCSwsmxUepE",
      "star": {
        "dec": "68° 52' 56.9",
        "ra": "16h 29m 1.0s",
        "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
        "storyDecoded": "Found star using https://www.google.com/sky/"
      }
    },
    "previousBlockHash": "0a0d533cd762440a9789440a93184d1def4358852b81afc2c0e97ad1e4d4bdf9",
    "hash": "d7c99e2861ffa0d58077c35b1386573a4b4e0432e5997a6f1db71d585f3c9d78"
	}
	```
- 404 Not Found: Block is not found
- 400 Bad Request


#### POST `/block`

Post new block into the blockchain

##### Request
```
{
  "address": "19CVyP5KBjJgqZsfvEiB3MTdCSwsmxUepE",
  "star": {
    "dec": "68° 52' 56.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/"
  }
}
```

##### Response
- 201 Created:
	```
	{
	  "height": 1,
	  "timeStamp": "1551025926",
	  "data": "Test Block - 1",
	  "previousHash": "8e55a2effb0335136766f4dff43dc1c2b56aeb7fd58f7d65e3e94547389659e0",
	  "hash": "05bf1ad9b465bd0c79ff62e5f7d2fc209896e76fbbd24b4b9f9153ec5bba4956"
	}
	```
- 403 Forbidden: Request is not verified
- 500 Internal Server Error
- 400 Bad Request

#### POST `/requestValidation`

Post new request for validation

##### Request
```
{
  "address": "19CVyP5KBjJgqZsfvEiB3MTdCSwsmxUepE",
}
```

##### Response
- 200 Created:
	```
	{
    "walletAddress": "19CVyP5KBjJgqZsfvEiB3MTdCSwsmxUepE",
    "requestTimeStamp": "1551194367",
    "message": "19CVyP5KBjJgqZsfvEiB3MTdCSwsmxUepE:1551194367:starRegistry",
    "validationWindow": 300
  }
	```
- 500 Internal Server Error
- 400 Bad Request

#### POST `/message-signature/validate`

Validate request by wallet address

##### Request
```
{
  "address": "19CVyP5KBjJgqZsfvEiB3MTdCSwsmxUepE",
  "signature": "H336pYzpLh+nxFgqjnCg2dyZsxMjHK2ELTV/bY04Qgwnbz1f3DHewY1dMB3swTqsoxLX6/pEx3dtdut78p5j7Fw="
}
```

##### Response
- 200 Created:
	```
  {
    "registerStar": true,
    "status": {
      "address": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
      "requestTimeStamp": "1544454641",
      "message": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL:154445464:starRegistry",
      "validationWindow": 193,
      "messageSignature": true
    }
  }
	```
- 404 Not Found: "Invalid Signature".
- 400 Bad Request

