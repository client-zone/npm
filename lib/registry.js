import ApiClientBase from '@client-zone/base'

/**
 * @see https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md
 */
class NpmRegistry extends ApiClientBase {

  /**
   * Not CORS-friendly.
   * Docs: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage
   * Response data: https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md
   *
   * [options.latest]{boolean} - Include only the latest version, not all versions
   * [options.abbreviated]{boolean} - Include only the install data. Doesn't appear to work with `latest`.
   */
  async getPackage (packageName, options = {}) {
    const fetchOptions = {
      mode: 'cors',
      headers: {}
    }
    if (options.abbreviated) {
      fetchOptions.headers.accept = 'application/vnd.npm.install-v1+json'
    }
    return this.fetchJson(`https://registry.npmjs.org/${packageName}${options.latest ? '/latest' : ''}`, fetchOptions)
  }

  /**
   *
   * See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).
   * [options.size]{number} - Max 250
   * [options.text]{string} - Full-text search string
   * @example
   * registryApi.search({ text: `maintainer:75lb` })
   * registryApi.search({ text: `author:75lb`, size: 10 })
   */
  async search (options = {}) {
    options.size ||= 250
    const url = new URL('https://registry.npmjs.org/-/v1/search')
    for (const key of Object.keys(options)) {
      url.searchParams.set(key, options[key])
    }
    const data = await this.fetchJson(url)
    let finished = !(data.total > data.objects.length)
    while (!finished) {
      url.searchParams.set('from', data.objects.length)
      const moreData = await this.fetchJson(url)
      data.objects.push(...moreData.objects)
      finished = !(data.total > data.objects.length)
    }
    return data.objects.map(o => o.package)
  }
}

export default NpmRegistry
