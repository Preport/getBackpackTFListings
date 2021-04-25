# Get BackpackTF Listings
### <p align="center">[![Build Status](https://travis-ci.com/Preport/getBackpackTFListings.svg?branch=main)](https://travis-ci.com/Preport/getBackpackTFListings)</p>
## Usage Example
```typescript
import getBackpackTFListings from 'getbackpacktflistings' // TypeScript
const getBackpackTFListings = require('getbackpacktflistings') // CommonJS

const gl = new getListings();

async function t() {
    const response = await gl.getListings('https://backpack.tf/classifieds?item=Bill%27s%20Hat&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0')
    console.log(JSON.stringify(rp, null, "\t"));
}
```
## Types
```typescript
type TypeProxy = {
    "host": string,
    "port": number,
    "auth": {
        "username": string,
        "password": string
    }
}
type TypeListings = {
    [key in 'sell' | 'buy']: {
        sku: string,
        automatic: boolean,
        details: string,
        tradeUrl: string,
        steamid64: string,
        price: {
            keys: number,
            metal: number
        },
        spells: string[],
        parts: string[]
    }[]
}
```
## Constructor
### getBackpackTFListings(proxies)
- `proxies` - Optional. `Array of TypeProxy` to rotate between proxies to avoid getting `429: Too many requests.`
## Method
### getListings(url, pageAmount)
- `url` - Required. `BackpackTF classified url` of the item you want to get the listings of.
- `pageAmount` - Optional. How many pages you want to load should be a type of `number`.
- **Returns** `Promise<TypeListings>`