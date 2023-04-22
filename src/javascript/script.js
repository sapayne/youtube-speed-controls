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
        //  if the user is typing in the comment section, then don't change the speed of the video or skip through 
        || currentElement.id.toLowerCase() === "contenteditable-root";
    };

    /*  global variable so the timer can be invalidated anywhere, and that way multiple displayText and 
        fade out functions don't get overlaid on each other which causes a flickering effect.
    */
    var timer;
    let YoutubeSpeed = "YoutubeSpeed";
    var videoElemID;// = "movie_player";
    var HTMLPosition;// = 'afterbegin';
    var video;

    // https://stackoverflow.com/questions/6121203/how-to-do-fade-in-and-fade-out-with-javascript-and-css
    function fadeout(element, startOpacity) 
    {
        var op = startOpacity;
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
    };
    
    const elementId = "youtube-extension-text-box";
    var opacity = 0.6;
    
    function displayText(speed, boundingElement) 
    {
        if(!boundingElement) return;

        clearInterval(timer);
        var HTML = '<div id="' + elementId + '">' + speed + 'x</div>',
            element = document.getElementById(elementId);

        // If the element doesn't exist, append it to the body
        if (!element) 
        {
            boundingElement.insertAdjacentHTML(HTMLPosition, HTML);
            element = document.getElementById(elementId);
        } 
        else 
        {
            element.innerHTML = speed + "x";
        }

        element.style.display = 'block';
        element.style.opacity = opacity;

        //  used to resize and center the speed up text depending on the number of sig figs in the numeric value
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

        setPlaybackSpeed(speed);

        setTimeout(fadeout(element, opacity), 1000);
    };

    function getPlaybackSpeed()
    {
        return new Promise((resolve) => {
            chrome.storage.sync.get([YoutubeSpeed], (obj) => {
                console.log("youtube playback speed: " + obj[YoutubeSpeed]);
                resolve(obj[YoutubeSpeed] ? JSON.parse(obj[YoutubeSpeed]) : 1);
            });
        });
    };

    function setPlaybackSpeed(speed)
    {
        playbackSpeed = speed;

        chrome.storage.sync.set({
            [YoutubeSpeed]: JSON.stringify(speed)
        });
    };

    var playbackSpeed;

    const waitForVideos = () =>
    {
        return new Promise((resolve) =>
        {
            let videoContainer = document.getElementsByTagName("video");

            const speedTimer = setInterval(() => 
            {
                if(videoContainer.length > 0)
                {
                    clearInterval(speedTimer);

                    resolve(videoContainer);
                }
            }, 50);
        });
    }

    async function initValues()
    {
        return new Promise(async (resolve) =>
        {
            const url = window.location.href;
            let index = 0;
            /*  seems setInterval is an async function as the code was being skipped 
                over and crashing at the video.playbackRate from being an object without
                the playbackRate member variable.
            */
            let videoContainer = await waitForVideos();

            //  regular video access
            if(url.includes("watch"))
            {
                videoElemID = "movie_player";
                HTMLPosition = "afterbegin";
            }
            //  shorts access
            else if(url.includes("shorts"))
            {
                videoElemID = "shorts-container";
                HTMLPosition = "beforebegin";

                for (let i of videoContainer)
                {
                    if(i.hasAttribute("src"))
                    {
                        break;
                    }

                    index++;
                }
            }
            else
            {
                videoElemID = "";
                resolve();
            }

            displayText(playbackSpeed, document.getElementById(videoElemID))
            
            video = videoContainer[index];

            video.playbackRate = playbackSpeed;

            resolve();
        });
    }

    async function init()
    {
        //  load playback speed from storage and update video speed
        playbackSpeed = await getPlaybackSpeed();       

        await initValues();
    }

    //  for when first loading a youtube page
    window.onload = async () =>
    {
        //console.log("on load.");
        init();
    };

    //  for when changing between pages (shorts or regular videos)
    window.addEventListener('yt-page-data-updated', () =>
    {
        setPlaybackSpeed(playbackSpeed);

        let element = document.getElementById(elementId);

        if(element)
        {
            element.remove();
        }

        init();
    });

    window.onkeyup = (e) =>
    {
        //  setting video to null doesn't work so instead we set the videoElemID to an empty string in the initValues else code block
        if(!videoElemID)
        {
            return;
        }

        let activeElement = document.activeElement;

        // If an input/textarea element is active, don't go any further 
        if (inputActive(activeElement)) 
        {
            return;
        }

        let code = e.keyCode;

        if(!(KEYCODES.Equal === code || KEYCODES.Minus === code || SEEK_JUMP_KEYCODE_MAPPINGS[code] !== undefined))
        {
            return;
        }

        let mediaElement = document.getElementById(videoElemID),
            mediaElementChildren = mediaElement.getElementsByTagName("*");

        if(code == KEYCODES.Equal)
        {
            video.playbackRate += .25;
            displayText(video.playbackRate, mediaElement);
        }

        // Playback speeds
        if (code == KEYCODES.Minus) 
        {
            video.playbackRate = playbackSpeed <= 0.25 ? 0.25 : playbackSpeed - 0.25;
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
