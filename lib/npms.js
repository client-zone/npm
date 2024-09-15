import ApiClientBase from '@client-zone/base'

/*
npms.io data seems old. Command-line-args was updated 2 months ago, this is wrong: "updated 3 years ago by 75lb"
@see https://npms.io/search?q=maintainer%3A75lb
*/

class NpmsApi extends ApiClientBase {
  async getPackage (packageName) {
    return this.fetchJson(`https://api.npms.io/v2/package/${packageName}`, {
      mode: 'cors'
    })
  }

  /**
   * Uses npms.io.. Same as the npm registry data, adding score and flags (e.g. deprecated, unstable).
   * This method returns more packages than registry.search.
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
