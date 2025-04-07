/**
 * Cloud CDN Function for CORS and Cache Control
 * 
 * This function adds CORS headers to all responses and sets cache control
 * headers based on the file type.
 */
function handler(event) {
  var response = event.response;
  var headers = response.headers;
  
  // Set CORS headers
  headers['access-control-allow-origin'] = { value: '*' };
  headers['access-control-allow-methods'] = { value: 'GET, HEAD, OPTIONS' };
  headers['access-control-max-age'] = { value: '86400' };
  
  // Set cache control headers based on file type
  var uri = event.request.uri;
  
  // Images: long cache (1 year)
  if (uri.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)) {
    headers['cache-control'] = { value: 'public, max-age=31536000, immutable' };
  } 
  // JS/CSS: moderate cache (1 day)
  else if (uri.match(/\.(js|css)$/i)) {
    headers['cache-control'] = { value: 'public, max-age=86400' };
  }
  // Fonts: long cache (1 year)
  else if (uri.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
    headers['cache-control'] = { value: 'public, max-age=31536000, immutable' };
  }
  // HTML and other files: short cache (1 hour)
  else {
    headers['cache-control'] = { value: 'public, max-age=3600' };
  }
  
  // Add security headers
  headers['strict-transport-security'] = { value: 'max-age=31536000; includeSubDomains; preload' };
  headers['x-content-type-options'] = { value: 'nosniff' };
  headers['x-frame-options'] = { value: 'DENY' };
  headers['x-xss-protection'] = { value: '1; mode=block' };
  
  return response;
}