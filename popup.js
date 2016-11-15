/**
 * Created by distu on 2016/11/14.
 */
document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('#form');
  var result = document.querySelector('#result');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    var key = form['query'].value;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        result.innerText = JSON.stringify(extractResponse(xhr.responseText));
      }
    };
    xhr.open("GET", form.action + '?q=' + key, true);
    xhr.send();
  }, false);

  form.querySelector('input').addEventListener('input',function (e) {
    form.querySelector('button').disabled = !e.target.value;
  });
}, false);

function extractResponse(responseText) {
  var temp = document.createElement('div');
  temp.innerHTML = responseText;
  var container = temp.querySelector('.qdef');
  var basic = extractBasic(container.children[0]);
  var translate = extractTranslate(container.children[1]);
  return [basic, translate].reduce(function (prev, current) {
    return Object.assign(prev, current);
  });
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
