let settingsOpen = false;

function openSettings() {
    hideMobileControls = true;

    tutorialOpen = false;
    document.getElementById("tutorial").style.display = "none";
    
    if(settingsOpen) {
        hideMobileControls = false;
        document.getElementById("settings").style.display = "none";
    }
    else {
        document.getElementById("settings").style.display = "flex";
    }

    settingsOpen = !(settingsOpen);
    
    window.setTimeout(toggleMobileControlsFromMenu, 100);
}

let tutorialOpen = false;

function openTutorial() {
    settingsOpen = false;
    document.getElementById("settings").style.display = "none";
    
    if(tutorialOpen) {
        document.getElementById("tutorial").style.display = "none";
    }
    else {
        document.getElementById("tutorial").style.display = "flex";
    }

    tutorialOpen = !(tutorialOpen);

    window.setTimeout(toggleMobileControlsFromMenu, 100);
}

let difficulties = {
    "EASY": 3, 
    "MEDIUM": 4, 
    "HARD": 5, 
    "EXTREME*": 7
}

let queuedDifficulty = -1;
let difficultyElement = null;

function queueDifficulty(element) {
    let cssRef = document.styleSheets[0].cssRules[1].style;
    bgColor = cssRef.getPropertyValue("--bgColor");

    let parent = element.parentNode;
    let reachedEndOfDifficultySection = false;

    for(let i = 0; i < parent.childNodes.length; i++) {
        let elemToChange = parent.childNodes[i].childNodes[1];

        if((elemToChange != undefined) && !(reachedEndOfDifficultySection)) {
            parent.childNodes[i].childNodes[1].style.backgroundColor = bgColor;
        }

        if(typeof parent.childNodes[i].innerText == "string") {
            if(parent.childNodes[i].innerText == "EXTREME*") {
                reachedEndOfDifficultySection = true;
            }
        }
    }

    element.childNodes[1].style.backgroundColor = colorMain;
    difficultyElement = element.childNodes[1];

    queuedDifficulty = difficulties[element.innerText];
}

let colors = {
    "red": "#E74C3C", 
    "orange": "orange", 
    "yellow": "yellow", 
    "green": "#00FF99", 
    "blue": "#42A5F5", 
    "purple": "#7E57C2", 
    "pink": "#F06292", 
    "white": "white"
};

let colorMain = colors["green"];

function setColor(element) {
    let cssRef = document.styleSheets[0].cssRules[1].style;
    bgColor = cssRef.getPropertyValue("--bgColor");

    let parent = element.parentNode;
    let reachedColorSection = false;

    for(let i = 0; i < parent.childNodes.length; i++) {
        let elemToChange = parent.childNodes[i].childNodes[1];

        if((elemToChange != undefined) && reachedColorSection) {
            parent.childNodes[i].childNodes[1].style.backgroundColor = bgColor;
        }

        if(parent.childNodes[i].innerText == "COLOR") {
            reachedColorSection = true;
        }

    }

    let color = colors[(element.innerText).toLowerCase()];

    element.childNodes[1].style.backgroundColor = color;

    // update the selected box color of difficulty option
    if(difficultyElement != null) {
        difficultyElement.style.backgroundColor = color;
    }

    let root = document.querySelector(":root");
    root.style.setProperty("--mainColor", color);

    colorMain = color;
}