/** Options for {@link import('../branchVersion').createServiceVersion}. */
export type CreateServiceVersionOptions = {
  /** URL to a **branch-versioned** feature service (`.../FeatureServer`). */
  serviceUrl: string;
  /** Name for the new version (the owner prefix is added by the server). */
  versionName: string;
  /** Optional description stored on the version. */
  description?: string;
  /** Who may see/edit the version. Defaults to `private`. */
  access?: 'public' | 'protected' | 'private';
};

/** Result of {@link import('../branchVersion').createServiceVersion}. */
export type CreateServiceVersionResult = {
  /** The full version name the server assigned (usually `owner.name`). */
  versionName: string;
};

/** One branch version of a service, from {@link import('../branchVersion').getServiceVersions}. */
export type ServiceVersionInfo = {
  /** Full version name (`owner.name`). */
  name: string;
  /** Who may see/edit the version. */
  access: 'public' | 'protected' | 'private';
  /** The version's description (empty string when none). */
  description: string;
  /** Whether the signed-in user owns the version. */
  isOwner: boolean;
};
