import getListings from '.'
const gl = new getListings();


let urls = [
    'https://backpack.tf/classifieds?quality=15&tradable=1&craftable=1&australium=-1&killstreak_tier=0',
    'https://backpack.tf/classifieds?quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0&spell=Exorcism%2CVoices%20from%20Below%2CPumpkin%20Bombs%2CHalloween%20Fire',
    'https://backpack.tf/classifieds?item=Kit&quality=6&tradable=1&craftable=-1&australium=-1&killstreak_tier=2',
    'https://backpack.tf/classifieds?item=Fabricator&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=2',
    'https://backpack.tf/classifieds?item=Strangifier&quality=6&tradable=1&craftable=1&australium=-1&killstreak_tier=0'
]
async function t() {
    const res = await Promise.all(urls.map(url => gl.getListings(url)))
    res.forEach((listings, i) => {
        ["buy", "sell"].forEach(intent => {
            listings[intent as "buy"].find(list => {
                switch (i) {
                    case 0:
                        //checking paints || Item's with unusual effects are counted as "Decorated Weapon" as well so ignore them.
                        if (!(list.sku.includes(';u') || (list.sku.includes(';w') && list.sku.includes(';pk')))) throw new ListingError("Paint Check Failed", list);
                        break;
                    case 1:
                        //checking spells
                        if (!list.spells.length) throw new ListingError("Spell Check Failed", list);
                        break;
                    case 2:
                        //Kit
                        if (!list.sku.includes(';td-')) throw new ListingError("Kit Check Failed", list);
                        break;
                    case 3:
                        //Kit Fabricator
                        if (!list.sku.includes(';td-') || !list.sku.includes(';od-') || !list.sku.includes(';oq-')) throw new ListingError("Fabricator Check Failed", list);
                        break;
                    case 4:
                        //Strangifier
                        if (!list.sku.includes(';td-')) throw new ListingError("Strangifier Check Failed", list);
                        break;
                }
            })
        })
    })
    console.log("All tests have passed.");
}
t().catch(e => {
    console.error(e.toString());
    process.exit(1);
});

type Unwrap<T> = T extends Promise<infer X> ? X : T
class ListingError extends Error {
    message: string
    //Adding type definition to this is unnecessary but i had to do it
    listItem: Unwrap<ReturnType<getListings['getListings']>>['buy'][0]

    constructor(message: string, listItem: ListingError['listItem']) {
        super(message)
        this.listItem = listItem
    }
    toString = () => {
        return JSON.stringify(this.listItem, null, "\t") + "\n" + this.message;
    }
}