/**
 * Result of {@link import('./view').ArcgisMapViewRef.exportImage}.
 *
 * The rendered map is written to a PNG file in the app's cache directory; `uri`
 * is a `file://` URL usable directly as a React Native `<Image>` source. The
 * file is not removed automatically — delete it when you no longer need it.
 * Dimensions are in pixels (device resolution), which may exceed the view's
 * point size on high-density displays.
 */
export type ExportImageResult = {
  /** `file://` URI to the exported PNG in the app cache directory. */
  uri: string;
  /** Pixel width of the exported image. */
  width: number;
  /** Pixel height of the exported image. */
  height: number;
};
