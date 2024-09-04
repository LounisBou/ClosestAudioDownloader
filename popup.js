document.getElementById("downloadAudio").addEventListener("click", () => {
    // Communicate with the background script to download the closest audio
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: downloadClosestAudio
      });
    });
  });
  
  // This function is injected into the current tab to find the closest audio
  function downloadClosestAudio() {
    const audioElements = document.getElementsByTagName('audio');
    if (audioElements.length === 0) {
      alert('No audio found on this page.');
      return;
    }
  
    let shortestAudio = audioElements[0];
    for (let i = 1; i < audioElements.length; i++) {
      if (audioElements[i].duration < shortestAudio.duration) {
        shortestAudio = audioElements[i];
      }
    }
  
    const src = shortestAudio.currentSrc || shortestAudio.src;
    if (src) {
      chrome.runtime.sendMessage({ audioSrc: src });
    } else {
      alert('No audio source found.');
    }
  }
  