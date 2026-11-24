export type Lang = "en" | "pt";
export const LANG_COOKIE = "alluvi_lang";

/**
 * Runs in <head> before first paint (root layout). Applies `?lang=pt|en` (and remembers it) or the
 * saved cookie by setting <html data-lang="pt" lang="pt-BR">. /admin always stays English.
 */
export const LANG_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;if(location.pathname.indexOf("/admin")===0)return;var q=new URLSearchParams(location.search).get("lang");var l;if(q==="pt"||q==="en"){l=q;document.cookie="${LANG_COOKIE}="+q+"; path=/; max-age=31536000; samesite=lax"}else{var m=document.cookie.match(/(?:^|; )${LANG_COOKIE}=(pt|en)/);l=m&&m[1]}if(l==="pt"){d.dataset.lang="pt";d.lang="pt-BR"}}catch(e){}})();`;
