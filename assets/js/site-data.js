/*
 * site-data.js — shared helpers for pages that read content from data/*.xml
 *
 * Every page loads its content (publications, gallery, news...) from an XML file.
 * These helpers make that loading tolerant:
 *   - a missing tag (e.g. no <image>) is treated as empty instead of crashing the page;
 *   - a typo in the XML (e.g. "</url" without ">") shows a readable message on the
 *     page saying which file is broken and where, instead of a blank page.
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Text of the first <tag> inside node, trimmed; "" if the tag is missing. */
  function text(node, tag) {
    const el = node.querySelector(tag);
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  /* Inner markup of <tag> (used for <special_notes>, which may contain links). */
  function html(node, tag) {
    const el = node.querySelector(tag);
    return el ? el.innerHTML.trim() : "";
  }

  /* true for <tag>true</tag>, <tag>yes</tag>, <tag>1</tag> */
  function flag(node, tag) {
    return /^(true|yes|1)$/i.test(text(node, tag));
  }

  /* Fetch + parse an XML file. Rejects with a human-friendly message on failure. */
  function load(path) {
    return fetch(path, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("Could not load " + path + " (HTTP " + r.status + ")");
        return r.text();
      })
      .then(function (str) {
        const xml = new DOMParser().parseFromString(str, "application/xml");
        const err = xml.querySelector("parsererror");
        if (err) {
          const detail = err.textContent.replace(/\s+/g, " ").trim();
          throw new Error(
            "The file " + path + " has a formatting mistake, so this section cannot be shown. " +
            "Usually a tag is not closed properly (for example </url instead of </url>). Details: " + detail
          );
        }
        return xml;
      });
  }

  function showError(container, err) {
    if (!container) return;
    container.innerHTML =
      '<div class="data-error"><i class="bi bi-exclamation-triangle"></i> ' + esc(err.message) + "</div>";
    console.error(err);
  }

  window.SiteData = { esc: esc, text: text, html: html, flag: flag, load: load, showError: showError };
})();
