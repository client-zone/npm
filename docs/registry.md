<a name="NpmRegistry"></a>

## NpmRegistry
**Kind**: global class  
**See**: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md  

* [NpmRegistry](#NpmRegistry)
    * [.getPackage()](#NpmRegistry+getPackage)
    * [.search()](#NpmRegistry+search)

<a name="NpmRegistry+getPackage"></a>

### npmRegistry.getPackage()
Not CORS-friendly.
Docs: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage
Response data: https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md

[options.latest]{boolean} - Include only the latest version, not all versions
[options.abbreviated]{boolean} - Include only the install data. Doesn't appear to work with `latest`.

**Kind**: instance method of [<code>NpmRegistry</code>](#NpmRegistry)  
<a name="NpmRegistry+search"></a>

### npmRegistry.search()
See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).
[options.size]{number} - Max 250
[options.text]{string} - Full-text search string

**Kind**: instance method of [<code>NpmRegistry</code>](#NpmRegistry)  
**Example**  
```js
registryApi.search({ text: `maintainer:75lb` })
registryApi.search({ text: `author:75lb`, size: 10 })
```
