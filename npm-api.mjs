import ApiClientBase from 'api-client-base'

class NpmApiClient extends ApiClientBase {
  /* not CORS-friendly */
  async getPackage (packageName) {
    return this.fetchJson(`https://registry.npmjs.org/${packageName}`, {
      mode: 'cors',
      headers: {
        Accept: 'application/vnd.npm.install-v1+json'
      }
    })
  }

  async getPackageNpms (packageName) {
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

  /**
   *
   * SEE: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search
   */
  async getPackagesByMaintainer (user) {
    const data = await this.fetchJson(`https://registry.npmjs.org/-/v1/search?text=maintainer:${user}&size=250`)
    let finished = !(data.total > data.objects.length)
    while (!finished) {
      const moreData = await this.fetchJson(`https://registry.npmjs.org/-/v1/search?text=maintainer:${user}&size=250&from=${data.objects.length}`)
      data.objects.push(...moreData.objects)
      finished = !(data.total > data.objects.length)
    }
    return data.objects.map(o => o.package)
  }

  async npmDependents (packageName) {
    const response = await this.fetch(`https://www.npmjs.com/package/${packageName}`)
    const html = await response.text()
    const matches = html.match(/>([0-9,]+)<\/span>Dependents/)
    if (matches) {
      return Number(matches[1].replace(/,/g, ''))
    }
  }
}

export default NpmApiClient
