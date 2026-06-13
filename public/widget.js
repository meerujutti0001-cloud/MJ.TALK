(function () {
  "use strict";

  var config = window.SupportAIConfig || {};
  var chatbotId = config.chatbotId;
  var apiUrl = (config.apiUrl || "").replace(/\/$/, "");

  if (!chatbotId) {
    console.error("[SupportAI] chatbotId is required in window.SupportAIConfig");
    return;
  }

  // Prevent duplicate injection
  if (document.getElementById("supportai-widget-iframe")) return;

  // Inject iframe styles
  var style = document.createElement("style");
  style.textContent = [
    "#supportai-widget-iframe {",
    "  border: none;",
    "  width: 420px;",
    "  height: 640px;",
    "  position: fixed;",
    "  bottom: 0;",
    "  right: 0;",
    "  z-index: 2147483647;",
    "  background: transparent;",
    "  pointer-events: all;",
    "}",
    "@media (max-width: 480px) {",
    "  #supportai-widget-iframe {",
    "    width: 100vw;",
    "    height: 100dvh;",
    "    right: 0;",
    "    bottom: 0;",
    "  }",
    "}",
  ].join("\n");
  document.head.appendChild(style);

  // Create and append the iframe
  var iframe = document.createElement("iframe");
  iframe.id = "supportai-widget-iframe";
  iframe.src = apiUrl + "/widget/" + encodeURIComponent(chatbotId);
  iframe.setAttribute("title", "Support Chat");
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("aria-label", "Support Chat Widget");
  document.body.appendChild(iframe);

  // Public JS API for host page
  window.SupportAI = {
    open: function () {
      iframe.contentWindow && iframe.contentWindow.postMessage({ type: "SUPPORTAI_OPEN" }, "*");
    },
    close: function () {
      iframe.contentWindow && iframe.contentWindow.postMessage({ type: "SUPPORTAI_CLOSE" }, "*");
    },
  };
})();
