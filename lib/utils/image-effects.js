const DITHER_NOISE_FRAMES = 4;
const DITHER_ASSET_VERSION = 1;
const DITHER_NOISE_ASSET_VERSION = 2;
const BASE_URL = import.meta.env?.BASE_URL ?? "/";
function withBase(path, base = BASE_URL) {
    if (!path.startsWith("/") || path.startsWith("//"))
        return path;
    if (!base || base === "/")
        return path;
    const normalizedBase = `/${base.replace(/^\/+|\/+$/g, "")}`;
    if (path === normalizedBase || path.startsWith(`${normalizedBase}/`))
        return path;
    return `${normalizedBase}${path}`;
}
export function isPapyrusImageEffect(value) {
    return value === "none" || value === "duotone" || value === "tritone" || value === "dither" || value === "dithernoise";
}
export function imageEffectClass(effect) {
    return !effect || effect === "none" ? undefined : `papyrus-image-effect-${effect}`;
}
export function ditherMaskPath(assetPath, mode = "dark", effect = "dither", frame = 1) {
    const cleanPath = assetPath.split(/[?#]/)[0]?.replace(/^\/+/, "") ?? "";
    const withoutExt = cleanPath.replace(/\.[a-z0-9]+$/i, "");
    const version = effect === "dithernoise" ? DITHER_NOISE_ASSET_VERSION : DITHER_ASSET_VERSION;
    const filename = effect === "dithernoise" ? `${mode}-${frame}.png` : `${mode}.png`;
    return `/generated/${effect}/v${version}/${withoutExt}/${filename}`;
}
function imageEffectAssetUrl(assetPath, mode, effect, frame = 1) {
    return withBase(ditherMaskPath(assetPath, mode, effect, frame));
}
export function imageEffectStyle(effect, assetPath) {
    if ((effect !== "dither" && effect !== "dithernoise") || !assetPath)
        return undefined;
    const ditherNoiseFrames = Array.from({ length: DITHER_NOISE_FRAMES - 1 }, (_, index) => index + 2);
    return [
        `--papyrus-dither-mask-dark: url("${imageEffectAssetUrl(assetPath, "dark", effect)}")`,
        `--papyrus-dither-mask-light: url("${imageEffectAssetUrl(assetPath, "light", effect)}")`,
        ...(effect === "dithernoise"
            ? ditherNoiseFrames.flatMap(frame => [
                `--papyrus-dither-mask-dark-${frame}: url("${imageEffectAssetUrl(assetPath, "dark", effect, frame)}")`,
                `--papyrus-dither-mask-light-${frame}: url("${imageEffectAssetUrl(assetPath, "light", effect, frame)}")`,
            ])
            : []),
    ].join("; ");
}
