import { ChecklistGroupCategory } from "@/types/checklist";

/** Garmin Pilot container constants */
export const CONTAINER_TYPE = "checklistBinder";
export const DATA_MODEL_VERSION = 1;
export const PACKAGE_TYPE_VERSION = 1;
export const CONTENT_FILENAME = "content.json";

/** Garmin Pilot checklist type enum values */
export const GP_TYPE_NORMAL = 0;
export const GP_TYPE_ABNORMAL = 1;
export const GP_TYPE_EMERGENCY = 2;

/** Garmin Pilot checklist subtype enum values */
export const GP_SUBTYPE_PREFLIGHT = 0;
export const GP_SUBTYPE_TAKEOFF_CRUISE = 1;
export const GP_SUBTYPE_LANDING = 2;
export const GP_SUBTYPE_OTHER = 3;
export const GP_SUBTYPE_EMERGENCY = 4;

/** Garmin Pilot item type enum values */
export const GP_ITEM_PLAIN_TEXT = 0;
export const GP_ITEM_NOTE = 1;
export const GP_ITEM_LOCAL_ALTIMETER = 2;
export const GP_ITEM_OPEN_NEAREST = 3;
export const GP_ITEM_OPEN_ATIS_SCRATCHPAD = 4;
export const GP_ITEM_OPEN_CRAFT_SCRATCHPAD = 5;
export const GP_ITEM_WEATHER_FREQUENCY = 6;
export const GP_ITEM_CLEARANCE_FREQUENCY = 7;
export const GP_ITEM_GROUND_CTAF_FREQUENCY = 8;
export const GP_ITEM_TOWER_CTAF_FREQUENCY = 9;
export const GP_ITEM_APPROACH_FREQUENCY = 10;
export const GP_ITEM_CENTER_FREQUENCY = 11;

/** Garmin Pilot completion action enum values */
export const GP_ACTION_DO_NOTHING = 0;
export const GP_ACTION_NEXT_CHECKLIST = 1;
export const GP_ACTION_OPEN_FLIGHT_PLAN = 2;
export const GP_ACTION_CLOSE_FLIGHT_PLAN = 3;
export const GP_ACTION_OPEN_SAFETAXI = 4;
export const GP_ACTION_OPEN_MAP = 5;

/** Garmin group key: [type, subtype] */
export type GarminGroupKey = [number, number];
/** EFIS group key: [category, title] */
export type EfisGroupKey = [ChecklistGroupCategory, string];

/** Mapping from Garmin [type, subtype] to EFIS [category, title] */
const GROUP_MAPPING: [GarminGroupKey, EfisGroupKey][] = [
  [
    [GP_TYPE_NORMAL, GP_SUBTYPE_PREFLIGHT],
    [ChecklistGroupCategory.Normal, "Preflight"],
  ],
  [
    [GP_TYPE_NORMAL, GP_SUBTYPE_TAKEOFF_CRUISE],
    [ChecklistGroupCategory.Normal, "Takeoff/Cruise"],
  ],
  [
    [GP_TYPE_NORMAL, GP_SUBTYPE_LANDING],
    [ChecklistGroupCategory.Normal, "Landing"],
  ],
  [
    [GP_TYPE_NORMAL, GP_SUBTYPE_OTHER],
    [ChecklistGroupCategory.Normal, "Other"],
  ],
  [
    [GP_TYPE_ABNORMAL, GP_SUBTYPE_EMERGENCY],
    [ChecklistGroupCategory.Abnormal, "Abnormal"],
  ],
  [
    [GP_TYPE_EMERGENCY, GP_SUBTYPE_EMERGENCY],
    [ChecklistGroupCategory.Emergency, "Emergency"],
  ],
];

const GARMIN_TO_EFIS = new Map(
  GROUP_MAPPING.map(([gk, ek]) => [JSON.stringify(gk), ek]),
);

const EFIS_TO_GARMIN = new Map(
  GROUP_MAPPING.map(([gk, ek]) => [JSON.stringify(ek), gk]),
);

/** Convert a Garmin [type, subtype] key to our [category, title] */
export function garminGroupKeyToEfis(key: GarminGroupKey): EfisGroupKey {
  const efis = GARMIN_TO_EFIS.get(JSON.stringify(key));
  if (!efis) throw new Error(`Garmin Pilot: unsupported group key ${key}`);
  return efis;
}

/** Convert our [category, title] key to a Garmin [type, subtype] */
export function efisGroupKeyToGarmin(key: EfisGroupKey): GarminGroupKey {
  const garmin = EFIS_TO_GARMIN.get(JSON.stringify(key));
  if (garmin) return garmin;

  // Fall back to defaults per category
  switch (key[0]) {
    case ChecklistGroupCategory.Normal:
      return [GP_TYPE_NORMAL, GP_SUBTYPE_OTHER];
    case ChecklistGroupCategory.Abnormal:
      return [GP_TYPE_ABNORMAL, GP_SUBTYPE_EMERGENCY];
    case ChecklistGroupCategory.Emergency:
      return [GP_TYPE_EMERGENCY, GP_SUBTYPE_EMERGENCY];
    default:
      return [GP_TYPE_NORMAL, GP_SUBTYPE_OTHER];
  }
}

/** Compare two Garmin group keys for sorting */
export function compareGroupKeys(a: GarminGroupKey, b: GarminGroupKey): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  return a[1] - b[1];
}

/** Validate a container has the expected structure */
export function isSupportedContainer(container: {
  dataModelVersion: number;
  packageTypeVersion: number;
  type: string;
  objects: unknown[];
}): boolean {
  return (
    container.dataModelVersion === DATA_MODEL_VERSION &&
    container.packageTypeVersion === PACKAGE_TYPE_VERSION &&
    container.type === CONTAINER_TYPE &&
    container.objects.length === 1
  );
}
