import ApiClientBase from '@client-zone/base'

/**
 * Scraping is currently blocked by Cloudflare. Disabling for now. Could be fixed by using Puppeteer.
 */
class NpmScrape extends ApiClientBase {
  async getDependents (packageName) {
    let inProgress = true
    let offset = 0
    const output = []
    while (inProgress) {
      let html
      try {
        html = await this.fetchText(`https://www.npmjs.com/browse/depended/${packageName}?offset=${offset}`)
      } catch (err) {
        if (err?.response?.status === 400) {
          html = err.response.body
          /*
          keep going - update ApiClientBase to NOT throw on 4xx. But then .fetchText would need to return `response` instead of text so maybe just call this.fetch directly if you want to inspect the response.
          */
        } else {
          throw err
        }
      }
      const matches = html.match(/window\.__context__ = (\{.*\})/m)
      if (matches.length) {
        const json = JSON.parse(matches[1])
        output.push(...json.context.packages)
        // console.log(json.context)
        if (json.context.hasNext === false) {
          inProgress = false
        }
        offset += json.context.paginationSize
      } else {
        throw new Error('JSON data not found in page')
      }
    }
    return output
  }
}

export default NpmScrape
