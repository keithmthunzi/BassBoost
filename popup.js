
var shouldAutoBassBoost = true;
var mainContentHTML = "";

var entryQuestionButtonId       = "entryButton";
var tabCapturedButtonId         = "tabCaptured";
var tabNotCaptureButtonId       = "tabNotCaptured";
var tabHasAudioButtonId         = "tabHasAudio";
var tabHasNoAudioButtonId       = "tabHasNoAudio";
var manageExtensionsButtonId    = "manageExtensions";
var updateChromeButtonId        = "updateChrome"
var reinstallBassBoostButtonId  = "reinstallBassBoost"
var testVideoButtonId           = "testVideo"


var favIconUrl = "";
var tabTitle = "";

(function() {
    var ga = document.createElement('script'); 
    ga.type = 'text/javascript'; 
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; 
    s.parentNode.insertBefore(ga, s);
})();

// Update the relevant fields with the new data
function setDOMInfo(info) {
    if(info == null || info["isBassBoostEnabled"] == null)
    {
        $(".selected").text("Default");
        return;
    }
    document.getElementById("bassBoostCheckbox").checked = info["isBassBoostEnabled"];
    
    tabTitle = info["title"];
    favIconUrl =  info["favIconUrl"];
    var presetSelected = info["presetSelected"];
    $(".selected").text(presetSelected);
    $("#tabTitle").text(info["title"]);
    $("#tabTitle").attr('title', tabTitle);
    $("#favIcon").attr("src", favIconUrl);
    
    document.getElementById("bassSlider").value = info['customBassGain'];
    document.getElementById("bassSliderValue").innerHTML = info['customBassGain'];
    
    if(presetSelected === "Custom")
    {
        $("#bassSliderContainer").show();
        /*$ancho       = $element.width();
        $color       = '#bb0000';
        $valor       = info['customBassGain'];
        $nuevoancho  = ($valor*$ancho)/40;
        $('#slider').css({'width':$nuevoancho,'box-shadow':'0 0 '+$valor/2+'px '+$color});*/
    }
}
$(document).ready(function() {
    enableSelectBoxes();
    getTheme();
    //addAd();
    //addGlowToSlider();
    
    chrome.extension.onMessage.addListener(function(message, sender, response) {
        if(message.subject === "No Audio"){
            setNoAudioFound();
        }
    });
    // ...query for the active tab...
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, 
    function (tabs) 
    {
        var tabId = tabs[0].id;
        var bassBoostCheckBox =  $('#bassBoostCheckbox');
        var presetSelector = $('select[name=presetSelector]');
        var bassSlider = document.getElementById("bassSlider");

        chrome.runtime.sendMessage({
                action: "isBassBoosted",
                tabId: tabId
            }, 
            function(domInfo){
                setDOMInfo(domInfo);

                if(shouldAutoBassBoost){
                    autoBassBoost();
                }
            });
        $("#boostEnabledTitle").on("click", function()
        {
            var checkBox = document.getElementById("bassBoostCheckbox");
            checkBox.checked = ! checkBox.checked;
            var checked = checkBox.checked ? 'On' : 'Off';

            // triggering click fires another track event which can mess up the tab id's so we have
            // to track that the text was clicked first before triggering checkbox
            track("Bass Boost Text Clicked", "Turned "+checked);    

            bassBoostCheckBox.triggerHandler( "click" );

            // unforunately this doesnt work
            //bassBoostCheckBox.click();
        });
        // list for toggles
        bassBoostCheckBox.click(function()
        {
            var shouldBoostBass = bassBoostCheckBox.is(':checked');
            console.log(shouldBoostBass);
            var state = (shouldBoostBass) ? "on" : "off"

            track("Bass Boost", "Turned "+state);                   

            var presetSelected = $('.selected').text();

            if(shouldBoostBass)
            {
                boostBass(presetSelected, tabId, bassSlider.value);
            }
            else
            {
                removeBassBoost(tabId);
            }
        });

        $('li').click(function(e){
            var presetSelected = $(this).text();
            track("Preset Selected", presetSelected);                   

            if(presetSelected === "Custom")
            {
                $("#bassSliderContainer").show();
            }
            else
            {
                $("#bassSliderContainer").hide();
            }

            if(document.getElementById("bassBoostCheckbox").checked == false)
            {
                $("#boostEnabledTitle").fadeToggle("fast").fadeToggle("fast").fadeToggle("fast").fadeToggle("fast");
                return;
            }
            boostBass(presetSelected, tabId, bassSlider.value);
        });

        $('input[type="radio"]').on('click', function(e) 
        {
            var light = document.getElementById("lightSegment");
            var theme = "Dark";

            if(light.checked)
            {
                theme = "Light";
            }

            setTheme(theme);
            saveAsPreferredTheme(theme);
            track("Theme Selected", theme);                   
        });

        $("#bassSlider").on('input change', function() {
            var bassGain = this.value;
            document.getElementById("bassSliderValue").innerHTML = bassGain;

            if(document.getElementById("bassBoostCheckbox").checked == false)
            {
                //$("#boostEnabledTitle").stop(true, true).fadeOut("fast").fadeIn("fast");
                return;
            }
            boostBass("Custom", tabId, bassGain)
        });
    });
    function autoBassBoost(){

        var checkBox = document.getElementById("bassBoostCheckbox");

        if(checkBox.checked){
            console.log("exited")
            return;
        }
        checkBox.checked = true;
        // triggering click fires another track event which can mess up the tab id's so we have
        // to track that the text was clicked first before triggering checkbox
        track("Bass Boost", "Auto Turned On");    

        $('#bassBoostCheckbox').triggerHandler( "click" );
                    console.log("triggered")
    }
    function getTheme()
    {
        chrome.runtime.sendMessage({
            action: "getTheme",
        }, 
        function(theme){
            setTheme(theme);
        });
    }
    function setTheme(theme)
    {
        switch(theme)
        {
            case "Light":   
                var color = "rgba(250,250,250,1)";
                document.body.style.backgroundColor = "rgba(250,250,250,0.3)";
                setDropDownColor('rgba(255,255,255,1)');
                setDropdownItemsColor(color);
                setTabTitleColor("rgba(0,0,0,1)");

                document.getElementById("darkSegment").checked  = false;
                document.getElementById("lightSegment").checked = true;

                $("#bassSlider").css("background", "#e1e1e1");

                //$('#shareButtons').css('opacity','1');
                break;
            case "Dark":
                var color = "rgba(50,50,50,1)";
                document.body.style.backgroundColor = color;
                setDropDownColor("rgba(80,80,80,1)");
                setDropdownItemsColor(color);
                setTabTitleColor("rgba(170,170,170,1)");

                document.getElementById("darkSegment").checked  = true;
                document.getElementById("lightSegment").checked = false;

                $("#bassSlider").css("background", "#666");

                //$('#shareButtons').css('opacity','0.7');
                break;
            default:
                setTheme("Light");
                return;
        }
    }
    function setDropdownItemsColor(color)
    {
        $('div.selectBox').each(function()
        {      
            $(this).children('span.selected,span.selectArrow').click(function()
            {
                 $(this).parent().children('ul.selectOptions').css('background-color',color);
            });
        });
    }
    function setDropDownColor(color)
    {
        $('span.selected').css('background-color',color);
    }
    function setTabTitleColor(color)
    {
        $('#tabTitle').css('color',color);
    }
    function saveAsPreferredTheme(theme)
    {
        chrome.runtime.sendMessage({
            action: "setTheme",
            theme: theme
        }, null);
    }
    // value need not be set unless preset is cutom
    function boostBass(presetSelected, tabId, value)
    {
        chrome.runtime.sendMessage({
            action: "bassBoostTab",
            presetSelected: presetSelected,
            value: value,
            tabId: tabId
        }, null);
    }
    function removeBassBoost(tabId)
    {
        chrome.runtime.sendMessage({
            action: "removeBassBoost",
            tabId: tabId
        }, null);
    }
    function track(category, event, label)
    {
        chrome.runtime.sendMessage({
            action: "track",
            category: category,
            event: event,
            label: label
        });
    }
    function enableSelectBoxes()
    {
        $('div.selectBox').each(function()
        {
            $(this).children('span.selected').html($(this).children('ul.selectOptions').children('li.selectOption:first').html());
            $('input.presetSelected').attr('value',$(this).children('ul.selectOptions').children('li.selectOption:first').attr('data-value'));

            $(this).children('span.selected,span.selectArrow').click(function()
            {
                if($(this).parent().children('ul.selectOptions').css('display') == 'none'){
                    $(this).parent().children('ul.selectOptions').css('display','block');
                }
                else
                {
                    $(this).parent().children('ul.selectOptions').css('display','none');
                }
            });

            $(this).find('li.selectOption').click(function()
            {
                $(this).parent().css('display','none');
                                        $('input.presetSelected').attr('value',$(this).attr('data-value'));
                $(this).parent().siblings('span.selected').html($(this).html());
            });
        });	
    }
    function addGlowToSlider(){
        $element  = $('input[type="range"]');
        $ancho    = $element.width();
        $alto     = $element.height();
        $radius   = $element.css('border-radius');
        $color    = '#bb0000';
        $element.wrap('<div style="float:left;width:'+$ancho+'px;margin:0 auto;position:relative;">').after('<span id="slider" style="position:absolute;top:25;max-wdith:180px;left:0;height:'+$alto+'px;border-radius:'+$radius+';background-color:'+$color+';">');
        $valor       = $element.val();
        $nuevoancho  = ($valor*$ancho)/40;
        $('#slider').css({'width':$nuevoancho,'box-shadow':'0 0 '+$valor/2+'px '+$color});
        $element.bind('change, input', function(){
            $valor       = $(this).val();
            $nuevoancho  = ($valor*$ancho)/40;
            $('#slider').css({'width':$nuevoancho,'box-shadow':'0 0 '+$valor/2+'px '+$color});
        });
    } 
    function addAd() {
        var ad = document.getElementById("ad");
        var adContainer = document.getElementById("adContainer");

        ad.innerHTML = getRandomAffiliateAd();
        $(adContainer).show();
        track("Ad Shown", ad.firstChild.id, "Amazon Affiliate Banner");
        ad.firstChild.addEventListener("click", function()
        {
            track("Ad Clicked", ad.firstChild.id, "Amazon Affiliate Banner");
        });
    }
    function getRandomAffiliateAd()
    {
        var saveOnCDs = "<a target='_blank' id='saveOnCDs' href='https://www.amazon.com/b?node=5174&tag=snappye-20&camp=15385&creative=332397&linkCode=ur1&adid=1Q2X2J5607PRCJ7DWX64&'><image width='200' height='167' src='https://images-na.ssl-images-amazon.com/images/G/01/img09/associates/square-btn/music_square-button.gif' border='0'/></a>";

        var djHeadphones = "<a target='_blank' id='djHeadphones' href='https://www.amazon.com/b/ref=as_acph_mib_prodj_615_on?ie=UTF8&node=6466980011&tag=snappye-20&camp=217945&creative=410397&linkCode=ur1&adid=03X6MDF2KVNMN616PWZ5&'><image width='200' height='167' src='https://images-na.ssl-images-amazon.com/images/G/01/img13/musical-instruments/associate/mi_pro_dj_heaphones_125x125.gif' border='0'/></a>";

        /*var sonyHeadPhones = "<iframe style='width:120px;height:240px;' marginwidth='0' marginheight='0' scrolling='no frameborder='0' src='https://ws-na.amazon-adsystem.com/widgets/q?ServiceVersion=20070822&OneJS=1&Operation=GetAdHtml&MarketPlace=US&source=ac&ref=tf_til&ad_type=product_link&tracking_id=snappye-20&marketplace=amazon&region=US&placement=B00MCHE38O&asins=B00MCHE38O&linkId=a541db25d5ed82df94429e85538eedcb&show_border=false&link_opens_in_new_window=false&price_color=333333&title_color=bb0000&bg_color=ffffff'></iframe>"; */

        var soundBars = "<a target='_blank' id='soundBars' href='https://www.amazon.com/b/ref=s9_acsd_al_bw_hr_testCHAN_2_cta?_encoding=UTF8&node=3237803011&pf_rd_m=ATVPDKIKX0DER&pf_rd_s=merchandised-search-3&pf_rd_r=1XX1GZ05HQ6BG3MW5EA5&pf_rd_t=101&pf_rd_p=2057181682&pf_rd_i=667846011&tag=snappye-20&camp=213225&creative=421517&linkCode=ur1&adid=00N3GH80HTTARQS480W2&'><image width='200' height='167' src='https://images-na.ssl-images-amazon.com/images/G/01/img13/mobile/email/soundbar_assoc_300x250.png' border='0'/></a>";

        var premiumHomeAudio = "<a target='_blank' id='premiumHomeAudio' href='https://www.amazon.com/b/ref=s9_acsd_al_bw_hr_testCHAN_2_cta?_encoding=UTF8&node=3237803011&pf_rd_m=ATVPDKIKX0DER&pf_rd_s=merchandised-search-3&pf_rd_r=1XX1GZ05HQ6BG3MW5EA5&pf_rd_t=101&pf_rd_p=2057181682&pf_rd_i=667846011&tag=snappye-20&camp=213225&creative=421517&linkCode=ur1&adid=0AC2G76PQ5ABXFHMXN4S&'><image width='200' height='167' src='https://images-na.ssl-images-amazon.com/images/G/01/img15/consumer-electronics/associate/27284_us_electronics_associates_300x250.jpg' border='0'/></a>";

        var amazonMP3 = "<a target='_blank' id='amazonMP3' href='https://www.amazon.com/b?node=678551011&tag=snappye-20&camp=213573&creative=392629&linkCode=ur1&adid=1VQCG2YB27PB653A56NR&'><image width='200' height='167' src='https://images-na.ssl-images-amazon.com/images/G/01/digital/music/associates/banners/may-2009/free-songs-and-deals-300._V204838852_.gif' border='0'/></a>";

        var amazonMusic = "<a target='_blank' id='amazonMusic' href='https://www.amazon.com/gp/dmusic/promotions/AmazonMusicUnlimited?&tag=snappye-20&camp=228773&creative=536269&linkCode=ur1&adid=04YZ2C61FGV5FZ582V75&'><image width='200' height='167' src='https://images-na.ssl-images-amazon.com/images/G/01/digital/music/merch/2016/Other/HF/CreativeRefresh/HF-refresh_c3_300x250.jpg' border='0'/></a>"

        var amazonMusicCollection = "<a target='_blank' id='amazonMusicCollection' href='https://www.amazon.com/?tag=snappye-20&camp=1&creative=4281&linkCode=ur1'><image width='200' height='167' src='https://images-na.ssl-images-amazon.com/images/G/01/rcm/300x250.gif' border='0'/></a>"


        var ads = [saveOnCDs, djHeadphones, soundBars, premiumHomeAudio, amazonMP3, amazonMusic, amazonMusicCollection];

        var random = Math.floor(Math.random() * ads.length);

        return ads[random];
    }
    function setNoAudioFound(){
        var mainContent = document.getElementById("mainContent");
        mainContentHTML = mainContent.innerHTML;

        setQuestion(0);
    }
    function getQuestion(number){
        var nextQuestionNumber = number + 1;
        if(number == 0){
            return getEntryQuestion(nextQuestionNumber);
        }
        else if(number == 1){
            return getIsTabCapturedQuestion(nextQuestionNumber);
        }
        else if(number == 2){
            return getDisableMediaExtensions();
        }
        else if(number == 3){
            return getTabHasAudioQuestion();
        }
        else if(number == 4){
            return getReportBug();
        }
        else if(number == 5){
            return getGoToTabWithAudio();
        }
    }
    function setQuestion(number){
                    console.log("setContent");

        var html = ""
        if(number == 0){
            html = getEntryQuestion(1);
        }
        else{
            html = getQuestion(number)
        }
        var mainContent = document.getElementById("mainContent");
        html = "<div style='font-weight: 200; color: #999;'>"+html+"</div>";
        mainContent.innerHTML = html;
    }
    function getEntryQuestion(nextQuestionNumber){
        var buttonId = "entryQuestionButton";
        var entryQuestionHTML = "<h3>Uh oh!</h3>"+
                                "<h4>No audio was found on this tab. no worries though we can fix it.<br/><br/>We just need to find out whats causing it first<h4>"+
                                "<div style='margin: 0 auto; width:  50%'>"+
                                "<button id='"+buttonId+"' type='button' style='width:100%;'>Ok</button>"+
                                "</div>"
        $("#"+buttonId).click(function(){
            setQuestion(nextQuestionNumber);
            console.log("here");
        });
        return entryQuestionHTML;
    }
    function getIsTabCapturedQuestion(nextQuestionNumber){
        console.log("here");
        var noButtonId = tabNotCaptureButtonId;
        var yesButtonId = tabCapturedButtonId;
        
        var tabCapturedLook =   "<div id='trapezoid' style='margin: 0 auto;'>"+
                                    "<img src='"+favIconUrl+"' height='25px' width='25px' style='float:left'>"+
                                    "<h3 style='float:left; margin: 4px; margin-left: 5%; max-height: 25px; width: 95px; max-width:95px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: 200; color: black;'>"+tabTitle+"</h3>"+
                                    "<img src='/tabCaptureSymbol.png' height='15px' width='25px'  style='float:left; margin-top:5px'>"+
                                    "<img src='x.png' height='15px' width='20px' style='float:right; margin-top:5px'>"+
                                    "<div style='clear: both'></div>"+
                                "</div>";
        
        var tabCapturedQuestion =   "<h3>Do you see a blue icon beside this tabs title?</h3>"+tabCapturedLook+
                                    "<h4>it should look something like the above picture</h4>"+
                                    "<div style='margin: 0 auto; width: 80%;'>"+
                                        "<button id='"+noButtonId+"' type='button' style='width:40%; margin-right: 20px'>No</button><button id='"+yesButtonId+"' type='button' style='width:40%;'>Yes</button>"+
                                    "</div>"
        return tabCapturedQuestion;
    }
    function getDisableMediaExtensions(){
        var tabCapturedHelp =   "<h3>Great we've found the problem!</h3>"+
                                "<h4>There's another extension using the media/audio from this tab. This means we can't Bass Boost it.<br/><br/>To fix this click the Manage Extensions button and disable any media or audio/video capturing extensions and try Bass Boost again.</h4>"+
                                "<div style='margin: 0 auto; width:  80%'>"+
                                "<button id='"+manageExtensionsButtonId+"' type='button' style='width:100%;'>Manage Extensions</button>"+
                                "</div>";
        return tabCapturedHelp;
    }
    function getGoToTabWithAudio(){
        var enableOnTabWithAudio =  "<h3>Great we've found the problem!</h3>"+
                                    "<h4>There's no audio/video on this tab.<br/><br/>Make sure you enable Bass Boost on a Tab with the audio/video you want to boost. Watch our quick tutorial on how to use Bass Boost.</h4>"+
                                    "<div style='margin: 0 auto; width:  80%'>"+
                                        "<button id='"+testVideoButtonId+"' type='button' style='width:100%;'>Tutorial</button>"+
                                    "</div>";
        return enableOnTabWithAudio;
    }
    function getReportBug(){
        var reportBugHelp =   "<h3>Hmmm, that's very strange</h3>"+
                                "<h4>There are a couple things we can try to fix this.</h4>"+
                                "<div style='margin: 0 auto; width:  80%'>"+
                                    "<button id='"+updateChromeButtonId+"' type='button' style='width:100%;'>Update Chrome</button>"+
                                "</div>"+
                                "<div style='margin: 0 auto; width:  80%'>"+
                                    "<button id='"+reinstallBassBoostButtonId+"' type='button' style='width:100%;'>Update Bass boost</button>"+
                                "</div>"+
                                "<div style='margin: 0 auto; width:  80%'>"+
                                    "<button id='"+testVideoButtonId+"' type='button' style='width:100%;'>Tutorial</button>"+
                                "</div>"+
                                "<h4>If none of the above work please report this as a bug</h4>"+
                                "<div style='margin: 0 auto; width:  80%'>"+
                                    "<button id='reportBug' type='button' style='width:100%;'>Report Bug</button>"+
                                "</div>";
        return reportBugHelp;
    }
    function getTabHasAudioQuestion(){
        var noButtonId = tabHasNoAudioButtonId;
        var yesButtonId = tabHasAudioButtonId
        
        var tabCapturedLook =   "<div id='trapezoid' style='margin: 0 auto;'>"+
                                    "<img src='"+favIconUrl+"' height='25px' width='25px' style='float:left'>"+
                                    "<h3 style='float:left; margin: 4px; margin-left: 5%; max-height: 25px; width: 105px; max-width:105px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: 200; color: black;'>"+tabTitle+"</h3>"+
                                    "<img src='/speaker.png' height='15px' width='15px'  style='float:left; margin-top:5px'>"+
                                    "<img src='x.png' height='15px' width='20px' style='float:right; margin-top:5px'>"+
                                    "<div style='clear: both'></div>"+
                                "</div>";
        
        var tabCapturedQuestion =   "<h3>Is there audio on this tab?</h3>"+tabCapturedLook+
                                    "<h4> You should see a speaker icon beside this tabs title</h4>"+
                                    "<div style='margin: 0 auto; width: 80%;'>"+
                                        "<button id='"+noButtonId+"' type='button' style='width:40%; margin-right: 20px'>No</button><button id='"+yesButtonId+"' type='button' style='width:40%;'>Yes</button>"+
                                    "</div>"
        return tabCapturedQuestion;
    }
    // makes hyperlinks work i npopup.html
    window.addEventListener('click', function(e)
    {
        var url = null;
        if(e.target.id === "reportBug")
        {
            url = "https://chrome.google.com/webstore/detail/bass-boost-hd-audio/mghabdfikjldejcdcmclcmpcmknjahli/support?hl=en";
            track("Link Clicked", "Report a Bug");
            chrome.tabs.create({url: url});
        }
        else if(e.target.id === "leaveReview")
        {
            url = "https://chrome.google.com/webstore/detail/bass-boost-hd-audio/mghabdfikjldejcdcmclcmpcmknjahli/reviews?hl=en";
            track("Link Clicked", "Leave a Review");
            chrome.tabs.create({url: url});
        }
        else if(e.target.id === 'entryQuestionButton'){
            track("Fix No Audio", "Wizard Started");
            setQuestion(1);
        }
        else if(e.target.id === tabCapturedButtonId){
            track("Fix No Audio", "Problem Identified", "Tab already Captured");
            setQuestion(2);
        }
        else if(e.target.id === tabNotCaptureButtonId){
            track("Fix No Audio", "Tab Not Captured");
            setQuestion(3);
        }
        else if(e.target.id === manageExtensionsButtonId){
            track("Fix No Audio", "Resolve Started", "Disable Audio/Video Extensions");
            chrome.tabs.create({url: "chrome://extensions/"});
        }
        else if(e.target.id === tabHasAudioButtonId){
            track("Fix No Audio", "Tab Has Audio");
            setQuestion(4);
        }
        else if(e.target.id === tabHasNoAudioButtonId){
            track("Fix No Audio", "Problem identified", "Tab has No Audio");
            setQuestion(5);
        }
        else if(e.target.id === updateChromeButtonId){
            track("Fix No Audio", "Chrome Update Attempted", "");
            chrome.tabs.create({url: "chrome://help/"});
        }
        else if(e.target.id === testVideoButtonId){
            track("Fix No Audio", "Test Video", "");
            //chrome.tabs.create({url: "https://www.youtube.com/watch?v=7Qp5vcuMIlk"});
            chrome.tabs.create({url: "https://www.youtube.com/watch?v=iwu4GPf9HEM"});
        }
        else if(e.target.id === reinstallBassBoostButtonId){
            track("Fix No Audio", "Reinstall Bass Boost", "");
            //chrome.tabs.create({url: "chrome://extensions/"});
            chrome.tabs.create({url: "https://chrome.google.com/webstore/detail/bass-boost-hd-audio/mghabdfikjldejcdcmclcmpcmknjahli"});
        }
    });
});


