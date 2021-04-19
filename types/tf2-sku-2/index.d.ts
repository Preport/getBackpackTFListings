declare module 'tf2-sku-2' {
    export function fromObject(item: skuType): string;
    export type skuType = {
        defindex: number;
        quality: number;
        craftable?: boolean;
        killstreak?: number;
        australium?: boolean;
        effect?: number;
        festive?: boolean;
        paintkit?: number;
        wear?: number;
        quality2?: number;
        craftnumber?: number;
        crateseries?: number;
        paint?: number;
        target?: number;
        output?: number;
        outputQuality?: number;
    }
    export function fromString(
        sku: string
    ): {
        defindex: number;
        quality: number;
        craftable: boolean;
        killstreak: number;
        australium: boolean;
        effect: number;
        festive: boolean;
        paintkit: number;
        wear: number;
        quality2: number;
        craftnumber: number;
        crateseries: number;
        paint: number;
        target: number;
        output: number;
        outputQuality: number;
    };
}
