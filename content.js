const selectionChangeHandler = function(interval = 100) {
  let timer = null;
  return () => {
    const selection = document.getSelection();
    if (timer) window.clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      const content = selection.toString().trim();
      if (!content) return;
      chrome.runtime.sendMessage({ word: content }, response => {
        console.log('content:', response);
      });
    }, interval);
  };
};

document.addEventListener('selectionchange', selectionChangeHandler());
