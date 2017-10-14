
<?php




?>

<html>
    <head>
        <link rel="stylesheet" type="text/css" href="popup.css">
        <link rel="stylesheet" type="text/css" href="select.css">

        <script src="jquery.js"></script>
        <script src="popup.js"></script>
    </head>
    <body style="width: 200px; overflow-x: hidden; background-color: rgba(200,200,200,0.3);">
        <h1 style="color: #bb0000;">Bass Boost</h1>
        <hr style="background-color: #bb0000; height: 1px; border: 0;">
        <input type='checkbox' class='ios8-switch' id='bassBoostCheckbox' style="float: left" >
        <label for='bassBoostCheckbox' style="float: left"></label>
        <h3 id="boostEnabledTitle" style="float: right; margin-top: 8px; color: #999">Enable Bass Boost</h3>
        <div style="clear: both;"></div>
        
       <div class='selectBox'>
            <input type="hidden" value="Music" class="presetSelected"/>
            <span class='selected'></span>
            <span class='selectArrow'>&#9660</span>
            <ul class="selectOptions" >
                <li class="selectOption" data-value="value Music">Default</li>
                <li class="selectOption" data-value="value Movie">High</li>
                <li class="selectOption" data-value="value Gameplay">Very High</li>
                <li class="selectOption" data-value="value Talking">Insane</li>
                <li class="selectOption" data-value="value Talking">Chipmunks</li>
            </ul>
		</div>
        
        <h3 style="font-family: thin; color: #999; margin-bottom: 0;">Support Us</h3>
        <h4 style="font-family: thin; color: #999; margin-top: 0;">If we've changed the way you listen to content on youtube please consider donating to us. Bass Boost is free to use but can only stay free thanks to your generous donations.</h4>
        
        <a style="display:block; text-align: center; margin-bottom: 5%;" target='_blank' href='https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HXCVLRAR82HQS'>
          <image src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0"/>
          <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">
        </a>
        <hr style="background-color: #bb0000; height: 1px; border: 0;">
        
        <!-- <button>Close</button> -->
            
       <!-- <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" >
            <input type="hidden" name="cmd" value="_s-xclick">
            <input type="hidden" name="hosted_button_id" value="HXCVLRAR82HQS">
            <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
        </form> -->

    </body>
</html>