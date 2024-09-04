/**
 * This script is injected into the active tab when the extension is clicked.
 * It listens for the right-click event and captures the click coordinates.
 * It then sends the coordinates back to the background script.
 * @author LounisBou
 */
// Ensure the variable is not globally redeclared
if (typeof window.contentScriptHasRun === 'undefined') {
    // Set the variable to prevent redeclaration
    let clickX = 0;
    let clickY = 0;

    // Listen for the right-click event and capture coordinates
    document.addEventListener('contextmenu', function (event) {
        clickX = event.clientX;
        clickY = event.clientY;
    }, true);

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Action to get the click coordinates
        if (request.action === "getClickCoordinates") {
            // Send the click coordinates back to the background script
            sendResponse({ x: clickX, y: clickY });
        }
    });

    // Prevent the script from running multiple times
    window.contentScriptHasRun = true;
}