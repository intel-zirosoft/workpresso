function escapeForTemplateLiteral(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

export function buildInjectedBridgeScript(webBaseOrigin: string) {
  const escapedOrigin = escapeForTemplateLiteral(webBaseOrigin);

  return `
    (function() {
      if (window.WorkPressoMobile && window.WorkPressoMobile.__initialized) {
        return true;
      }

      var INTERNAL_ORIGIN = '${escapedOrigin}';

      function safeParseUrl(url) {
        try {
          return new URL(url, window.location.href);
        } catch {
          return null;
        }
      }

      function isInternalUrl(url) {
        if (!url) {
          return false;
        }

        if (url.indexOf('about:blank') === 0) {
          return true;
        }

        var parsed = safeParseUrl(url);
        return !!parsed && parsed.origin === INTERNAL_ORIGIN;
      }

      function postMessage(type, payload) {
        if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== 'function') {
          return false;
        }

        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
        return true;
      }

      function handleAnchorClick(event) {
        var target = event.target;

        while (target && target.tagName !== 'A') {
          target = target.parentElement;
        }

        if (!target || !target.href) {
          return;
        }

        var targetAttr = (target.getAttribute('target') || '').toLowerCase();
        var shouldExternalize = targetAttr === '_blank' || !isInternalUrl(target.href);

        if (!shouldExternalize) {
          return;
        }

        event.preventDefault();
        postMessage('OPEN_EXTERNAL_URL', { url: target.href });
      }

      var originalWindowOpen = window.open;
      window.open = function(url) {
        if (!url) {
          return null;
        }

        var parsed = safeParseUrl(String(url));
        if (parsed && isInternalUrl(parsed.toString())) {
          window.location.href = parsed.toString();
          return window;
        }

        postMessage('OPEN_EXTERNAL_URL', { url: String(url) });
        return null;
      };

      document.addEventListener('click', handleAnchorClick, true);

      window.WorkPressoMobile = {
        __initialized: true,
        openExternalUrl: function(url) {
          return postMessage('OPEN_EXTERNAL_URL', { url: url });
        },
        getDeviceInfo: function() {
          return postMessage('GET_DEVICE_INFO');
        },
        postMessage: postMessage,
        onNativeMessage: null,
        restoreWindowOpen: function() {
          window.open = originalWindowOpen;
        }
      };

      postMessage('BRIDGE_READY', {
        methods: ['getDeviceInfo', 'openExternalUrl']
      });
      window.dispatchEvent(new CustomEvent('workpresso:bridge-ready'));
      return true;
    })();
    true;
  `;
}
