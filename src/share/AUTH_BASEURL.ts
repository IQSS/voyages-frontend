type VoyagesRuntimeConfig = Readonly<{
  apiAuthToken?: string;
}>;

declare global {
  // This object is written by the container at startup, after the image is built.
  // Candidate and production can therefore run the exact same frontend image.
  // eslint-disable-next-line no-var
  var __VOYAGES_RUNTIME_CONFIG__: VoyagesRuntimeConfig | undefined;
}

const runtimeConfig = globalThis.__VOYAGES_RUNTIME_CONFIG__ ?? {};

export const BASEURL = import.meta.env.VITE_API_BASE_URL;
export const AUTHTOKEN = runtimeConfig.apiAuthToken ?? '';
export const HOST = import.meta.env.HOST;
export const POST = import.meta.env.POST;
export const BASE_URL_FRONTEND = import.meta.env.VITE_API_BASE_URL_FRONTEND;
