// University markers for the landing-page country-outline map.
// Each country is rendered as a colored vector map (see OutlineMap) with these
// universities placed as logo chips by [lon, lat]. Keep the lists short — the
// point of the contour view is to show only the handful of top schools per
// country and skip the empty space between them.

export type CountryCode = "US" | "IT" | "HK";

export type UniMarker = {
  name: string;
  lat: number;
  lon: number;
  /** Logo file in /public/logos (US schools). */
  logo?: string;
  /** Short monogram shown when there is no logo (Italian schools). */
  mono?: string;
};

export type CountryView = {
  code: CountryCode;
  label: string;
  /** Short caption shown under the country name in the pager. */
  blurb: string;
  markers: UniMarker[];
};

const US_MARKERS: UniMarker[] = [
  { name: "Harvard", lat: 42.38, lon: -71.12, logo: "/logos/harvard.svg" },
  { name: "MIT", lat: 42.3601, lon: -71.0942, logo: "/logos/mit.png" },
  { name: "Stanford", lat: 37.4275, lon: -122.1697, logo: "/logos/stanford.png" },
  { name: "Princeton", lat: 40.344, lon: -74.6514, logo: "/logos/princeton.svg" },
  { name: "Yale", lat: 41.3163, lon: -72.9223, logo: "/logos/yale.png" },
  { name: "Columbia", lat: 40.8075, lon: -73.9626, logo: "/logos/columbia.png" },
  { name: "UPenn", lat: 39.9522, lon: -75.1932, logo: "/logos/penn.png" },
  { name: "UC Berkeley", lat: 37.8715, lon: -122.273, logo: "/logos/berkeley.svg" },
  { name: "UCLA", lat: 34.0689, lon: -118.4452, logo: "/logos/ucla.avif" },
  { name: "Duke", lat: 36.0014, lon: -78.9382, logo: "/logos/duke.png" },
  { name: "NYU", lat: 40.7295, lon: -73.9965, logo: "/logos/nyu.png" },
  { name: "Northwestern", lat: 42.0565, lon: -87.6753, logo: "/logos/northwestern.png" },
  { name: "Rice", lat: 29.7174, lon: -95.4018, logo: "/logos/rice.png" },
  { name: "UChicago", lat: 41.7886, lon: -87.5987, logo: "/logos/uchicago.png" },
  { name: "U. Washington", lat: 47.6553, lon: -122.3035, logo: "/logos/washington.png" },
];

const IT_MARKERS: UniMarker[] = [
  { name: "Politecnico di Milano", lat: 45.478, lon: 9.227, logo: "/logos/polimi.svg" },
  { name: "Bocconi", lat: 45.4459, lon: 9.188, logo: "/logos/bocconi.svg" },
  { name: "Politecnico di Torino", lat: 45.063, lon: 7.662, logo: "/logos/polito.svg" },
  { name: "Università di Bologna", lat: 44.4949, lon: 11.3426, logo: "/logos/bologna.svg" },
  { name: "Università di Padova", lat: 45.4064, lon: 11.8768, logo: "/logos/padova.svg" },
  { name: "Sapienza Roma", lat: 41.9038, lon: 12.5147, logo: "/logos/sapienza.svg" },
  { name: "Scuola Normale, Pisa", lat: 43.7196, lon: 10.4083, logo: "/logos/normale.svg" },
  { name: "Università di Firenze", lat: 43.8, lon: 11.253, logo: "/logos/firenze.svg" },
  { name: "Federico II, Napoli", lat: 40.847, lon: 14.255, logo: "/logos/federico2.svg" },
];

const HK_MARKERS: UniMarker[] = [
  { name: "HKU", lat: 22.283, lon: 114.137, logo: "/logos/hku.svg" },
  { name: "HKUST", lat: 22.3364, lon: 114.2654, logo: "/logos/hkust.svg" },
  { name: "CUHK", lat: 22.4196, lon: 114.207, logo: "/logos/cuhk.png" },
  { name: "CityU", lat: 22.3367, lon: 114.1719, logo: "/logos/cityu.svg" },
  { name: "PolyU", lat: 22.3045, lon: 114.18, logo: "/logos/polyu.svg" },
];

export const COUNTRIES: CountryView[] = [
  {
    code: "US",
    label: "United States",
    blurb: `${US_MARKERS.length} top universities`,
    markers: US_MARKERS,
  },
  {
    code: "IT",
    label: "Italy",
    blurb: `${IT_MARKERS.length} top universities`,
    markers: IT_MARKERS,
  },
  {
    code: "HK",
    label: "Hong Kong",
    blurb: `${HK_MARKERS.length} top universities`,
    markers: HK_MARKERS,
  },
];
