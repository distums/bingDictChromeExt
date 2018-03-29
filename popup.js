document.addEventListener('DOMContentLoaded', function() {
  const formElement = document.querySelector('#form');
  const resultElement = document.querySelector('#result');
  const loadingElement = document.querySelector('#loading');
  const { action: url, method } = formElement;

  formElement.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const { value: query } = formElement.elements['query'];
    compose(
      withLastWordNotModified,
      withLoading,
      generateContent,
      withCache,
      extractResponse
    )(fetchTranslation)(query);
  });

  formElement.elements['query'].addEventListener('input', function(e) {
    formElement.elements['submit'].disabled = !e.target.value;
  });

  /**
   * If the word to be translated is the same as last word, nothing happens.
   *
   * @param {Function} next
   * @returns
   */
  function withLastWordNotModified(next) {
    return word => {
      if (word !== formElement.dataset.lastWord) {
        formElement.dataset.lastWord = word;
        next(word);
      }
    };
  }

  /**
   * Show loading while translating
   *
   * @param {Function} next
   * @returns
   */
  function withLoading(next) {
    return (...args) => {
      toggle(loadingElement);
      return next(...args).then(
        () => {
          toggle(loadingElement);
        },
        () => {
          toggle(loadingElement);
        }
      );
    };
  }

  /**
   * Generate html using extracted translation info.
   *
   * @param {any} next
   * @returns
   */
  function generateContent(next) {
    return (...args) =>
      next(...args).then(translation => {
        console.log(translation);
        resultElement.innerHTML = convertToHtml(translation);
      });
  }

  /**
   * Cache translation history.
   *
   * @param {Function} next
   * @returns
   */
  function withCache(next) {
    const cache = new Map();
    return key => {
      if (cache.has(key)) return Promise.resolve(cache.get(key));
      return Promise.resolve(next(key)).then(resp => {
        cache.set(key, resp);
        return resp;
      });
    };
  }

  /**
   * Extract translation info from response html.
   *
   * @param {Function} next
   * @returns
   */
  function extractResponse(next) {
    return (...args) => {
      return next(...args).then(response => {
        const container = response.querySelector('.qdef');
        return [extractBasic, extractTranslate, extractPluralForm].reduce(
          (result, current, index) =>
            Object.assign(result, current(container.children[index])),
          {}
        );
      });
    };
  }

  /**
   * Get translation from bing site.
   *
   * @param {string} word
   * @returns
   */
  function fetchTranslation(word) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'document';
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.responseXML);
          } else {
            reject(xhr.status);
          }
        }
      };
      xhr.open(method, `${url}?q=${word}`, true);
      xhr.send();
    });
  }
});

function convertToHtml(translation) {
  return `
    <dl>
      <dt>翻译：</dt>
      ${translation.translates
        .map(item => `<dd><strong>${item.pos}：</strong>${item.def}</dd>`)
        .join('\n')}
    </dl>
    <dl>
        <dt>复数：</dt>
        <dd>${translation.plural}</dd>
    </dl>
  `;
}

function compose(...fns) {
  const fnList = fns.filter(fn => typeof fn === 'function');
  if (fnList.length === 0)
    throw new Error(
      'Argument error, at least one `function` should be provided'
    );
  return fnList.reduce((f, g) => (...args) => f(g(...args)));
}

function extractBasic(doc) {
  var word = doc.querySelector('#headword').innerText.trim();
  var hd_p1_1 = doc.querySelector('.hd_p1_1');
  var lang = hd_p1_1.getAttribute('lang');
  var pronounceChildren = hd_p1_1.querySelectorAll('div');
  var pronounces =
    pronounceChildren.length > 0
      ? Array.prototype.reduce
          .call(
            pronounceChildren,
            function(result, current, index) {
              if (index % 2 === 0) {
                result.push([current]);
              } else {
                result[result.length - 1].push(current);
              }
              return result;
            },
            []
          )
          .map(function(divs) {
            var pronounce = {
              locale: divs[0].innerText,
            };
            return pronounce;
          })
      : hd_p1_1.innerText;
  return {
    word,
    pronounces,
    lang,
  };
}

function extractTranslate(doc) {
  return {
    translates: Array.prototype.map.call(doc.querySelectorAll('li'), function(
      item
    ) {
      return {
        pos: item.querySelector('.pos').innerText,
        def: item.querySelector('.def').innerText,
      };
    }),
  };
}

function extractPluralForm(doc) {
  const anchor = doc.querySelector('.hd_div1 .hd_if a');
  return {
    plural: anchor.innerText,
  };
}

/**
 * toggle display status of html element
 * @param element html element
 */
function toggle(element) {
  const oldDisplay = element.style.display;
  element.style.display = oldDisplay === 'none' ? 'block' : 'none';
}
