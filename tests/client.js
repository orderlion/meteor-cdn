/* Client side tests
 *
 * This package does some crazy stuff on the
 * client side so we need to test that all
 * the urls resolve correctly
 *
 */

// Use this value as a dummy CDN_URL
const CDN = "http://www.cloudfront.com/s9ufe3u2rns/";


// When the client uses Meteor._relativeToSiteRootUrl for css files
// it should return a path containing CDN_URL
Tinytest.add(
  'Client Side - Meteor._relativeToSiteRootUrl - css files',
  function (test) {
  	// Assume that the CDN_URL was set by the server
    __meteor_runtime_config__.CDN_URL = CDN;
    const cssfile = "/somefile.css";
    const relpath = Meteor._relativeToSiteRootUrl(cssfile);
    test.equal(relpath, CDN+"somefile.css");

    // Test that is also works with relative path css files
    const cssfile = "/somepath/somefile.css";
    const relpath = Meteor._relativeToSiteRootUrl(cssfile);
    test.equal(relpath,CDN+"somepath/somefile.css");
  }
);



// When the client uses Meteor._relativeToSiteRootUrl for js files
// it should return a path containing CDN_URL
Tinytest.add(
  'Client Side - Meteor._relativeToSiteRootUrl - js files',
  function (test) {
  	// Assume that the CDN_URL was set by the server
    __meteor_runtime_config__.CDN_URL = CDN;
    const jsfile = "/somefile.js";
    const relpath = Meteor._relativeToSiteRootUrl(jsfile);
    test.equal(relpath,CDN+"somefile.js");

    // Test that is also works with relative path css files
    const jsfile = "/somepath/somefile.js";
    const relpath = Meteor._relativeToSiteRootUrl(jsfile);
    test.equal(relpath,CDN+"somepath/somefile.js");
  }
);



// When the client uses Meteor._relativeToSiteRootUrl for js or css
// files with query strings it should return a path containing CDN_URL
Tinytest.add(
  'Client Side - Meteor._relativeToSiteRootUrl - static files with query strings',
  function (test) {
  	// Test with css file
    __meteor_runtime_config__.CDN_URL = CDN;
    const cssfile = "/somefile.css?version=12";
    const relpath = Meteor._relativeToSiteRootUrl(cssfile);
    test.equal(relpath,CDN+"somefile.css?version=12");

  	// Assume that the CDN_URL was set by the server
    __meteor_runtime_config__.CDN_URL = CDN;
    const jsfile = "/somepath/somefile.js?version=13";
    const relpath = Meteor._relativeToSiteRootUrl(jsfile);
    test.equal(relpath,CDN+"somepath/somefile.js?version=13");

  }
);



// When the client uses Meteor._relativeToSiteRootUrl for /sock/info files
// the path should NOT contain the CDN_URL
Tinytest.add(
  'Client Side - Meteor._relativeToSiteRootUrl - /sock/info',
  function (test) {
  	// Test with no query string file
    __meteor_runtime_config__.CDN_URL = CDN;
    const sockpath = "/sock/info";
    const relpath = Meteor._relativeToSiteRootUrl(sockpath);
    test.isTrue(relpath.indexOf(CDN) === -1);

  	// Test with no query string file
    __meteor_runtime_config__.CDN_URL = CDN;
    const sockpath = "/sock/info?request=13";
    const relpath = Meteor._relativeToSiteRootUrl(sockpath);
    test.isTrue(relpath.indexOf(CDN) === -1);
  }
);



// When the client uses Meteor._relativeToSiteRootUrl for any other path files
// the path should NOT contain the CDN_URL
Tinytest.add(
  'Client Side - Meteor._relativeToSiteRootUrl - any other path',
  function (test) {
  	// Test with no query string file
    __meteor_runtime_config__.CDN_URL = CDN;
    const path = "/somefile.xml";
    const relpath = Meteor._relativeToSiteRootUrl(path);
    test.isTrue(relpath.indexOf(CDN) === -1);

  	// Test with no query string file
    __meteor_runtime_config__.CDN_URL = CDN;
    const path = "/somepath/someotherfile";
    const relpath = Meteor._relativeToSiteRootUrl(path);
    test.isTrue(relpath.indexOf(CDN) === -1);
  }
);



// Test that the function still works when CDN_URL is not set
Tinytest.add(
  'Client Side - Meteor._relativeToSiteRootUrl - default behaviour',
  function (test) {
  	// delete CDN_URL constiable
  	delete __meteor_runtime_config__.CDN_URL;

  	// Test with no query string file
    const path = "/sockjs/info?";
    const relpath = Meteor._relativeToSiteRootUrl(path);
    test.equal(path,relpath);

  	// Test with no query string file
    const path = "/sockjs/info?";
    const relpath = Meteor._relativeToSiteRootUrl(path);
    test.equal(path,relpath);

    // Test with no query string file
    const path = "/somefile.css?version=12";
    const relpath = Meteor._relativeToSiteRootUrl(path);
    test.equal(path,relpath);

    // Test with no query string file
    const path = "/somefile.css";
    const relpath = Meteor._relativeToSiteRootUrl(path);
    test.equal(path,relpath);

    // Test with no query string file
    const path = "/somefile.js";
    const relpath = Meteor._relativeToSiteRootUrl(path);
    test.equal(path,relpath);
  }
);


