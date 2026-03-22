const AFFILIATE_LINKS = {
  "invideo-ai": "https://invideo.sjv.io/ZV6MKg",
  "invideo": "https://invideo.sjv.io/ZV6MKg",
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

const OFFICIAL_LINKS = {
  "invideo-ai": "https://invideo.io/",
  "invideo": "https://invideo.io/",
  "heygen": "https://www.heygen.com/",
  "runway": "https://runwayml.com/",
  "luma": "https://lumalabs.ai/dream-machine",
  "pika": "https://pika.art/",
  "capcut": "https://www.capcut.com/",
  "veed": "https://www.veed.io/",
  "synthesia": "https://www.synthesia.io/",
  "colossyan": "https://www.colossyan.com/",
  "kaiber": "https://kaiber.ai/",
  "descript": "https://www.descript.com/",
  "fliki": "https://fliki.ai/"
};

const DISCLOSURE_TEXT =
  "Disclosure: Some outbound links are affiliate links. If you buy through them, we may earn a commission at no extra cost to you.";

const ensureAffiliateDisclosure = () => {
  if (document.getElementById("affiliate-disclosure")) return;

  const disclosure = document.createElement("p");
  disclosure.id = "affiliate-disclosure";
  disclosure.className = "affiliate-disclosure";
  disclosure.textContent = DISCLOSURE_TEXT;
  disclosure.setAttribute("role", "note");

  const footerWrap = document.querySelector(".site-footer .page-wrap");
  const footer = document.querySelector(".site-footer");
  const legacyContainer = document.querySelector(".page");
  const container = footerWrap || footer || legacyContainer || document.body;
  container.appendChild(disclosure);

  if (!footer) {
    disclosure.style.maxWidth = "960px";
    disclosure.style.margin = "16px auto 0";
    disclosure.style.padding = "0 24px 24px";
    disclosure.style.color = "rgba(17, 16, 24, 0.72)";
    disclosure.style.fontSize = "0.85rem";
    disclosure.style.lineHeight = "1.5";
  }
};

const applyAffiliateLinks = () => {
  const links = document.querySelectorAll("a[data-affiliate]");
  links.forEach((link) => {
    const key = link.getAttribute("data-affiliate");
    const affiliateUrl = (AFFILIATE_LINKS[key] || "").trim();
    const officialUrl = (OFFICIAL_LINKS[key] || "").trim();

    if (affiliateUrl.length > 0) {
      link.setAttribute("href", affiliateUrl);
      link.setAttribute("rel", "sponsored nofollow noopener");
      link.setAttribute("target", "_blank");
      link.removeAttribute("aria-disabled");
      return;
    }

    if (officialUrl.length > 0) {
      link.setAttribute("href", officialUrl);
      link.setAttribute("rel", "nofollow noopener");
      link.setAttribute("target", "_blank");
      link.removeAttribute("aria-disabled");
      return;
    }

    link.setAttribute("href", "#");
    link.setAttribute("aria-disabled", "true");
    link.setAttribute("rel", "nofollow noopener");
  });

  ensureAffiliateDisclosure();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyAffiliateLinks);
} else {
  applyAffiliateLinks();
}
