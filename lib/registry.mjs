import ApiClientBase from 'api-client-base'

/*‡
__Registry (extends ApiClientBase)__

`new RegistryAPI()`

See the [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md).
*/

class NpmRegistry extends ApiClientBase {
  /*‡
  not CORS-friendly. Docs [here](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage).
  */
  async getPackage (packageName, options = {}) {
    return this.fetchJson(`https://registry.npmjs.org/${packageName}${options.latest ? '/latest' : ''}`, {
      mode: 'cors'
    })
  }

  /**
   *
   * See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).
   */
  async search (options = {}) {
    const url = new URL(`https://registry.npmjs.org/-/v1/search`)
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

  /**
   *
   * See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).
   */
  async getPackagesByMaintainer (user) {
    return this.search({ text: `maintainer:${user}`, size: 250 })
  }
}

export default NpmRegistry
