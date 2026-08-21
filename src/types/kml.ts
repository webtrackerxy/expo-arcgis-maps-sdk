import type { GeographicPoint } from './common';

/** The kind of a KML node, as reported by {@link import('../kml').getKmlInfo}. */
export type KmlNodeType =
  | 'document'
  | 'folder'
  | 'placemark'
  | 'groundOverlay'
  | 'screenOverlay'
  | 'networkLink'
  | 'photoOverlay'
  | 'tour'
  | 'other';

/** One node in a KML document's tree. */
export type KmlNodeInfo = {
  /** The node's name (may be empty). */
  name: string;
  /** The node's kind. */
  type: KmlNodeType;
  /** Whether the node is currently visible. */
  visible: boolean;
  /** Depth in the tree (0 = a root node). */
  depth: number;
};

/** Result of {@link import('../kml').getKmlInfo}. */
export type KmlInfo = {
  /** The document's nodes, flattened depth-first with a {@link KmlNodeInfo.depth}. */
  nodes: KmlNodeInfo[];
};

/** A point placemark to author into a KML file. */
export type KmlPlacemarkInput = {
  /** Placemark name shown in the document tree and callouts. */
  name: string;
  /** Placemark location (WGS 84). */
  point: GeographicPoint;
};

/** A single track (an ordered, time-stamped path) for a KML multi-track. */
export type KmlTrackInput = {
  /** Ordered track vertices (WGS 84); timestamps are assigned sequentially. */
  points: GeographicPoint[];
};

/** Options for {@link import('../kml').createKmlFile}. */
export type CreateKmlFileOptions = {
  /** Absolute path to write the `.kmz` to (created/overwritten). */
  path: string;
  /** Point placemarks to add to the document. */
  placemarks?: KmlPlacemarkInput[];
  /**
   * Tracks combined into a single KML multi-track added to the document. Useful
   * for recording a path over time (e.g. a GPS trace).
   */
  tracks?: KmlTrackInput[];
};

/** Result of {@link import('../kml').createKmlFile}. */
export type CreateKmlFileResult = {
  /** The path the `.kmz` was written to. */
  path: string;
};
