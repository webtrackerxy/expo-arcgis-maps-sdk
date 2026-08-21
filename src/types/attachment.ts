/** Metadata for one attachment on a feature. Binary data is not returned. */
export type AttachmentInfo = {
  /** The attachment's numeric id (unique within the feature). */
  id: number;
  /** The attachment's file name. */
  name: string;
  /** The attachment's MIME content type (e.g. `image/jpeg`). */
  contentType: string;
  /** The attachment's size in bytes. */
  size: number;
};
