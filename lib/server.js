import url from "url";
import path from "path";

const FONTS = [".ttf", ".eot", ".otf", ".svg", ".woff", ".woff2"];
const ALLOWED_PROTOCOLS = ["http:", "https:"];

/* stripSlashes
 *
 * Strip the trailing slash from a url
 */
function stripSlashes(url) {
  if (url) {
    return url.replace(/\/$/, "");
  } else {
    return url;
  }
}

/* CdnController
 *
 * Controls the way that the CDN package interacts
 * with the Meteor server
 *
 */
function CdnController() {
  let cdnUrl = stripSlashes(process.env.CDN_URL);
  let rootUrl = stripSlashes(process.env.ROOT_URL);

  this._setRootUrl = function (newRootUrl) {
    // Change the ROOT_URL, for testing purposes
    rootUrl = stripSlashes(newRootUrl);
  };

  this._setCdnUrl = function (newCdnUrl) {
    // Change the CDN Url, for testing purposes
    cdnUrl = stripSlashes(newCdnUrl);
    setClientCdnUrl(cdnUrl);
  };

  function validateSettings(rootUrl, cdnUrl) {
    // Return True if the ROOT_URL and CDN_URL settings are valid
    // Return False if the settings are invalid, but the server can continue
    // Throw an error if the settings are fatally incorrect
    if (!rootUrl) {
      console.log("[CDN] validateSettings() - ROOT_URL is not set. Using default Meteor behaviour");
      return false;
    } else if (!cdnUrl) {
      console.warn("[CDN] validateSettings() - CDN_URL is not set. Using default Meteor behaviour");
      return false;
    }
    const cdn = url.parse(cdnUrl);
    const root = url.parse(rootUrl);

    // Make sure that the CDN_URL is different from the ROOT_URL
    // If these are the same, we can't detect requests from the CDN
    if (cdn.host === root.host) {
      console.warn(
        "[CDN] validateSettings() - CDN: CDN HOST === ROOT HOST. Using default Meteor behaviour"
      );
      return false;
    }

    // Ensure that the CDN_URL and ROOT_URL are correctly formed
    if (ALLOWED_PROTOCOLS.indexOf(root.protocol) < 0) {
      throw new Meteor.Error(
        "ROOT_URL must use http or https protocol, not " + root.protocol
      );
    } else if (ALLOWED_PROTOCOLS.indexOf(cdn.protocol) < 0) {
      throw new Meteor.Error(
        "CDN_URL must use http or https protocol, not " + cdn.protocol
      );
    }

    // Return true if the settings are valid
    return true;
  }

  function setClientCdnUrl(cdnUrl) {
    // Make the CDN_URL available on the client
    // console.log("Setting BundledJsCssPrefix to "+cdnUrl);
    const hasQuestionMark = new RegExp("[?]");
    WebAppInternals.setBundledJsCssUrlRewriteHook(function (url) {
      // This code fixes an issue in Galaxy where you can end up getting served
      // stale code after deployments
      const galaxyVersionId = process.env.GALAXY_APP_VERSION_ID;
      let rewrittenUrl = cdnUrl + url;
      if (galaxyVersionId) {
        const separator = hasQuestionMark.test(url) ? "&" : "?";
        rewrittenUrl += separator + "_g_app_v_=" + galaxyVersionId;
      }
      return rewrittenUrl;
    });
    // WebAppInternals.setBundledJsCssPrefix(cdnUrl);
    __meteor_runtime_config__.CDN_URL = cdnUrl;
  }

  function configureBrowserPolicy(cdnUrl) {
    console.log("[CDN] configureBrowserPolicy() - Attemping to configure BrowserPolicy");
    if (Package["browser-policy"]) {
      BrowserPolicy.content.allowOriginForAll(cdnUrl);
      console.log("[CDN] configureBrowserPolicy() - Configure BrowserPolicy allowOriginForAll(" + cdnUrl + ")");
    }
  }

  function CORSconnectHandler(req, res, next) {
    // Set CORS headers on webfonts to avoid issue with chrome and firefox
    const ext = path.extname(url.parse(req.url).pathname);

    if (FONTS.indexOf(ext) > -1) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=2592000; includeSubDomains"
      ); // 2592000s / 30 days
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    next();
  }

  function static404connectHandler(req, res, next) {
    // Return 404 if a non-existent static file is requested
    // If REQUEST_HOST === CDN_URL then a 404 is returned for all non-static files
    const pathname = url.parse(req.url).pathname;
    const cdn = url.parse(cdnUrl);
    const root = url.parse(rootUrl);

    // const isFromCDN = req.headers.host === cdn.host && req.headers.host !== root.host;
    const isFromCDN = req.headers["user-agent"] === "Amazon CloudFront";

    // Cloudfront removes all headers by default
    // We need the HOST header to determine where this request came from
    const clientArch = Meteor.isCordova
      ? "web.cordova"
      : Meteor.isModern
      ? "web.browser"
      : "web.browser.legacy";

    if (!req.headers.host) {
      console.warn("[CDN] static404connectHandler() - HOST header is not set");
      console.warn("[CDN] static404connectHandler() - Unable to determine if this request came via the CDN");
    } else if (
      isFromCDN &&
      !(pathname in WebAppInternals.staticFilesByArch[clientArch])
    ) {
      console.log("[CDN] static404connectHandler() - serverEnv: ", process.env?.SERVER_ENV, " - cookie: ", req.headers.cookie);
      console.log("[CDN] static404connectHandler() - Static resource not found: " + pathname);
      res.writeHead(404);
      res.write("Static File Not Found");
      res.end();
      return res;
    } else if (isFromCDN) {
      console.log("[CDN] static404connectHandler() - Serving to CDN: " + pathname);
    }
    next();
  }

  // Initialize the CDN
  if (validateSettings(rootUrl, cdnUrl)) {
    setClientCdnUrl(cdnUrl);
    configureBrowserPolicy(cdnUrl);
    WebApp.rawConnectHandlers.use(static404connectHandler);
    WebApp.rawConnectHandlers.use(CORSconnectHandler);
    console.info("[CDN] Using CDN: " + cdnUrl);
  }

  // TODO: Find a way to avoid this
  // Export for testing
  this._validateSettings = validateSettings;
  this._CORSconnectHandler = CORSconnectHandler;
  this._static404connectHandler = static404connectHandler;
}

// Export the CDN object
CDN = {};

// Add CDN_URL available through the CDN object
CDN.get_cdn_url = function () {
  return __meteor_runtime_config__.CDN_URL || "";
};

// Create CDN config object.
// Config object can include the headers object inside which can be used to
// override headers for certain folders or files.
CDN.config = function (config) {
  if (config.headers) {
    WebApp.rawConnectHandlers.use("/", function (req, res, next) {
      for (const path in config.headers) {
        if (config.headers.hasOwnProperty(path)) {
          // If path matches, setup headers for the response
          if (req._parsedUrl.path.startsWith(path)) {
            for (const pathHeaders in config.headers[path]) {
              if (config.headers[path].hasOwnProperty(pathHeaders)) {
                //console.log("Setting header: " + pathHeaders + ": " + config.headers[path][pathHeaders] + " for path: " + req._parsedUrl.path);
                res.setHeader(pathHeaders, config.headers[path][pathHeaders]);
              }
            }
          }
        }
      }
      next();
    });
  }
};

// Add this for testing purposes
CDN._controllerClass = CdnController;

Meteor.startup(function () {
  CDN = new CdnController();
});
