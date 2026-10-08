// The arbiter layout sets its own `openGraph`, which replaces the root one wholesale —
// including the root card image. Re-export it here so /arbiter previews keep the picture.

export { default, alt, size, contentType } from "../opengraph-image";
