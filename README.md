# Get BackpackTF Listings
### <p align="center">[![Build Status](https://github.com/Preport/getBackpackTFListings/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/Preport/getBackpackTFListings/actions/workflows/main.yml)</p>
## Usage Example
```typescript
import getBackpackTFListings from 'getbackpacktflistings' // TypeScript
const getBackpackTFListings = require('getbackpacktflistings') // CommonJS

const gl = new getListings();

async function t() {
    const response = await gl.getListings('https://backpack.tf/classifieds?item=Bill%27s%20Hat&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0')
    console.log(JSON.stringify(rp, null, "\t"));
}

//Proxy Examples
const prox1 = {
    "host":"127.0.0.1",
    "port":8080,
    "auth":{
        "username":"user",
        "password":"pass"
    }
}
const prox2 = "http://user:pass@127.0.0.1:8080"
```
## Namespace
```typescript
    interface Proxy {
        "host": string,
        "port": number,
        "auth": {
            "username": string,
            "password": string
        }
    }
    interface Listing {
        id: string,         // Listing's unique id.
        sku: string,        // tf2-sku-2 in string.
        created: string,    // epoch time of the when the listing was created in ms.
        bumped: string,     // epoch time of the when the listing was bumped in ms. // will be same as created if it was never bumped.
        count: number,      // amount of the items lister is selling.
        automatic: boolean, // true if the lister is automatic.
        isOnline: boolean,   // true if the lister is online.
        details: string,    // Comment below the listing.
        tradeUrl: string,   // If listing has tradeURL, this is an URL to send a trade offer otherwise null.
        addFriend: string,  // If listing does not have tradeURL, this is an URL to add the person otherwise null.
        steamid64: string,  // Lister's steamID.
        price: {
            keys: number,
            metal: number
        },
        spells: string[],   // Spells of the listed item.
        parts: string[],    // Strange Parts of the listed item.
        sheen: string,      // Sheen of the item if it's kt-2 or kt-3
        killstreaker: string// Killstreaker of the item if it's kt-3
    }
    type Response = {
        [intent in 'buy' | 'sell']: Listing[]
    }
```
## Constructor
### getBackpackTFListings(proxies)
- `proxies` - Optional. `Proxy[]` or `string[]` to rotate between proxies to avoid getting `429: Too many requests.`
## Method
### getListings(url[, pageAmount])
- `url` - Required. `BackpackTF classified url` of the item you want to get the listings of.
- `pageAmount` - Optional. How many pages you want to load should be a type of `number`.
- **Returns** `Promise<Response>`
