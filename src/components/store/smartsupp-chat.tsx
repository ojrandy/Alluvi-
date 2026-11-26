import Script from "next/script";

/** Public widget key (it ships to every browser anyway); see ADR-022. */
const SMARTSUPP_KEY = "449ea35190df2cec6f81a5d98d2ffa9d35c2425c";

/**
 * Smartsupp live chat. Storefront only, loaded in browser idle time
 * (`lazyOnload`) so it never competes with LCP or checkout.
 */
export function SmartsuppChat() {
  return (
    <Script id="smartsupp-chat" strategy="lazyOnload">
      {`var _smartsupp = _smartsupp || {};
_smartsupp.key = '${SMARTSUPP_KEY}';
window.smartsupp||(function(d) {
  var s,c,o=smartsupp=function(){ o._.push(arguments)};o._=[];
  s=d.getElementsByTagName('script')[0];c=d.createElement('script');
  c.type='text/javascript';c.charset='utf-8';c.async=true;
  c.src='https://www.smartsuppchat.com/loader.js?';s.parentNode.insertBefore(c,s);
})(document);`}
    </Script>
  );
}
