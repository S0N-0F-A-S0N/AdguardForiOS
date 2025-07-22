import { ContentScriptData } from '../common/interfaces';
import { adguard } from './adguard';

/**
 * Engine is a class that handles the communication between the background
 * script and the native host, retrieves content script configuration from
 * there and caches it in the background.
 */
class Engine {
    /**
     * Global variable to track the engine timestamp. This value is used to
     * invalidate the cache when the underlying engine is updated.
     */
    private engineTimestamp = 0;

    /**
     * Cache to store the rules for a given URL. The key is a URL (string) and
     * the value is a ContentScriptData object. Caching responses allows us to
     * respond to content script requests quickly while also updating the cache
     * in the background.
     */
    private cache = new Map<string, ContentScriptData>();

    /**
     * Returns a cache key for the given URL and top-level URL.
     */
    private cacheKey = (url: string, topUrl?: string) => `${url}#${topUrl ?? ''}`;

    /**
     * Retrieves the configuration for the content script that is running on
     * the specified url from the native process. Stores the retrieved
     * configuration in the cache.
     *
     * @param url URL of the website.
     * @param topUrl URL of the top-level website.
     * @returns The configuration for the content script.
     */
    private lookupNative = async (url: string, topUrl?: string): Promise<ContentScriptData> => {
        // Send the request to the native messaging host and wait for the response.
        const data = await adguard.nativeHost.getContentScriptData(url, topUrl);

        const { configuration } = data;

        // If the engine timestamp has been updated, clear the cache and update
        // the timestamp.
        if (configuration && configuration.engineTimestamp !== this.engineTimestamp) {
            this.cache.clear();
            this.engineTimestamp = configuration.engineTimestamp;
        }

        // Save the new message in the cache for the given URL.
        const key = this.cacheKey(url, topUrl);
        this.cache.set(key, data);

        return data;
    };

    /**
     * Retrieves the configuration for the content script that is running on
     * the specified url. topUrl is only set when the url is an iframe.
     *
     * @param url URL of the website.
     * @param topUrl URL of the top-level website.
     */
    public lookup = async (url: string, topUrl?: string): Promise<ContentScriptData> => {
        const cacheKey = this.cacheKey(url, topUrl);
        const cachedData = this.cache.get(cacheKey);

        // If the data is already cached, return it.
        if (cachedData) {
            // Fire off a new request to update the cache in the background.
            this.lookupNative(url, topUrl);

            // Mark response as cached.
            cachedData.cached = true;

            return cachedData;
        }

        // If nothing found in the cache, send the request to the native
        // process and store the result in the cache.
        const data = await this.lookupNative(url, topUrl);

        return data;
    };
}

export const engine = new Engine();
