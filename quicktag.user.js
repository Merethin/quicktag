// ==UserScript==
// @name         quicktag
// @namespace    http://tampermonkey.net/
// @version      2025-05-10
// @description  Script to tag regions that have been hit in NationStates R/D
// @author       Merethin
// @match        https://*.nationstates.net/*page=region_control*
// @require      https://craig.global.ssl.fastly.net/js/mousetrap/mousetrap.min.js?a4098
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        window.close
// ==/UserScript==

// Userscript Settings

// Add the tag WFE here, in its full multiline glory
var wfe =
`[b]Your region has been tagged![/b]
[i]This is a sample WFE[/i]`;

var embassies = new Array(); // The regions to build embassies with. Example: var embassies = new Array("Suspicious", "The Infinite Army");
var cancelExistingEmbassies = false; // Whether to destroy existing embassies, as long as they're not in the above list.
var withdrawEmbassyRequests = false; // Whether to withdraw existing embassy requests sent, as long as they're not in the above list.
var denyEmbassyRequests = false; // Whether to deny existing embassy requests received, as long as they're not in the above list.
var tagsToAdd = new Array("anti-fascist", "colony", "invader"); // The tags to add to the region, in lowercase.
var tagsToRemove = new Array("fascist"); // The tags to remove from the region, in lowercase.
var keybind = 'j'; // The key to use to perform tagging actions.
var closeWindow = true; // Whether to close the window after the region has been fully tagged.


(function() {
    'use strict';

    Mousetrap.bind(keybind,
        /**
        * Tag a region according to the settings above.
        * Each keypress will perform one distinct action until the region is completely tagged.
        */
        function (ev) {
            // STEP 1: Edit the WFE if it hasn't been changed already, otherwise continue
            const wfeTextarea = document.getElementById("editor");
            if(wfeTextarea.textContent != wfe) {
                document.getElementById("editor").textContent = wfe;
                document.getElementById("setwfebutton").click();
                return;
            }

            // Iterator variables since ESLint doesn't like me redefining them in each loop
            var i = 0;
            var j = 0;

            // STEP 2: Add one tag to the region if there are any pending, otherwise continue
            const addTag = document.querySelector("select[name='add_tag']");
            var addChildren = addTag.children;
            for (i = 0; i < addChildren.length; i++) {
                var addTagOption = addChildren[i];
                if(tagsToAdd.includes(addTagOption.value.replace("_", ""))) {
                    addTagOption.selected = true;
                    document.querySelector("button[name='updatetagsbutton']").click();
                    return;
                }
            }

            // STEP 3: Remove one tag from the region if there are any pending, otherwise continue
            const removeTag = document.querySelector("select[name='remove_tag']");
            var removeChildren = removeTag.children;
            for (i = 0; i < removeChildren.length; i++) {
                var removeTagOption = removeChildren[i];
                if(tagsToRemove.includes(removeTagOption.value.replace("_", ""))) {
                    removeTagOption.selected = true;
                    document.querySelector("button[name='updatetagsbutton']").click();
                    return;
                }
            }

            // STEP 4: Cancel, withdraw, and build new embassies, or continue if all embassy work is done

            // This list will store which regions from the "embassies" list are already present on the region page, so that we can skip them when requesting.
            const embassiesAlreadyPresent = new Array();

            // STEP 4.1: Go through built embassies, log the ones that need to be logged in embassiesAlreadyPresent, and destroy them if the user wishes (otherwise continue)
            const embassyTable = document.querySelector("table[class='shiny wide embassies mcollapse']");
            if(embassyTable != null) {
                const embassyList = embassyTable.children[0].children;
                for (i = 1; i < embassyList.length; i++) {
                    var embassy = embassyList[i];
                    var embassyName = embassy.querySelector("a[class='rlink']").text;
                    if(!embassies.includes(embassyName) && cancelExistingEmbassies) {
                        var destroyEmbassyButton = embassy.querySelector("button[name='cancelembassyregion']");
                        if(destroyEmbassyButton != null) {
                            destroyEmbassyButton.click();
                            return;
                        }
                    }
                    if(embassies.includes(embassyName)) {
                        embassiesAlreadyPresent.push(embassyName);
                    }
                }
            }

            // STEP 4.2: Go through embassy requests (sent and received), log the ones that need to be logged in embassiesAlreadyPresent, and withdraw/deny them if the user wishes, or accept if they're one we want (otherwise continue)
            const requestsTables = document.querySelectorAll("table[class='shiny wide mcollapse']:not(#rcontrol_officers)");
            for (i = 0; i < requestsTables.length; i++) {
                var requestList = requestsTables[i].children[0].children;
                for (j = 1; j < requestList.length; j++) {
                    var request = requestList[j];
                    var requestEmbassyName = request.querySelector("a[class='rlink']").text;
                    if(!embassies.includes(requestEmbassyName) && withdrawEmbassyRequests) {
                        var withdrawRequestButton = request.querySelector("button[name='withdrawembassyregion']");
                        if(withdrawRequestButton != null && !withdrawRequestButton.disabled) {
                            withdrawRequestButton.click();
                            return;
                        }
                    }
                    if(!embassies.includes(requestEmbassyName) && denyEmbassyRequests) {
                        var rejectRequestButton = request.querySelector("button[name='rejectembassyregion']");
                        if(rejectRequestButton != null && !rejectRequestButton.disabled) {
                            rejectRequestButton.click();
                            return;
                        }
                    }
                    if(embassies.includes(requestEmbassyName)) {
                        var acceptRequestButton = request.querySelector("button[name='acceptembassyregion']");
                        if(acceptRequestButton != null && !acceptRequestButton.disabled) {
                            acceptRequestButton.click();
                            return;
                        }
                        embassiesAlreadyPresent.push(requestEmbassyName);
                    }
                }
            }

            // STEP 4.3: Build new embassies that aren't already present on the region page (otherwise continue)
            for(i = 0; i < embassies.length; i++) {
                const embassyToRequest = embassies[i];
                if(!embassiesAlreadyPresent.includes(embassyToRequest)) {
                    document.getElementById("entity_input_embassyregion").value = embassyToRequest;
                    document.querySelector("button[name='requestembassy']").click();
                    return;
                }
            }

            // STEP 5: If we're done, and the user wishes so, close the window
            if(closeWindow) {
                window.close();
            }
        })
})();