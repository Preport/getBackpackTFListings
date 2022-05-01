import cheerio from 'cheerio';
import got from 'got';
import hpagent from 'hpagent';
import sku from 'tf2-sku-2';
import cuint from 'cuint';
const stockMap: Map<string, string> = new Map()
    .set('0', '190') // Bat
    .set('1', '191') // Bottle
    .set('2', '192') // Fireaxe
    .set('3', '193') // Club
    .set('4', '194') // Knife
    .set('5', '195') // Fists
    .set('6', '196') // Shovel
    .set('7', '197') // Wrench
    .set('8', '198') // Bonesaw
    .set('9', '199') // Shotgun - Engineer (Primary)
    .set('10', '199') // Shotgun - Soldier
    .set('11', '199') // Shotgun - Heavy
    .set('12', '199') // Shotgun - Pyro
    .set('13', '200') // Scattergun
    .set('14', '201') // Sniper Rifle
    .set('15', '202') // Minigun
    .set('16', '203') // SMG
    .set('17', '204') // Syringe Gun
    .set('18', '205') // Rocket Launcher
    .set('19', '206') // Grenade Launcher
    .set('20', '207') // Stickybomb Launcher
    .set('21', '208') // Flamethrower
    .set('22', '209') // Pistol - Engineer
    .set('23', '209') // Pistol - Scout
    .set('24', '210') // Revolver
    .set('25', '737') // Construction PDA
    .set('29', '211') // Medigun
    .set('30', '212') // Invis Watch
    .set('735', '736'); // Sapper

function proxyToStr(proxy: getListings.Proxy) {
    return 'http://' + proxy.auth.username + ':' + proxy.auth.password + '@' + proxy.host + ':' + proxy.port;
}

