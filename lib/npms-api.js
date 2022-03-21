import ApiClientBase from 'api-client-base'

/**
__Registry (extends ApiClientBase)__

`new RegistryAPI()`

See the [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md).
*/

class NpmsApi extends ApiClientBase {
  async getPackage (packageName) {
    return this.fetchJson(`https://api.npms.io/v2/package/${packageName}`, {
      mode: 'cors'
    })
  }

  /**
   * Uses npms.io.. Same as the npm registry data, adding score and flags (e.g. deprecated, unstable).
   * @see https://api-docs.npms.io/
   * @param [options.from] {string} - The offset in which to start searching from (max of 5000). Default value: 0.
   */
  async search (query, options = {}) {
    options = Object.assign({
      size: 250,
      from: 0,
      maxResults: 2000
    }, options)
    const results = []
    let finished = false

    while (!finished) {
      const url = new URL('https://api.npms.io/v2/search')
      url.searchParams.set('q', query)
      url.searchParams.set('from', results.length + options.from)
      url.searchParams.set('size', options.size)
      const data = await this.fetchJson(url)
      results.push(...data.results)
      finished = results.length === data.total || results.length >= options.maxResults
    }
    return results
  }
}

export default NpmsApi
