const AFFILIATE_LINKS = {
  "invideo-ai": "",
  "invideo": "",
  "heygen": "",
  "runway": "",
  "luma": "",
  "pika": "",
  "capcut": "",
  "veed": "",
  "synthesia": "",
  "colossyan": "",
  "kaiber": "",
  "descript": "",
  "fliki": ""
};

const applyAffiliateLinks = () => {
  const links = document.querySelectorAll("a[data-affiliate]");
  links.forEach((link) => {
    const key = link.getAttribute("data-affiliate");
    const url = AFFILIATE_LINKS[key];
    if (url && typeof url === "string" && url.trim().length > 0) {
      link.setAttribute("href", url.trim());
      link.setAttribute("rel", "sponsored nofollow noopener");
      link.removeAttribute("aria-disabled");
    } else {
      link.setAttribute("href", "#");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("rel", "nofollow noopener");
    }
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyAffiliateLinks);
} else {
  applyAffiliateLinks();
}
