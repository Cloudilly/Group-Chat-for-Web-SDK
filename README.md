#Anonymous Chat. Web SDK
Repository contains sample codes required to build a barebones anonymous group chat application as screenshot below.

![Anonymous](https://github.com/cloudilly/images/blob/master/javascript_anonymous.png)

####Token Generator
To prevent [cross site request forgeries](https://en.wikipedia.org/wiki/Cross-site_request_forgery), the developer using Web SDK is first required to deploy a token generator that issues out access tokens for onsite visitors. 

The Web SDK makes a XMLHttpRequest call to '/tokens' URL endpoint, ie, http://example.com/tokens, to request for a token. Included in the XMLHttpRequest is a device identifier assigned forth by Cloudilly. This device is embedded within the signed token and then presented to Cloudilly as a crucial part of the Web SDK authentication process. Below snippets show how to setup a token generator that dispenses such tokens at '/tokens' URL endpoint. Insert "Secret" obtained earlier into the code snippets where appropriate. If you do not find your preferred language or application server, you may like to browse to http://jwt.io to find the required JWT library.
