/*global console */

(function () 
{
    "use strict";

    var KEYCODES = {
            "Equal": 187,
            "Minus": 189
        },
        SEEK_JUMP_KEYCODE_MAPPINGS = {
            // 0 to 9
            "48": 0,
            "49": 1,
            "50": 2,
            "51": 3,
            "52": 4,
            "53": 5,
            "54": 6,
            "55": 7,
            "56": 8,
            "57": 9,
            // 0 to 9 on numpad
            "96": 0,
            "97": 1,
            "98": 2,
            "99": 3,
            "100": 4,
            "101": 5,
            "102": 6,
            "103": 7,
            "104": 8,
            "105": 9
        };

    // If on an input or textarea
    function inputActive(currentElement) 
    {
        return currentElement.tagName.toLowerCase() === "input" 
        || currentElement.tagName.toLowerCase() === "textarea" 
        || currentElement.id.toLowerCase() === "contenteditable-root";
    }

    var timer;

    // https://stackoverflow.com/questions/6121203/how-to-do-fade-in-and-fade-out-with-javascript-and-css
    function fadeout(element, startOpacity) 
    {
        var op = startOpacity; // initial opacity
        timer = setInterval(function () 
        {
            if (op <= 0.1) 
            {
                clearInterval(timer);
                element.style.display = 'none';
            }
            
            element.style.opacity = op;
            element.style.filter = 'alpha(opacity=' + op * 100 + ")";
            op -= 0.05;
        }, 50);
    }
    
    var elementId = "youtube-extension-text-box";
    var opacity = 0.6;
    
    function displayText(speed, boundingElement) 
    {
        clearInterval(timer);
        var HTML = '<div id="' + elementId + '">' + speed + 'x</div>',
            element = document.getElementById(elementId);

        // If the element doesn't exist, append it to the body
        // must check if it already exists
        if (!element) 
        {
            boundingElement.insertAdjacentHTML('afterbegin', HTML);
            element = document.getElementById(elementId);
        } 
        else 
        {
            element.innerHTML = speed + "x";
        }

        element.style.display = 'block';
        element.style.opacity = opacity;

        switch(("" + speed).length)
        {
            case 1:
                element.style.fontSize = '50px';
                element.style.textIndent = '0px';
                break;
            
            case 2:
                element.style.fontSize = '45px';
                element.style.textIndent = '-0.1em';
                break;

            case 3:
                element.style.fontSize = '40px';
                element.style.textIndent = '-0.2em';
                break;
            
            case 4:
                element.style.fontSize = '35px';
                element.style.textIndent = '-0.35em';
                break;

            default:
                element.style.fontSize = '30px';
                element.style.textIndent = '-0.5em';
        }

        setTimeout(fadeout(element, opacity), 1000);
    }

    window.onkeyup = function (e) 
    {
        var activeElement = document.activeElement;
        // If an input/textarea element is active, don't go any further 
        if (inputActive(activeElement)) 
        {
            return;
        }

        var code = e.keyCode;

        if(!(KEYCODES.Equal === code || KEYCODES.Minus === code || SEEK_JUMP_KEYCODE_MAPPINGS[code] !== undefined))
        {
            return;
        }

        var video = document.getElementsByTagName("video")[0],
            mediaElement = document.getElementById("movie_player"),
            mediaElementChildren = mediaElement.getElementsByTagName("*");

        if(code == KEYCODES.Equal)
        {
            video.playbackRate += .25;
            displayText(video.playbackRate, mediaElement);
        }

        // Playback speeds
        if (code == KEYCODES.Minus) 
        {
            video.playbackRate = video.playbackRate <= 0.25 ? 0.25 : video.playbackRate - 0.25;
            displayText(video.playbackRate, mediaElement);
        }

        // Check if the media element, or any of it's children are active.
        // Else we'll be overwriting the previous actions.
        for (var i = 0; i < mediaElementChildren.length; i++) 
        {
            if (mediaElementChildren[i] === activeElement) 
            {
                return;
            }
        }

        // Also check if it's the media element itself.
        if (mediaElement === activeElement) 
        {
            return;
        }

        // If seek key
        if (SEEK_JUMP_KEYCODE_MAPPINGS[code] !== undefined) 
        {
            video.currentTime = (SEEK_JUMP_KEYCODE_MAPPINGS[code] / 10) * video.duration;
        }
    };

}());
