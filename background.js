// setup google analytics
_gaq = [];
_gaq.push(['_setAccount', 'UA-89675777-1']);
_gaq.push(['_trackPageview']);

var isDebugOn = false;

/* This script handles the actual boosting of each individual tab
 * Because the background script runs across all tabs it's also responsible 
 * for remembering the state of each tab and correctly base boosting the
 * right tab etc..
 */

// stores the state of all tabs
tabsInfo = {};

// global variables that are just convenience accessors to tabsInfo
savedStream  = null;

tabId   = null;
context = null;
source  = null;
jungle  = null;

biquadFilter      = null;
isBassBoosted     = false;
presetSelected    = "Default";
isJungleConnected = false;
favIconUrl        = null;
title             = null;
customBassGain    = 0;

defaultPitch = 2;
transpose = false;

callback = null;

// bassGain Presets
lowBassGain      = 5;
mediumBassGain   = 10;
highBassGain     = 20;
veryHighBassGain = 30;


windowWidthBeforeFullScreen  = 0;
windowHeightBeforeFullScreen = 0;

bassGain = lowBassGain;

fullScreenEnabled = false;

// Listen to messages
chrome.runtime.onMessage.addListener(function (msg, sender, response) 
{    
    // tab that sent the message
    tabId = msg.tabId;
    
    if(isDebugOn){console.log(msg)};
    
    // sets our global convenience accessors accordingly, these will remain null
    // or be reset to null if the tab is new/hasn't been bass boosted
    setupBassBoostFor(tabId);
    
    if(msg.action === 'bassBoostTab')
    {
        presetSelected = msg.presetSelected;
        if(savedStream != null)
        {
            bassBoost(savedStream, msg.value);
        }
        else
        {
            bassBoostTab(msg.value)
        }
    }
    else if(msg.action === 'removeBassBoost')
    {
        removeBassBoost(savedStream);
    }
    else if(msg.action === 'isBassBoosted')
    {
        getDomInfo(function(domInfo){
            if(isDebugOn){console.log(domInfo)};
            response(domInfo);          
        });
    }
    else if(msg.action === 'fullScreen')
    {
        if(msg.enabled == true)
        {
            chrome.windows.getCurrent(function(window) {
                windowWidthBeforeFullScreen  = window.width;
                windowHeightBeforeFullScreen = window.height;
                chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, {
                    state: "fullscreen"
                }, null);
            });
        }
        else
        {
            var updateInfo = {
                state: 'normal',
                left: 0,
                top: 0,
                width: windowWidthBeforeFullScreen,
                height: windowHeightBeforeFullScreen
            };
            chrome.windows.update(chrome.windows.WINDOW_ID_CURRENT, updateInfo, null);
        }
    }
    else if(msg.action === 'track')
    {
        track(msg.category, msg.event, msg.label);
    }
    else if(msg.action === 'setTheme')
    {
        chrome.storage.sync.set({'theme': msg.theme});
    }
    else if(msg.action === "getTheme")
    {
        chrome.storage.sync.get("theme", function(result){
            var theme = result['theme'];
            response(theme);  
        });
    }
    return true;
});

