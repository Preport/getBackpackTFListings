import { JSDOM } from 'jsdom'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import sku from 'tf2-sku-2'
import cuint from 'cuint'
export type TypeProxy = {
    "host": string,
    "port": number,
    "auth": {
        "username": string,
        "password": string
    }
}
export default class getListings {
    proxies: TypeProxy[]
    proxNum: number = 0
    /**
     * @param proxies Array of proxies if you are thinking of using `getListings` function alot. Don't overuse and fuck backpack.tf's servers though
     */
    constructor(proxies?: TypeProxy[]) {
        this.proxies = proxies ?? [];
    }
    /**
     * @param url the url to get
     * ex: https://backpack.tf/classifieds?item=Flipped%20Trilby&quality=5&tradable=1&craftable=1&australium=-1&particle=13&killstreak_tier=0
     * do not include &page parameter in the url
     * @param pageAmount Amount of pages to load
     */
    async getListings(url: string, pageAmount?: number) {
        pageAmount = Math.max(1, pageAmount ?? 1);
        const listingstoReturn: {
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
        } = {
            buy: [],
            sell: []
        }
        for (let page = 1; page < pageAmount + 1; page++) {
            const res = await (this.__geturl(url + "&page=" + page, 0))
            if (!res) break;
            const dom = new JSDOM(res.data);
            Array.from(dom.window.document.getElementsByClassName('listing')).forEach(listing => {

                const item = listing.children[0].children[0] as HTMLDivElement
                const body = listing.children[1] as HTMLDivElement;
                const skuObject: sku.skuType = {
                    defindex: parseInt(item.attributes['data-defindex'].nodeValue),
                    quality: parseInt(item.attributes['data-quality'].nodeValue),
                    australium: item.attributes['data-australium']?.nodeValue == "1",
                    craftable: item.attributes['data-craftable']?.nodeValue == "1",
                    crateseries: parseInt(item.attributes['data-crate']?.nodeValue) || null,
                    effect: parseInt(item.attributes['data-effect_id']?.nodeValue) || null,
                    festive: item.attributes['data-festivized']?.nodeValue == "1",
                    killstreak: parseInt(item.attributes['data-ks_tier']?.nodeValue) || null,
                    paint: parseInt(item.attributes['data-paint_hex']?.nodeValue, 16) || null,
                    quality2: parseInt(item.attributes['data-quality_elevated']?.nodeValue) || null,
                    //Not taken in to account
                    wear: null,
                    craftnumber: null,
                    output: null,
                    outputQuality: null,
                    paintkit: null,
                    target: null
                }
                const spells: string[] = ["1", "2", "3"].map(sp => item.attributes['data-spell_' + sp]?.nodeValue).filter(sp => sp);
                const parts: string[] = ["1", "2", "3"].map(sp => item.attributes['data-part_name_' + sp]?.nodeValue).filter(sp => sp);
                const priceStrings = (item.attributes['data-listing_price']?.nodeValue as string).split(' ');
                const isK = priceStrings[1].startsWith('key');
                const intent = body.children[0].children[0].children[0].className.endsWith('sell') ? "sell" : "buy";
                const button = body.children[0].children[1].children[0] as HTMLAnchorElement;
                listingstoReturn[intent].push({
                    automatic: ((button.attributes["data-original-title"]?.nodeValue || button.title) as string)?.includes('user agent') ?? false,
                    details: body?.children[2]?.children[1]?.innerHTML,
                    price: {
                        keys: isK ? parseInt(priceStrings[0]) : 0,
                        metal: isK && priceStrings[2] ? parseFloat(priceStrings[2]) : (!isK ? parseFloat(priceStrings[0]) : 0)
                    },
                    sku: sku.fromObject(skuObject),
                    spells,
                    parts,
                    steamid64: cuint.UINT64(parseInt(item.attributes['data-listing_account_id']?.nodeValue), 17825793).toString(),
                    tradeUrl: button.href
                })
            })
        }
        return listingstoReturn
    }
    __geturl(
        url: string,
        errCount: number,
        settings?: AxiosRequestConfig
    ) {
        settings = settings ?? {
            headers: {
                'Cookie': "user-id=95tdk9cwo8awchce4zdw",
                'User-Agent':
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0",
            },
            proxy: this.__getRoundRobinProxy()
        }
        return new Promise<AxiosResponse<any>>(async (resolve) => {
            try {
                const res = await axios.get(url, settings);
                resolve(res);
            } catch (err) {
                if (errCount > 4) resolve(null);
                else {
                    resolve(await this.__geturl(url, ++errCount, settings));
                }
            }
        });
    }
    __getRoundRobinProxy() {
        if (this.proxNum == this.proxies.length) this.proxNum = 0;
        return this.proxies[this.proxNum++];
    }
}