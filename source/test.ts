import getListings from '.'
const gl = new getListings();

async function t() {
    const rp = await gl.getListings('https://backpack.tf/classifieds?item=Rocket%20Launcher&quality=11&tradable=1&craftable=1&australium=-1&killstreak_tier=0')
    console.log(JSON.stringify(rp, null, "\t"));
}
t().catch(e => {
    console.error(e);
    process.exit(1);
});