<a name="NpmDownloads"></a>

## NpmDownloads
API Client for the npm download-counts API.

**Kind**: global class  
**See**: https://github.com/npm/registry/blob/main/docs/download-counts.md  

* [NpmDownloads](#NpmDownloads)
    * [.getTotalPackageDownloads()](#NpmDownloads+getTotalPackageDownloads)
    * [.getPackageDownloadHistory()](#NpmDownloads+getPackageDownloadHistory)

<a name="NpmDownloads+getTotalPackageDownloads"></a>

### npm.getTotalPackageDownloads()
```
{
  packages: [
    { name: 'renamer', downloads: 106204 },
    { name: 'handbrake-js', downloads: 5878 }
  ],
  total: 112082
}
```

**Kind**: instance method of [<code>NpmDownloads</code>](#NpmDownloads)  
**See**: https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values  
<a name="NpmDownloads+getPackageDownloadHistory"></a>

### npm.getPackageDownloadHistory()
Returns all downloads per day for a package.

**Kind**: instance method of [<code>NpmDownloads</code>](#NpmDownloads)  
**See**: https://github.com/npm/registry/blob/main/docs/download-counts.md  

| Param | Type |
| --- | --- |
| options.from | <code>string</code> \| <code>Date</code> | 
| options.to | <code>string</code> | 
| options.period | <code>string</code> | 