function bassBoostTab(value)
{
    // We need to get the audio coming from the tab
    chrome.tabs.query({active: true}, 
    function(tab) 
    {
        title      = tab[0].title;
        favIconUrl = tab[0].favIconUrl;
                
        var MediaStreamConstraint = {audio : true};
        chrome.tabCapture.capture(MediaStreamConstraint, 
            function(stream)
            {
                if(savedStream == null && stream != null)
                {
                    savedStream = stream;
                }
                if(savedStream == null)
                {   
                    //alert("No Audio to Bass Boost - please check the following.\n\n1) Is there an extension already capturing the video/audio from this Tab?\nYou can see this by looking for a blue icon in the tab bar (at top of screen). If you see the icon please disable any video/audio recording extensions you may have then try to Bass Boost again.\n\n2) Does this Tab have any audio?\nPlease make sure there is a video/song on the current tab.\n\nIf none of the above worked pleae contact us by clicking \"Report a Bug\"");
                    chrome.runtime.sendMessage({subject: 'No Audio'});

                    track("No Audio to Bass Boost", title, tab[0].url);
                }
                else
                {
                    // bass boost the audio
                    bassBoost(savedStream, value);
                }
            });
    });
}
function bassBoost(stream, value)
{
    setupBassBoost(stream);
    
    adjustFiltersForPreset(presetSelected, value);
    
    isBassBoosted = true;
    
    // update accessors
    saveTabInfo(tabId);
}
function removeBassBoost(stream)
{
    setupBassBoost(stream);
    disconnectJungle();
    
    adjustBiquadFilter(biquadFilter.gain.value, 0, 
        function()
        {
            stream.getTracks()[0].stop();

            isBassBoosted = false;
            savedStream = null;
            source = null;

            // update accessors
            saveTabInfo(tabId);
        });
}
function setupBassBoost(stream)
{
    context = getContext();
    source  = getSource(stream);
    jungle  = getJungle();
    
    biquadFilter = getBiquadFilter();
    biquadFilter.type = "lowshelf";
    biquadFilter.frequency.value = 800;
    
    source.connect(biquadFilter);
    biquadFilter.connect(context.destination);
    source.connect(context.destination);
}
function setupBassBoostFor(tabId)
{
    var info = tabsInfo[tabId];
    if(info == null)
    {
        // clears any settings that may be from another tab
        reset();
        return;
    }
    context           = info["context"];
    source            = info["source"];
    biquadFilter      = info["biquadFilter"];
    isBassBoosted     = info["isBassBoosted"];
    presetSelected    = info["presetSelected"];
    savedStream       = info["savedStream"];
    jungle            = info["jungle"];
    isJungleConnected = info["isJungleConnected"];
    favIconUrl        = info["favIconUrl"];
    title             = info["title"];
    customBassGain    = info["customBassGain"];
}
function saveTabInfo(tabId)
{
    var info = {context : context, source : source, biquadFilter : biquadFilter, 
                isBassBoosted : isBassBoosted, presetSelected : presetSelected, 
                jungle: jungle, isJungleConnected: isJungleConnected, customBassGain: customBassGain,
                savedStream : savedStream, favIconUrl: favIconUrl, title: title};
    
    tabsInfo[tabId] = info;
}
function reset()
{
    context           = null;
    source            = null;
    biquadFilter      = null;
    jungle            = null;
    isBassBoosted     = false;
    presetSelected    = "Default";
    savedStream       = null;
    isJungleConnected = false;
    favIconUrl        = null;
    title             = null;
    customBassGain    = 0;
}
function adjustFiltersForPreset(presetSelected, value)
{
    switch(presetSelected){
        case "Default":
            disconnectJungle();
            bassGain = lowBassGain;
        break;
        case "High":
            disconnectJungle();
            bassGain = mediumBassGain
        break;
        case "Very High":
            disconnectJungle();
            bassGain = highBassGain;
        break;
        case "Insane":
            disconnectJungle();
            bassGain = veryHighBassGain;
        break;
        case "Chipmunks":
            bassGain = lowBassGain
            connectJungle();
            jungle.setPitchOffset(2, transpose);
        break;
        case "Custom":
            disconnectJungle();
            bassGain = value;
            
            customBassGain = value;
        break;
        default:
            // No matching preset adjust for Music
            adjustFiltersForPreset("Default");
        break;
    }
    adjustBiquadFilter(biquadFilter.gain.value, bassGain);
}
function adjustBiquadFilter(fromValue, toValue, optionalCallback)
{
    var nextValue =  0;
    if(fromValue < toValue)
    {
        nextValue = fromValue + 1;
    }
    else
    {
        nextValue = fromValue - 1;
    }
    
    setTimeout(function () 
    {
        biquadFilter.gain.value = nextValue;
        if(nextValue != toValue)
        {
            adjustBiquadFilter(nextValue, toValue, optionalCallback);
        }
        else
        {
            if(optionalCallback)
            {
                optionalCallback();
            }
        }
    }, 25);
}
function getContext()
{
    if(context == null)
    {
        context = new (window.AudioContext || window.webkitAudioContext)();
    }
    return context;
}
function getSource(stream)
{
    if(source == null)
    {
        source = context.createMediaStreamSource(stream);
    }
    return source;
}
function getJungle()
{
    if(jungle == null)
    {
        jungle = new Jungle(context);
    }
    return jungle;
}

function connectJungle()
{
    source.disconnect(biquadFilter)
    source.disconnect(context.destination);
    source.connect(jungle.input);
    jungle.output.connect(biquadFilter);
    jungle.setPitchOffset(defaultPitch, transpose);
    
    isJungleConnected = true;
}
function disconnectJungle()
{
    if(isJungleConnected)
    {
        jungle.output.disconnect(biquadFilter);
    }

    source.connect(biquadFilter);
    biquadFilter.connect(context.destination);
    isJungleConnected = false;
}
function getBiquadFilter()
{
    if(biquadFilter == null)
    {
        biquadFilter = getContext().createBiquadFilter();
    }
    return biquadFilter;
}
function getDomInfo(callback)
{
    chrome.tabs.query({active: true, currentWindow: true}, 
    function(tab) 
    {
        title      = tab[0].title;
        favIconUrl = tab[0].favIconUrl;
        var domInfo = 
        {
            isBassBoostEnabled: isBassBoosted,
            presetSelected:     presetSelected,
            customBassGain:     customBassGain,
            title:              title,
            favIconUrl:         favIconUrl
        }; 
        callback(domInfo);
    });
}
chrome.tabs.onRemoved.addListener(function(tabid, removed) {
    // clean up
    setupBassBoostFor(tabid);
    reset();
    delete tabsInfo[tabid];
    //stream.getAudioTracks()[0].stop();
})
chrome.runtime.onInstalled.addListener(function(){
    var userId = generateUUID();
    var installDate = new Date().getTime();
    
    var userData = {userId : userId, installDate : installDate, events : []};
    chrome.storage.sync.set({'userData': userData});
    
    _gaq.push(['_trackEvent', "Install", "user: "+userId, "installDate: "+installDate]);
});
function track(category, event, label)
{
    if(isDebugOn)
    {
        console.log("category: "+category+"  event: "+event+"  label: "+label);
        return;
    }
    chrome.storage.sync.get("userData", function(result){
        var userData    = result['userData'];
        var userId      = userData.userId;
        var installDate = userData.installDate;
        
        // we stuff the userId into where the label normally goes so we'll
        // have to concatenate the event and label together if there is a label
        if(label != null)
        {
            event = "event: "+event +" label: "+label;
        }
        _gaq.push(['_trackEvent', category, event, "userId: "+userId]);
    });
}
function generateUUID(){
    var d = new Date().getTime();
    if(window.performance && typeof window.performance.now === "function"){
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}
function getLength(dictionary)
{
    return Object.keys(dictionary).length
}
(function() {
  var ga = document.createElement('script'); 
  ga.type = 'text/javascript'; 
  ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; 
  s.parentNode.insertBefore(ga, s);
})();