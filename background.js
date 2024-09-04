/**
 * Background script for the Chrome extension.
 * This script creates a context menu option to download the closest audio element to the right-clicked position.
 * It also listens for messages from the content script to download the audio.
 * @author LounisBou
 */

// Create a context menu option when right-clicking on the page
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "downloadAudio",
        title: "Download Closest Audio",
        contexts: ["all"], // Ensure it works for all contexts, including pages
    });
});

// When the context menu is clicked
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "downloadAudio") {
        // First, attempt to inject the content script
        chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["contentScript.js"]
        }, () => {
            // Ask the content script for the click coordinates
            chrome.tabs.sendMessage(tab.id, { action: "getClickCoordinates" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending message to content script:", chrome.runtime.lastError.message);
                    // Send a message to the active tab to notify the user
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: (errorMessage, response) => alert(errorMessage, response),
                        args: ["Failed to get click coordinates. Please try again.", response]
                    });
                    return;
                }
                // Ensure response exists and contains x, y properties
                if (response && typeof response.x !== 'undefined' && typeof response.y !== 'undefined') {
                    const { x, y } = response;
                    // Inject script to find closest audio from click position
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        function: downloadClosestAudioFromClick,
                        args: [x, y]
                    });
                } else {
                    console.error("Invalid response from content script:", response);
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => alert("Failed to get valid click coordinates.")
                    });
                }
            });
        });
    }
});

// Function that gets injected into the page to find and download the closest audio element
function downloadClosestAudioFromClick(x, y) {
    // Get the clicked element from the page
    const clickedElement = document.elementFromPoint(x, y);
    // Check if an element was found at the clicked position
    if (!clickedElement) {
        alert("No element found at the clicked position.");
        return;
    }
    // Function to find the closest audio element to the clicked element
    function getClosestAudioElement(element) {
        if (!element) return null;
        // Chheck if the element is an audio element
        if (element.tagName === 'AUDIO') return element;
        // Check if the element has an audio child
        if (element.querySelector('audio')) return element.querySelector('audio');
        // Check if the element has an audio parent
        if (element.closest('audio')) return element.closest('audio');
        // Recursively check the parent element
        return getClosestAudioElement(element.parentElement);
    }
    // Find the closest audio element to the clicked element
    const closestAudio = getClosestAudioElement(clickedElement);
    // Check if no audio element was found
    if (!closestAudio) {
        alert("No audio element found near the clicked element.");
    }
    // Check if the audio element has a source
    const src = closestAudio.currentSrc || closestAudio.src;
    if (src) {
        alert(`Downloading audio from: ${src}`);
        // Send a message to the background script to download the audio
        chrome.runtime.sendMessage({ audioSrc: src });
    } else {
        alert("No audio source found for the closest audio element.");
    }
}

// Listener for downloading the audio
chrome.runtime.onMessage.addListener((message) => {
    chrome.downloads.download({
        url: message.audioSrc,
        filename: message.audioSrc.split('/').pop()
    });
});
