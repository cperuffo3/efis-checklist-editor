import {
  GP_ITEM_LOCAL_ALTIMETER,
  GP_ITEM_OPEN_NEAREST,
  GP_ITEM_OPEN_ATIS_SCRATCHPAD,
  GP_ITEM_OPEN_CRAFT_SCRATCHPAD,
  GP_ITEM_WEATHER_FREQUENCY,
  GP_ITEM_CLEARANCE_FREQUENCY,
  GP_ITEM_GROUND_CTAF_FREQUENCY,
  GP_ITEM_TOWER_CTAF_FREQUENCY,
  GP_ITEM_APPROACH_FREQUENCY,
  GP_ITEM_CENTER_FREQUENCY,
} from "./utils";

/** Map from Garmin Pilot item type number to [efisSlug, exampleString] */
const LIVE_DATA_TO_EFIS = new Map<number, [string, string]>([
  [GP_ITEM_LOCAL_ALTIMETER, ["%LOCAL_ALTIMETER%", "1025.0HPA ETNG (14NM)"]],
  [GP_ITEM_OPEN_NEAREST, ["%OPEN_NEAREST%", "<Open NRST>"]],
  [
    GP_ITEM_OPEN_ATIS_SCRATCHPAD,
    ["%OPEN_ATIS_SCRATCHPAD%", "<ATIS ScratchPad>"],
  ],
  [
    GP_ITEM_OPEN_CRAFT_SCRATCHPAD,
    ["%OPEN_CRAFT_SCRATCHPAD%", "<CRAFT ScratchPad>"],
  ],
  [GP_ITEM_WEATHER_FREQUENCY, ["%WEATHER_FREQUENCY%", "123.45 ETNG (14NM)"]],
  [
    GP_ITEM_CLEARANCE_FREQUENCY,
    ["%CLEARANCE_FREQUENCY%", "121.83 EHBK (24NM)"],
  ],
  [
    GP_ITEM_GROUND_CTAF_FREQUENCY,
    ["%GROUND_CTAF_FREQUENCY%", "123.525/129.875 EDKA (10NM)"],
  ],
  [
    GP_ITEM_TOWER_CTAF_FREQUENCY,
    ["%TOWER_CTAF_FREQUENCY%", "129.875/123.525 EDKA (10NM)"],
  ],
  [
    GP_ITEM_APPROACH_FREQUENCY,
    ["%APPROACH_FREQUENCY%", "120.205/123.875 EHBK (24NM)"],
  ],
  [
    GP_ITEM_CENTER_FREQUENCY,
    ["%CENTER_FREQUENCY%", "122.835/125.98/126.115 BRUSSELS (24NM)"],
  ],
]);

/** Reverse map: efisSlug -> [garminItemType, exampleString] */
const LIVE_DATA_TO_GARMIN = new Map<string, [number, string]>(
  [...LIVE_DATA_TO_EFIS.entries()].map(([garminType, [slug, example]]) => [
    slug,
    [garminType, example],
  ]),
);

/** Get the EFIS token slug for a Garmin Pilot live data item type */
export function getLiveDataSlug(itemType: number): string {
  const entry = LIVE_DATA_TO_EFIS.get(itemType);
  if (!entry)
    throw new Error(`Garmin Pilot: unsupported live data type ${itemType}`);
  return entry[0];
}

/** Check if an expectation string is a live data token and get its Garmin type */
export function getGarminLiveDataType(expectation: string): number | undefined {
  const entry = LIVE_DATA_TO_GARMIN.get(expectation);
  return entry?.[0];
}

/** All live data item types (for matching during read) */
export const LIVE_DATA_TYPES = new Set(LIVE_DATA_TO_EFIS.keys());