class getListings {
    proxNum: number = 0;
    proxyAgents: {
        https: hpagent.HttpsProxyAgent;
        http: hpagent.HttpProxyAgent;
    }[];
    /**
     * @param proxies Array of proxies if you are thinking of using `getListings` function a lot.
     */
    constructor(proxies?: (getListings.Proxy | string)[]) {
        this.proxyAgents =
            proxies?.map((prox: getListings.Proxy | string) => {
                return {
                    https: new hpagent.HttpsProxyAgent({
                        keepAlive: true,
                        maxSockets: 256,
                        proxy: typeof prox === 'string' ? prox : proxyToStr(prox)
                    }),
                    http: new hpagent.HttpProxyAgent({
                        keepAlive: true,
                        maxSockets: 256,
                        proxy: typeof prox === 'string' ? prox : proxyToStr(prox)
                    })
                };
            }) || [];
    }
    /**
     * @param url the url to get
     * ex: https://backpack.tf/classifieds?item=Flipped%20Trilby&quality=5&tradable=1&craftable=1&australium=-1&particle=13&killstreak_tier=0
     * do not include &page parameter in the url
     * @param pageAmount Amount of pages to load
     */
    async getListings(url: string, pageAmount?: number) {
        pageAmount = Math.max(1, pageAmount ?? 1);
        const listingstoReturn: getListings.Response = {
            buy: [],
            sell: []
        };
        for (let page = 1; page < pageAmount + 1; page++) {
            const agent = this.__getRoundRobinProxy();
            const res = await got.get(url + '&page=' + page, {
                headers: {
                    Cookie: 'user-id=' + randomStr(20),
                    Referer: 'backpack.tf',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0'
                },
                agent,
                timeout: 10000
            });
            const host = res.url.split('//')[1].split('/')[0];
            if (host !== 'backpack.tf')
                throw new Error(
                    `Got a response from ${host} instead of backpack.tf.\nThis is probably a temporary error but if it happens frequently create an issue on github.`
                );
            const $ = cheerio.load(res.body);
            $('.listing')
                .toArray()
                .forEach(listing => {
                    const [item, body] = $('.item,.listing-body', listing).toArray();
                    let wear: number = null,
                        paintkit: number = null;
                    if (item.attribs['data-paint_kit']) {
                        const imgText = $('.item-icon', item).toArray()[0]?.attribs.style;
                        if (imgText && imgText.includes('scrap.tf')) {
                            [, paintkit, wear] = imgText.split('_').map(s => parseInt(s) || null);
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
                        case 'Unusualifier':
                            target = item.attribs['data-priceindex'];
                    }
                    const defindex = parseInt(
                        stockMap.get(item.attribs['data-defindex']) ?? item.attribs['data-defindex']
                    );
                    const craftnumber =
                        item.attribs['data-origin'] === 'Crafted'
                            ? item.attribs['data-original-title']?.split(' ').pop()
                            : null;
                    const skuObject: sku = {
                        // 9536 === WarPaint
                        defindex:
                            defindex === 9536
                                ? parseInt(`${(Math.floor(paintkit / 100) % 2 === 0 ? '17' : '16') + paintkit}`)
                                : defindex,
                        quality: parseInt(item.attribs['data-quality']),
                        australium: item.attribs['data-australium'] == '1',
                        craftable: item.attribs['data-craftable'] == '1',
                        crateseries: parseInt(item.attribs['data-crate']) || null,
                        effect: parseInt(item.attribs['data-effect_id']) || null,
                        festive: item.attribs['data-festivized'] == '1',
                        killstreak: parseInt(item.attribs['data-ks_tier']) || null,
                        paint: parseInt(item.attribs['data-paint_hex'], 16) || null,
                        quality2: parseInt(item.attribs['data-quality_elevated']) || null,
                        wear: wear || null,
                        paintkit: paintkit || null,
                        craftnumber: craftnumber?.startsWith('#') ? parseInt(craftnumber.substring(1)) || null : null,
                        output: parseInt(output) || null,
                        outputQuality: parseInt(outputQuality) || null,
                        target: parseInt(target) || null
                    };
                    const spells: string[] = ['1', '2', '3']
                        .map(sp => item.attribs['data-spell_' + sp])
                        .filter(sp => sp);
                    const parts: string[] = ['1', '2', '3']
                        .map(sp => item.attribs['data-part_name_' + sp])
                        .filter(sp => sp);
                    const priceStrings = (item.attribs['data-listing_price'] as string).split(' ');

                    if (priceStrings.length === 1) {
                        //marketplace listing just skip it
                        return;
                    }

                    const isK = priceStrings[1].startsWith('key');
                    const intent = item.attribs['data-listing_intent'];
                    const button = $('.btn:not(.btn-warning)', body).get(0);
                    const tradeUrl = button.attribs.href.includes('tradeoffer') ? button.attribs.href : null;
                    const addFriend = tradeUrl ? null : button.attribs.href;

                    const [bumped, created] = Array.from(
                        $('.timeago', body).map((_i, chil) => new Date(chil.attribs.datetime).valueOf())
                    );
                    listingstoReturn[intent as 'buy'].push({
                        id: listing.attribs.id,
                        automatic:
                            ((button.attribs['data-original-title'] || button.attribs.title) as string)?.includes(
                                'user agent'
                            ) ?? false,
                        created,
                        bumped,
                        count: parseInt($('span[data-tip]', body)?.text()) || 1,
                        details: $('p', body).text(),
                        isOnline: $('.online', body).length === 1,
                        price: {
                            keys: isK ? parseFloat(priceStrings[0]) : 0,
                            metal:
                                isK && priceStrings[2]
                                    ? parseFloat(priceStrings[2])
                                    : !isK
                                    ? parseFloat(priceStrings[0])
                                    : 0
                        },
                        sku: sku.fromObject(skuObject),
                        spells,
                        parts,
                        sheen: item.attribs['data-sheen'] || null,
                        killstreaker: item.attribs['data-killstreaker'] || null,
                        steamid64: cuint.UINT64(parseInt(item.attribs['data-listing_account_id']), 17825793).toString(),
                        tradeUrl,
                        addFriend
                    });
                });
        }
        return listingstoReturn;
    }
    private __getRoundRobinProxy() {
        if (this.proxNum == this.proxyAgents.length) this.proxNum = 0;
        return this.proxyAgents[this.proxNum++];
    }
}
namespace getListings {
    export interface Proxy {
        host: string;
        port: number;
        auth: {
            username: string;
            password: string;
        };
    }
    export interface Listing {
        id: string; // Listing's unique id.
        sku: string; // tf2-sku-2 in string.
        created: string; // epoch time of the when the listing was created in ms.
        bumped: string; // epoch time of the when the listing was bumped in ms. // will be same as created if it was never bumped.
        count: number; // amount of the items lister is selling.
        automatic: boolean; // true if the lister is automatic.
        isOnline: boolean; // true if the lister is online.
        details: string; // Comment below the listing.
        tradeUrl: string; // If listing has tradeURL, this is an URL to send a trade offer otherwise null.
        addFriend: string; // If listing does not have tradeURL, this is an URL to add the person otherwise null.
        steamid64: string; // Listers steamID.
        price: {
            keys: number;
            metal: number;
        };
        spells: string[]; // Spells of the listed item.
        parts: string[]; // Strange Parts of the listed item.
        sheen: string; // Sheen of the item if it's kt-2 or kt-3
        killstreaker: string; // Killstreaker of the item if it's kt-3
    }
    export type Response = {
        [intent in 'buy' | 'sell']: {
            id: string;
            sku: string;
            created: number;
            bumped: number;
            count: number;
            automatic: boolean;
            isOnline: boolean;
            details: string;
            tradeUrl: string;
            addFriend: string;
            steamid64: string;
            price: {
                keys: number;
                metal: number;
            };
            spells: string[];
            parts: string[];
            sheen: string;
            killstreaker: string;
        }[];
    };
}

export = getListings;

const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
const charLength = characters.length;
function randomStr(len: number) {
    let res = '';
    for (let i = 0; i < len; i++) {
        res += characters.charAt(Math.floor(Math.random() * charLength));
    }
    return res;
}
