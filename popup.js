/**
 * Created by distu on 2016/11/14.
 */
document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('#form');
  var result = document.querySelector('#result');
  var loading = document.querySelector('#loading');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    toggle(loading);
    var key = form['query'].value;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        toggle(loading);
        if (xhr.status === 200) {
          result.innerHTML = render(extractResponse(xhr.responseText));
        }
      }
    };
    xhr.open("GET", form.action + '?q=' + key, true);
    xhr.send();
  }, false);

  form.querySelector('input').addEventListener('input', function (e) {
    form.querySelector('button').disabled = !e.target.value;
  });
}, false);

/**
 * extract json result from response html
 * @param responseText response html from bing dictionary
 * @returns {{word, pronounces, lang}}
 */
function extractResponse(responseText) {
  var temp = document.createElement('div');
  temp.innerHTML = responseText;
  var container = temp.querySelector('.qdef');
  return [extractBasic, extractTranslate].reduce(function (result, current, index) {
    return Object.assign(result, current(container.children[index]));
  }, {});
}

function extractBasic(doc) {
  var word = doc.querySelector('#headword').innerText.trim();
  var hd_p1_1 = doc.querySelector('.hd_p1_1');
  var lang = hd_p1_1.getAttribute('lang');
  var pronounceChildren = hd_p1_1.querySelectorAll('div');
  var pronounces = pronounceChildren.length > 0 ? Array.prototype.reduce.call(pronounceChildren, function (result, current, index) {
    if (index % 2 === 0) {
      result.push([current])
    } else {
      result[result.length - 1].push(current);
    }
    return result;

  }, []).map(function (divs) {
    var pronounce = {
      locale: divs[0].innerText
    };
    return pronounce;
  }) : hd_p1_1.innerText;
  return {
    word: word,
    pronounces: pronounces,
    lang: lang
  };
}

function extractTranslate(doc) {
  return ({
    translates: Array.prototype.map.call(doc.querySelectorAll('li'), function (item) {
      return ({
        pos: item.querySelector('.pos').innerText,
        def: item.querySelector('.def').innerText
      });
    })
  })
}

/**
 * toggle display status of html element
 * @param element html element
 */
function toggle(element) {
  var oldDisplay = element.style.display;
  element.style.display = oldDisplay === 'none' ? 'block' : 'none';
}

function render(translateData) {
  var pronounces = Array.isArray(translateData.pronounces)
    ? translateData.pronounces.map(function (pronounce) {
    return `<li>${pronounce.locale}</li>`;
  }).join(' ') : `<li>${translateData.pronounces}</li>`;
  var translates = translateData.translates.map((item)=> {
    return `<li><strong>${item.pos}</strong> ${item.def}</li>`;
  }).join(' ');
  return (`
    <h1 class="translate__header">${translateData.word}</h1>
    <ul class="translate__pronounces">${pronounces}</ul>
    <ul class="translate__def">${translates}</ul>
  `);
}
