import cheerio from 'cheerio'
import got from 'got'
import { HttpsProxyAgent } from 'hpagent'
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
function proxyToStr(proxy: TypeProxy) {
    return 'http://' + proxy.auth.username + ':' + proxy.auth.password + '@' + proxy.host + ":" + proxy.port;
}
export default class getListings {
    proxNum: number = 0
    proxyAgents: HttpsProxyAgent[]
    /**
     * @param proxies Array of proxies if you are thinking of using `getListings` function alot. Don't overuse and fuck backpack.tf's servers though
     */
    constructor(proxies?: TypeProxy[] | string[]) {
        this.proxyAgents = proxies?.map((prox: TypeProxy | string) => new HttpsProxyAgent({
            keepAlive: true,
            maxSockets: 256,
            proxy: typeof prox === 'string' ? prox : proxyToStr(prox)
        })) || [];
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
                isOnline: boolean,
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
            const res = await got.get(url + '&page=' + page, {
                headers: {
                    'Cookie': "user-id=" + randomStr(20),
                    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0",
                },
                agent: {
                    http: this.__getRoundRobinProxy()
                }
            })
            const $ = cheerio.load(res.body);
            $('.listing').toArray().forEach(listing => {
                const [item, body] = $('.item,.listing-body', listing).toArray()
                let wear: string = null, paintkit: string = null;
                if (item.attribs['data-paint_kit']) {
                    const imgText = $('.item-icon', item).toArray()[0]?.attribs.style;
                    if (imgText && imgText.includes('scrap.tf')) {
                        [, paintkit, wear] = imgText.split('_')
                    }
                }
                let output: string, outputQuality: string, target: string;
                switch (item.attribs['data-base_name']) {
                    case 'Kit':
                        target = item.attribs['data-priceindex']?.split('-')[1];
                        break;
                    case 'Fabricator':
                        [output, outputQuality, target] = item.attribs['data-priceindex']?.split('-');
                        break;
                    case 'Strangifier':
                        target = item.attribs['data-priceindex'];
                }
                const craftnumber = item.attribs['data-origin'] === "Crafted" ? item.attribs['data-original-title']?.split(' ').pop() : null
                const skuObject: sku.skuType = {
                    defindex: parseInt(item.attribs['data-defindex']),
                    quality: parseInt(item.attribs['data-quality']),
                    australium: item.attribs['data-australium'] == "1",
                    craftable: item.attribs['data-craftable'] == "1",
                    crateseries: parseInt(item.attribs['data-crate']) || null,
                    effect: parseInt(item.attribs['data-effect_id']) || null,
                    festive: item.attribs['data-festivized'] == "1",
                    killstreak: parseInt(item.attribs['data-ks_tier']) || null,
                    paint: parseInt(item.attribs['data-paint_hex'], 16) || null,
                    quality2: parseInt(item.attribs['data-quality_elevated']) || null,
                    wear: parseInt(wear) || null,
                    paintkit: parseInt(paintkit) || null,
                    craftnumber: craftnumber?.startsWith('#') ? parseInt(craftnumber.substring(1)) || null : null,
                    output: parseInt(output) || null,
                    outputQuality: parseInt(outputQuality) || null,
                    target: parseInt(target) || null
                }
                const spells: string[] = ["1", "2", "3"].map(sp => item.attribs['data-spell_' + sp]).filter(sp => sp);
                const parts: string[] = ["1", "2", "3"].map(sp => item.attribs['data-part_name_' + sp]).filter(sp => sp);
                const priceStrings = (item.attribs['data-listing_price'] as string).split(' ');
                const isK = priceStrings[1].startsWith('key');
                const intent = item.attribs["data-listing_intent"];
                const button = $('.btn:not(.btn-warning)', body).get(0);
                listingstoReturn[intent as "buy"].push({
                    automatic: ((button.attribs["data-original-title"] || button.attribs.title) as string)?.includes('user agent') ?? false,
                    details: $('p', body).text(),
                    isOnline: $('.online', body).length === 1,
                    price: {
                        keys: isK ? parseFloat(priceStrings[0]) : 0,
                        metal: isK && priceStrings[2] ? parseFloat(priceStrings[2]) : (!isK ? parseFloat(priceStrings[0]) : 0)
                    },
                    sku: sku.fromObject(skuObject),
                    spells,
                    parts,
                    steamid64: cuint.UINT64(parseInt(item.attribs['data-listing_account_id']), 17825793).toString(),
                    tradeUrl: button.attribs.href
                })
            })
        }
        return listingstoReturn
    }
    __getRoundRobinProxy() {
        if (this.proxNum == this.proxyAgents.length) this.proxNum = 0;
        return this.proxyAgents[this.proxNum++];
    }
}
const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
const charLength = characters.length;
function randomStr(len: number) {
    let res = '';
    for (let i = 0; i < len; i++) {
        res += characters.charAt(Math.floor(Math.random() * charLength));
    }
    return res;
}