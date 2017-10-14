fullScreenEnabled = false;

// Note that the API is still vendor-prefixed in browsers implementing it
document.addEventListener("webkitfullscreenchange", function( event ) {
    // The event object doesn't carry information about the fullscreen state of the browser,
    // but it is possible to retrieve it through the fullscreen API
    if ( document.fullscreen ) {
        
        // The target of the event is always the document,
        // but it is possible to retrieve the fullscreen element through the API
        document.fullscreenElement;
    }
    fullScreen(!fullScreenEnabled);
    fullScreenEnabled = !fullScreenEnabled;
});
function fullScreen(enabled)
{
    chrome.runtime.sendMessage({
        action: "fullScreen",
        enabled: enabled
    }, null);
}