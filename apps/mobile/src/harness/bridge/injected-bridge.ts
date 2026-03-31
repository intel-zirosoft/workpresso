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

      function buildAbsoluteUrl(url) {
        var parsed = safeParseUrl(url);
        return parsed ? parsed.toString() : String(url || '');
      }

      function reportSessionStatus(kind, payload) {
        postMessage('WEB_SESSION_STATUS', Object.assign({ kind: kind }, payload || {}));
      }

      function reportRouteChange() {
        postMessage('WEB_ROUTE_CHANGED', {
          title: document.title || '',
          url: window.location.href
        });
      }

      function reportAuthRequiredIfNeeded(url, status) {
        var absoluteUrl = buildAbsoluteUrl(url);
        var parsed = safeParseUrl(absoluteUrl);

        if (!parsed || parsed.origin !== INTERNAL_ORIGIN) {
          return;
        }

        if (parsed.pathname === '/login') {
          reportSessionStatus('LOGIN_PAGE', {
            status: status,
            url: absoluteUrl
          });
          return;
        }

        if ((status === 401 || status === 403) && parsed.pathname.indexOf('/api/') === 0) {
          reportSessionStatus('API_UNAUTHORIZED', {
            status: status,
            url: absoluteUrl
          });
        }
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
      var originalFetch = window.fetch ? window.fetch.bind(window) : null;
      var originalXhrOpen = window.XMLHttpRequest && window.XMLHttpRequest.prototype.open;
      var originalXhrSend = window.XMLHttpRequest && window.XMLHttpRequest.prototype.send;
      var originalPushState = window.history && window.history.pushState ? window.history.pushState.bind(window.history) : null;
      var originalReplaceState = window.history && window.history.replaceState ? window.history.replaceState.bind(window.history) : null;
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

      if (originalFetch) {
        window.fetch = function(input, init) {
          var requestUrl = typeof input === 'string'
            ? input
            : input && typeof input === 'object' && 'url' in input
              ? input.url
              : '';

          return originalFetch(input, init).then(function(response) {
            reportAuthRequiredIfNeeded(response.url || requestUrl, response.status);
            return response;
          });
        };
      }

      if (originalXhrOpen && originalXhrSend) {
        window.XMLHttpRequest.prototype.open = function(method, url) {
          this.__workpressoRequestUrl = typeof url === 'string' ? url : '';
          return originalXhrOpen.apply(this, arguments);
        };

        window.XMLHttpRequest.prototype.send = function() {
          this.addEventListener('loadend', function() {
            reportAuthRequiredIfNeeded(this.responseURL || this.__workpressoRequestUrl, this.status);
          });

          return originalXhrSend.apply(this, arguments);
        };
      }

      function reportCurrentLocation() {
        reportRouteChange();
        reportAuthRequiredIfNeeded(window.location.href, 200);
      }

      if (originalPushState) {
        window.history.pushState = function() {
          var result = originalPushState.apply(window.history, arguments);
          reportCurrentLocation();
          return result;
        };
      }

      if (originalReplaceState) {
        window.history.replaceState = function() {
          var result = originalReplaceState.apply(window.history, arguments);
          reportCurrentLocation();
          return result;
        };
      }

      document.addEventListener('click', handleAnchorClick, true);
      window.addEventListener('popstate', reportCurrentLocation);

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
      reportCurrentLocation();
      window.dispatchEvent(new CustomEvent('workpresso:bridge-ready'));
      return true;
    })();
    true;
  `;
}
