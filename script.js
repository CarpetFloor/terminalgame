/* for some reason any speed below 5 does not work properly (time taken to print does not calculate properly),
but if needed to print that fast maybe just update the innerHTML, which should work*/
const printSpeed = 10;// 10;
// number of vertical lines in playable game area
const lineCount = 16;
// width of each line in playable game area in characters
const lineLength = 12;

/**
 * Generates a random integer from a given inclusive range
 * @param min the minimum number in the range (inclusive)
 * @param max the maximum number in the range (inclusive)
 * @returns the random integer
 */
function random(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

// object that represents the current textarea and printing data stuff
let current = {
    ref: document.getElementById(''),
    text: 'empty',
    printSpeed: 100,
    // the current character of the content to be printed out
    printIndex: 0,
};

let animations = true;
let printIndex = 0;
// REMEMBER TO SET current.ref BEFORE CALLING print()!!!
/**
 * One iteration of printing content (1 call of this function only prints a single character of the content)
 * @param content the content to be printe
 */
function print(content) {
    if(content.substring(printIndex, printIndex + 4) == '<br>') {
        current.ref.innerHTML += '<br>';

        printIndex += 3;
    }
    else {
        current.ref.innerHTML += content.charAt(printIndex);
    }

    ++printIndex;
    if(printIndex < content.length) {
        if(animations) {
            window.setTimeout(function() {
                print(content);
            }, printSpeed);
        }
        else {
            print(content);
        }
    } else {
        printIndex = 0;
    }
}

// what the cursor is highlighting, which is a var because can be a single characdter, entire word, or bracket set
let cursorContent = "";
// like print, but instantly prints stuff out
function update(content) {
    current.ref.innerHTML = "";
    
    /**
     * I had so many problems making this and have no idea why this function turned out the way that it did, 
     * other than the fact that this is how I got everything to work
     */
    
    let leftOfCursor = document.createElement("p");
    let rightOfCursor = document.createElement("p");
    
    let cursor = document.createElement("span");
    let reachedCursor = false;
    
    let wordOnMultipleLines = false;

    for(let i = 0; i < content.length; i++) {
        let spanTest = "";
        if(i < content.length - 6) {
            spanTest = content.substring(i, i + 6);
        }

        let brTest = "";
        if(i < content.length - 4) {
            brTest = content.substring(i, i + 4);
        }

        if(spanTest == "<span>") {
            reachedCursor = true;

            let actualCursorContent = "";
            let index = -1;
            while(content.substring(i + index + 7, i + index + 7 + 7) != "</span>") {
                // for some reason if word starts farthest to the left, it detects the <br> to the left of it
                if((i == -1) && (content.substring(i + index + 7, i + index + 7 + 4) == "<br>")) {
                    index += 3;
                }
                else {
                    actualCursorContent += content[i + index + 7];
                }

                ++index;
            }

            for(let index = 0; index < actualCursorContent.length; index++) {
                let otherSubstring = actualCursorContent.substring(index, index + 4);

                if(otherSubstring == "<br>") {
                    if(index > 0) {
                        leftOfCursor.innerHTML += "<span>";
                        leftOfCursor.innerHTML += "</span>";
                        leftOfCursor.innerHTML += "<br>";

                        wordOnMultipleLines = true;
                    }

                    index += 3;
                }
                else {
                    leftOfCursor.innerHTML += "<span>" + actualCursorContent[index] + "</span>";
                }
            }

            i += 12 + actualCursorContent.length;
        }
        else if(brTest == "<br>") {

            /**
             * For some reason, when a newline is added from a word spanning multiple lines, this 
             * else if statement adds a newline right after the word, so for some reason just 
             * checking if a word was just printed that spans multiple lines solves the issue
             */
            if(!(wordOnMultipleLines)) {
                leftOfCursor.innerHTML += "<br>";
            }
            else {
                wordOnMultipleLines = false;
            }

            i += 3;
        }
        else {
            leftOfCursor.innerHTML += content[i];
        };
    }

    current.ref.appendChild(leftOfCursor);
}

function clearCursorUpdateContent(content) {
    current.ref.innerHTML = "";

    for(let i = 0; i < content.length; i++) {
        let brTest = "";
        if(i < content.length - 4) {
            brTest = content.substring(i, i + 4);
        }
        
        if(brTest == "<br>") {
            current.ref.innerHTML += "<br>";
            
            i += 3;
        }
        else {
            current.ref.innerText += content[i];
        };
    }
}

function clearCursor(content) {
    if(onLeft) {
        left = "";

        for(let i = 0; i < leftNoSpan.length; i++) {
            if((i > 0) && (i % lineLength === 0)) {
                left += "<br>";
            }
            
            if(i != pos) {
                left += leftNoSpan.charAt(i);
            }
        }
        
        current.ref = components[getComponentIndex("leftMain")].ref;
        clearCursorUpdateContent(left);
    }
    // right
    else {
        right = "";

        for(let i = 0; i < rightNoSpan.length; i++) {
            if((i > 0) && (i % lineLength === 0)) {
                right += "<br>";
            }
            
            if(i != pos) {
                right += rightNoSpan.charAt(i);
            }
        }
        
        current.ref = components[getComponentIndex("rightMain")].ref;
        clearCursorUpdateContent(right);
    }
}

function replace(content) {
    current.ref.innerHTML = "";
    print(content);
}

/**
 * not able to just get the length of the content and multiply by printSpeed because <br> is used for newlines,
 * and when printing doesn't take any longer than a single character
 * @param content the content that is to be printed
 * @returns the length of time in miliseconds it will take to print the content
 */
function calcTimeToPrint(content) {
    let length = 0;

    for(let i = 0; i < content.length; i++) {
        ++length;

        if(content.substring(i, i + 4) == '<br>') {
            i += 3;
        }
    }
    
    let speed = Math.floor(printSpeed * 1.5);
    if(printSpeed === 0) {
        speed = 10;
    }

    return length * speed;
}

// if the number of attempts should be set based off of the difficulty
let scaleAttempts = false;
let gameData = {
    // easy, medium, hard, insane: insane has even harder aspects to it
    /**
     * Extra insane difficulties:
     * -In attempt history, unable to see what the attempt was
     * -When an incorrect password is attempted it will not become dotted out (meaning that it is still guessable)
     */
    difficultyOptions: [3, 4, 5, 7],
    difficulty: -1,
    wordLength: -1,
    wordFrequency: 0,
    attempts: -1,
    maxWords: -1,
    wordCount: 0,
    // maxBracketSets: -1,
    // bracketSetCount: 0,
    /* This ensures that words get roughly evenely spaced.
    Each section, or quadrant because there are 4, of the game area
    keeps track of how many words it contains. The sections are the
    left top, left bottom, right top, and right bottom. This is done
    so that when generating a word, the current index, which is known,
    of the entire game area can be checked to see what quadrant the
    word is attempting to generate in, and whether or not that quadrant
    already has too many words; based off of maxWordsPerQuadrant*/
    // lt, lb, rt, rb
    quadrantsWordCount: [0, 0, 0, 0],
    // set during initialization because it is dependent on the total word count
    maxWordsPerQuadrant: -1,
    initialize: function() {
        this.wordLength = this.difficulty;
        
        /* sometimes with a difficult of 7, not all of the words will generate, and there will be as many
        bracket sets as there are words*/
        if(this.difficulty >= 5) {
            MainComponent.possibleChars.push("w");
            this.wordFrequency = 1;
        }
        this.maxWords = this.difficulty + 2;
        this.maxBracketSets = this.maxWords - 2;
        
        this.maxWordsPerQuadrant = Math.ceil(this.maxWords / 4);
        
        if(scaleAttempts) {
            this.attempts = (this.difficultyOptions[0] * 2) - this.difficulty;
            if(this.attempts < 1) {
                this.attempts = 1;
            }
        }
        else {
            this.attempts = 3;
        }
    }
};

function setDifficulty(difficulty) {
    if(gameData.difficultyOptions.includes(difficulty)) {
        gameData.difficulty = difficulty;
        
        gameData.initialize();
    }
    else {
        console.error("That is not a valid difficulty. The valid options are$;", gameData.difficultyOptions);
    }
}

/**
 * game set up into four sections:
 * -top: cotains the attempts
 * -leftLineNumbers: the line numbers for the left half of the main game
 * -leftMain: left half of main area
 * -rightLineNumbers: the line numbers for the right half of the main game
 * -rightRight: right half of main area
 * -extra: far right that contains guess history
 */

let components = [];
/**
 *
 * @param name the name/ ref of the component to look for
 * @returns the index in the components array of the component
 */
function getComponentIndex(name) {
    for(let i = 0; i < components.length; i++) {
        if(components[i].name == name) {
            return i;
        }
    }
}

class Component {
    constructor(name) {
        this.name = name;
        this.ref = document.getElementById(name);
        this.setup = false;
        this.content = "";
    }
}

/**
 * for stuff that will get changed continuously during gameplay
 * (note that while top can get updated throughout gameplay, it will happen very infrequently, and is much less complicated)
 * includes:
 * -leftMain
 * -rightMain
 * -extra
 */
class LineNumbersComponent extends Component {
    // static so that the left can create it, add it, and then the right can use that value and keep adding to get subsequent lines
    static intAsDec = 0;
    
    constructor(name) {
        super(name);

        // excludes the 0x start
        this.length = 4;
        
        this.generate();
    }

    generate() {
        let intAsHex = "";
        let maxValue = "";
        for(let i = 0; i < this.length; i++) {
            maxValue += "9";
        }
        let temp = maxValue;
        maxValue = parseInt(temp);

        for(let i = 0; i < lineCount; i++) {
            if(i === 0 && this.name == "leftLineNumbers") {
                /**
                 * only the first half so don't have to worry about
                 * situations where first number is 0xFFFF, and then
                 * have to deal with carry of first bit
                 */
                // can't use this. because accessing a static variable of the class
                LineNumbersComponent.intAsDec = random(0, Math.floor(maxValue * 0.5))
            }
            else {
                LineNumbersComponent.intAsDec += random(1, 16);
            }

            intAsHex = LineNumbersComponent.intAsDec.toString(16);
            
            // format to make sure that there are always length bits
            let formattedHex = intAsHex;
            if(formattedHex.length < this.length) {
                let toAdd = this.length - formattedHex.length;
                
                for(let j = 0; j < toAdd; j++) {
                    let temp = "0";
                    temp += formattedHex;
                    
                    formattedHex = temp;
                }
            }

            this.content += "0x" + formattedHex + "<br>";
        }
    }
}

let lettersLeftIndices = [];
let lettersRightIndices = [];
let generatedWords = [];
let password = "not yet set";
// let bracketsIndices = [];
class MainComponent extends Component {
    /**
     * the last two are for adding a word,
     * or adding matching brackets
     */
    static possibleChars = [
            '[', ']', '{', '}',
            '(', ')', "<", ">",
            '!', '@', '#', '$',
            '%', "^", '&', '*',
            '-', '_', '=', '+',
            '\\', '|', ';', ':',
            "'", '"', ',', '.',
            '`', '~',
            'w'/*, 'b'*/
    ];
    
    // the set of brackets to choose from when a bracket set is chosen
    // static possibleBrackets = ["()", "{}", "[]", "<>"];
    
    constructor(name) {
        super(name);

        this.generate();
    }
    
    // POSSIBLY split this into multiple smaller functions
    generate() {
        let contentPos = 0;
        // what should be printed next
        let selection = "";
        // the last type of thing to print, so for each character of a word it will just be w
        let lastSelection = "";
        // used for the current word, or set of brackets to print
        let wordToPrint = "";
        // index for the current character of wordToPrint to print
        let wordI = 0;
        
        for(let i = 1; i <= lineCount * lineLength; i++) {
            if(wordToPrint.length === 0) {
                selection = MainComponent.possibleChars[
                random(0, MainComponent.possibleChars.length)];
                
                // word
                if(selection == "w") {
                    let quad = -1;
                    /* make sure that there are never 2 consecutive words, and make sure that a
                    word is never in a set of brackets */
                    
                    // let lastSelectionDoubleCheck = this.content[this.content.length - 1];

                    if(lastSelection != "w" && lastSelection != "b" && gameData.wordCount < gameData.maxWords && i > 1) {
                        // get the current quadrant
                        // top
                        if(i < lineCount * (lineLength / 2)) {
                            // left
                            if(this.name == "leftMain") {
                               // lt
                               quad = 0;
                            }
                            // right
                            else {
                                // rt
                                quad = 2;
                            }
                        }
                        // bottom
                        else {
                            // left
                            if(this.name == "leftMain") {
                               // lb
                               quad = 1;
                            }
                            // right
                            else {
                                // rb
                                quad = 3;
                            }
                        }

                        let validGenerateIndex = true;

                        // prevent word from generating too far to the right on the bottom line of the left or right side
                        let margin = 2;
                        if(Math.floor(i / lineLength) == (lineCount - 1)) {
                            validGenerateIndex = false;
                        }
                        
                        // don't allow generating words if starting from the n-to-last position of the current line
                        let lastPosToGenerate = 3;
                        if((i % lineLength) > (lineLength - lastPosToGenerate)) {
                            validGenerateIndex = false;
                        }
                            
                        if((gameData.quadrantsWordCount[quad] < gameData.maxWordsPerQuadrant) && validGenerateIndex) {
                                ++gameData.wordCount;
                                ++gameData.quadrantsWordCount[quad];
                                
                            // THIS IS WHERE WORDS GET GENERATED AND ADDED TO THE GAME
                            /**
                             * To actually get the words, the variable words is used, which is a refernce to 
                             * the variable words in words.js, which is an array that contains all of the 
                             * possible words
                            */
                           // REMEMBER THAT LENGTH OF WORD IS SUPPOSED TO BE AT LEAST DIFFICULTY VALUE, NOT WAHT DIFFICULTY VALUE IS
                           do {
                               wordToPrint = words[random(0, words.length - 1)];
                            }
                            while ((gameData.wordLength > wordToPrint.length) && (generatedWords.includes(wordToPrint)));
                            
                            // add generated word to the array of generated words
                            generatedWords.push(wordToPrint);

                            for(let index = 0; index < wordToPrint.length; index++) {
                                if(this.name == "leftMain") {
                                    lettersLeftIndices.push(contentPos + index);
                                }
                                else {
                                    lettersRightIndices.push(contentPos + index);
                                }
                            }
                            
                            lastSelection = selection;
                            
                            // print out the first character of wordToPrint
                            selection = wordToPrint.charAt(0);
                            wordI = 1;
                        }
                        else {
                            /* 3 + gameData.wordFrequency because the 3 gets the the last regular possibleChar that is not
                            a word or bracket, but then have to add gameData.wordFrequency to account for all of the extra
                            w's that are added into the array*/
                            selection = MainComponent.possibleChars[
                            random(0,
                            MainComponent.possibleChars.length - (3 + gameData.wordFrequency))];
                        }
                    }
                    
                    else {
                        /* 3 + gameData.wordFrequency because the 3 gets the the last regular possibleChar that is not
                        a word or bracket, but then have to add gameData.wordFrequency to account for all of the extra
                        w's that are added into the array*/
                        selection = MainComponent.possibleChars[
                        random(0,
                        MainComponent.possibleChars.length - (3 + gameData.wordFrequency))];
                    }
                }
                
                // brackets
                // else if(selection == "b") {
                //     /* make sure that there are never 2 consecutive words, and make sure that a
                //     word is never in a set of brackets */
                //     if(lastSelection != "w" && lastSelection != "b" && (gameData.bracketSetCount < gameData.maxBracketSets)) {
                //         ++gameData.bracketSetCount;
                        
                //         // first determine the number of characters between the brackets (does not include brackets)
                //         let bracketSetLength = random(3, 7);
                        
                //         // choose which brackets to use
                //         let bracketSet = MainComponent.possibleBrackets[
                //             random(0, MainComponent.possibleBrackets.length - 1)];
                        
                //         // start generating the bracket sequence by adding the opening bracket from the chosen bracket set
                //         wordToPrint = bracketSet.charAt(0);
                //         bracketsIndices.push(contentPos);
                        
                //         // add all of the random characters in between the brackets
                //         for(let j = 0; j < bracketSetLength; j++) {
                //             wordToPrint +=
                //             /* 3 + gameData.wordFrequency because the 3 gets the the last regular possibleChar that is not
                //             a word or bracket, but then have to add gameData.wordFrequency to account for all of the extra
                //             w's that are added into the array*/
                //             MainComponent.possibleChars[
                //             random(0,
                //             MainComponent.possibleChars.length - (3 + gameData.wordFrequency))];

                //             bracketsIndices.push(bracketsIndices[bracketsIndices.length - 1] + 1);
                //         }
                        
                //         // finish the bracket sequence by adding the closing bracket
                //         wordToPrint += bracketSet.charAt(1);
                //         bracketsIndices.push(bracketsIndices[bracketsIndices.length - 1] + 1);
                        
                //         lastSelection = selection;
                        
                //         // print out the first character of wordToPrint
                //         selection = bracketSet.charAt(0);
                //         wordI = 1;

                //         console.log(bracketsIndices);
                //     }
                    
                //     else {
                //         /* 3 + gameData.wordFrequency because the 3 gets the the last regular possibleChar that is not
                //         a word or bracket, but then have to add gameData.wordFrequency to account for all of the extra
                //         w's that are added into the array*/
                //         selection = MainComponent.possibleChars[
                //         random(0,
                //         MainComponent.possibleChars.length - (3 + gameData.wordFrequency))];
                //     }
                // }
                
                else {
                    lastSelection = selection;
                }
                
                // brackets
            }
            else {
                selection = wordToPrint.charAt(wordI) + "";
                ++wordI;
                
                if(wordI > wordToPrint.length - 1) {
                    wordToPrint = "";
                    
                    // don't need to reset wordI because it gets reset when the next word or bracket sequence is chosen
                }
            }
            
            this.content += selection;
            contentPos += selection.length;
            
            // reached the end of the current line
            if(i % lineLength === 0) {
                this.content += "<br>";
            }
            
        }

        // pick one of the generated words to be the password
        if(this.name == "rightMain") {
            password = generatedWords[random(0, generatedWords.length - 1)];
        }
    }
}
let gameDivHeight = 0;

let topCompleteContent = "hello, and welcome to the system!<br>please enter your password<br><br>password attempts: ";
let passwordAttemptCharacter = "█ ";
function setup(component) {
    if(component <= components.length) {
        if(component < components.length) {
            /* Similar to top div height (explained below under the else), all game divs should be the same height as the
            left line numbers. This is done so that the extra div off to the far right can be set to a fixed height so that
            the text can be aligned to the bottom*/
            if(components[component].name == "leftMain") {
                gameDivHeight = current.ref.clientHeight;

                let gameDivs = document.getElementsByClassName("gameDiv");
                for(let i = 0; i < gameDivs.length; i++) {
                    // don't make the top div as tall as the other divs (the main game area)
                    if(gameDivs[i].id != "top") {
                        gameDivs[i].style.height = gameDivHeight + "px";
                    }
                }
            }
            
            current.ref = components[component].ref;

            print(components[component].content);

            if(animations) {
                window.setTimeout(function () {
                    setup(component + 1);
                }, calcTimeToPrint(components[component].content));
            }
            else{
                setup(component + 1);
            }
        }
        // reprint top
        else {
            /* The height of the top div is set to fit-text so that it can expand to however tall it needs to be,
            however, once the first of two sets of content is printed out, it will not need to get any larger. And,
            it will even shrink when the second set of content starts to print. So, to prevent it from shrinking
            (because when it shrinks all of the content below it are moved up) get its current height and make it
            not fit-content before the second set of content starts to print
            */
           current.ref = components[getComponentIndex("top")].ref;
           
           let height = current.ref.clientHeight;
           current.ref.style.height = height + "px";
           
           components[getComponentIndex("top")].content = topCompleteContent;
            for(let i = 0; i < gameData.attempts; i++) {
                components[getComponentIndex("top")].content += passwordAttemptCharacter;
            };
            
            replace(components[getComponentIndex("top")].content);

            if(animations) {
                window.setTimeout(function () {
                    play();
                }, calcTimeToPrint(components[getComponentIndex("top")].content));
            }
            else {
                window.setTimeout(function() {
                    play();
                }, 200);
            }
        }
    }
}

// the following are for the left and right game content
let originalLeft = "";
let originalRight = "";
let leftNoSpan = "";
let rightNoSpan = "";
let left = "";
let right = "";
// remove the <br>'s to allow easier parsing
function formatMainContent() {
    originalLeft = components[getComponentIndex("leftMain")].content;
    originalRight = components[getComponentIndex("rightMain")].content;

    // the left and right sides are the same size
    for(let i = 0; i < originalLeft.length; i++) {
        // the left and right sides are the same size
        if(originalLeft.substring(i, i + 4) == "<br>") {
            i += 3;
        }
        else {
            left += originalLeft.charAt(i);
            right += originalRight.charAt(i);
        }
    }
    
    leftNoSpan = left;
    rightNoSpan = right;
}

const delay = 125;
let keydownListener;
// for mobile
let keyupListener;
// for mobile
let keyinterruptListener;
let blinkingCursorInterval = null;
let debug = false;
function play() {
    formatMainContent();
    
    if(debug) {
        console.log(password);
    }

    displayCursor();
    
    if(blinkCursor) {
        blinkingCursorInterval = window.setInterval(cursorBlink, cursorBlinkRate);
    }
    
    window.setTimeout(function() {
        if(!(mobile)) {
            keydownListener = document.addEventListener("keydown", keydown);
        }
        else {
            let buttonsToShow = document.getElementsByClassName("button");
            for(let i = 0; i < buttonsToShow.length; i++) {
                buttonsToShow[i].style.display = "flex";
            }
            
            let buttonsToHide = document.getElementsByClassName("yesno");
            for(let i = 0; i < buttonsToHide.length; i++) {
                buttonsToHide[i].style.display = "none";
            }
            
            acceptingInput = true;
        }
    }, 200);
}

// these values are taken from CSS and are set under the window.onload function
let mainColor = null;
let bgColor = null;
let blinkCursor = true;
let cursorOn = true;
// in ms
let cursorBlinkRate = 600;
// Makes the cursor blink
function cursorBlink() {
    // get game color
    mainColor = colorMain;

    /**
     * Invert cursorOn at the start because when cursorOn is initialized for the first time, it is on, and then when this function 
     * get called for the first time from the interval, it has already been enough time that the cursor should be off
     */
    cursorOn = !(cursorOn);
    
    let spans = document.querySelectorAll("span");
    
    for(let i = 0; i < spans.length; i++) {
        // show the cursor
        if(cursorOn) {
            spans[i].style.color = bgColor;
            spans[i].style.backgroundColor = mainColor;
        }
        else {
            spans[i].style.color = mainColor;
            spans[i].style.backgroundColor = bgColor;
        }
    }

}

// if the detected key pressed is a key that does something in the game, which is used for altering cursor blinking
let validInput = false;
function keydown(e) {
    // clear focus to prevent space and enter from opening and closing settings/ tutorial
    document.activeElement.blur();

    // eplanation as to why validInput is set to true here is right above the default case in the switch
    validInput = true;

    switch(e.key) {
        case "ArrowLeft":
            horizontalMove(-1);
            break;
        
        case "ArrowRight":
            horizontalMove(1);
            break;
        
        case "ArrowUp":
            verticalMove(-1);
            break;
        
        case "ArrowDown":
            verticalMove(1);
            break;

        case " ":
        case "Enter":
            if(!(onChar)) {
                attemptWord();
            }

            break;
        
        // this default case is simply so that all of the above cases don't have to set validInput to true
        default:
            validInput = false;
        
        }

    if(blinkCursor && validInput) {
        resetCursorBlink();
    }
}

let acceptingInput = false;

// this probably could have been done better

function mobileMoveLeft() {
    if(acceptingInput) {
        
        horizontalMove(-1);

        if(blinkCursor) {
            resetCursorBlink();
        }

    }
}

function mobileMoveRight() {
    if(acceptingInput) {
        
        horizontalMove(1);

        if(blinkCursor) {
            resetCursorBlink();
        }

    }
}

function mobileMoveUp() {
    console.log("up pressed", acceptingInput);
    if(acceptingInput) {
        
        verticalMove(-1);

        if(blinkCursor) {
            resetCursorBlink();
        }

    }
}

function mobileMoveDown() {
    if(acceptingInput) {
        
        verticalMove(1);

        if(blinkCursor) {
            resetCursorBlink();
        }

    }
}

function mobileEnter() {
    if(acceptingInput) {

        if(!(onChar)) {
            attemptWord();
        }

    }
}

function mobileYes() {
    if(acceptingInput) {
        acceptingInput = false;

        let buttonsToHide = document.getElementsByClassName("button");
        for(let i = 0; i < buttonsToHide.length; i++) {
            buttonsToHide[i].style.display = "none";
        }
        
        buttonsToHide = document.getElementsByClassName("yesno");
        for(let i = 0; i < buttonsToHide.length; i++) {
            buttonsToHide[i].style.display = "none";
        }
        
        startNewGame();
    }
}

function mobileNo() {
    if(acceptingInput) {
        acceptingInput = false;

        buttonsToHide = document.getElementsByClassName("yesno");
        for(let i = 0; i < buttonsToHide.length; i++) {
            buttonsToHide[i].style.display = "none";
        }

        current.ref = components[getComponentIndex("extra")].ref;

        components[getComponentIndex("extra")].content = "";

        replace(components[getComponentIndex("extra")].content);
    }
}

function toggleMobileControlsFromMenu() {
    console.clear();
    
    if(settingsOpen || tutorialOpen) {
        let buttonsToHide = document.getElementsByClassName("button");
        for(let i = 0; i < buttonsToHide.length; i++) {
            buttonsToHide[i].style.display = "none";
        }
        
        buttonsToHide = document.getElementsByClassName("yesno");
        for(let i = 0; i < buttonsToHide.length; i++) {
            buttonsToHide[i].style.display = "none";
        }
    }
    else if(acceptingInput) {
        if(!(gameOver)) {
            let buttonsToShow = document.getElementsByClassName("button");
            for(let i = 0; i < buttonsToShow.length; i++) {
                buttonsToShow[i].style.display = "flex";
            }
            
            buttonsToHide = document.getElementsByClassName("yesno");
            for(let i = 0; i < buttonsToHide.length; i++) {
                buttonsToHide[i].style.display = "none";
            }
        }
        else {
            buttonsToHide = document.getElementsByClassName("button");
            for(let i = 0; i < buttonsToHide.length; i++) {
                buttonsToHide[i].style.display = "none";
            }

            let buttonsToShow = document.getElementsByClassName("yesno");
            for(let i = 0; i < buttonsToShow.length; i++) {
                buttonsToShow[i].style.display = "flex";
            }
        }
    }
}

// when a key is pressed that actually does something in the game keep the cursor on
function resetCursorBlink() {
    validInput = false;

    clearInterval(blinkingCursorInterval);
    // have to set to false because cursorBlink() inverts cursorOn right away before doing anything else
    cursorOn = false;
    cursorBlink();

    blinkingCursorInterval = window.setInterval(cursorBlink, cursorBlinkRate);
}

// the position of the user, which is their index of the main game content
let pos = 0;
// if the player is on the left side of the game or not
let onLeft = true;
let lastPos = -2;
let lastLine = -1;
/**
 * note that when switching sides, have to clear the cursor on current side first by setting pos to -1 and calling displayCursor()
 */
/**
 * also note that this function is called before onChar is updated for the current frame
 */
function horizontalMove(amount) {
    let goToLeft = false;
    let goToRight = false;

    let line = Math.floor(pos / lineLength);
    let originalPosition = pos;

    // on the left side
    if(onLeft) {
        // don't allow moving left if it will move player out of bounds
        if(pos + amount >= 0) {
            // move to right side if on the edge and moving right
            if(!(mobile)) {
                if((amount == 1) && ((pos % lineLength) + Math.abs(amount) > lineLength - 1)) {
                    let actualPos = pos;
                    
                    pos = -1;
                    clearCursor();
                    pos = actualPos - (lineLength - 1);
                    
                    onLeft = false;
                }
                // regular movement
                else {
                    pos += amount;
                }
            }
            // regular movement
            else {
                pos += amount;

                // when on mobile go from left to right side when moving to the right and reached the end
                if(mobile) {
                    if(pos >= (lineCount * lineLength)) {
                        clearCursor();
                        
                        onLeft = false;
                        
                        pos = originalPosition - (lineLength * (lineCount - 1)) - (lineLength - 1);
                        displayCursor();
                    }
                }
            }
        }
    }
    // on the right side
    else {
        // don't allow moving right if it will move player out of bounds
        if(pos + amount < lineLength * lineCount)  {
            if(!(mobile)) {
                // move to left side if on the edge and moving left
                if((amount == -1) && ((pos % lineLength) - Math.abs(amount) < 0)) {
                    let actualPos = pos;
                    
                    pos = -1;
                    clearCursor();
                    pos = actualPos + (lineLength - 1);
                    
                    onLeft = true;
                }
                // regular movement
                else {
                    pos += amount;
                }
            }
            // regular movement
            else {
                pos += amount;

                // when on mobile go from left to right side when moving to the right and reached the end
                if(mobile) {
                    if(pos < 0) {
                        clearCursor();

                        onLeft = true;

                        pos = originalPosition + (lineLength * (lineCount - 1)) + (lineLength - 1);
                        displayCursor();
                    }
                }
            }
        }
    }

    if(!(onChar)) {
        let onEdgeOfWord = false;
        
        if(onLeft) {
            onEdgeOfWord = (pos == lettersLeftIndices[startIndex - 1]) || (pos == lettersLeftIndices[endIndex + 1]);
        }
        else {
            onEdgeOfWord = (pos == lettersRightIndices[startIndex]) || (pos == lettersRightIndices[endIndex]);
        }
        
        let oldPos = pos;

        // only change position more than normal when moving if not on the edge of the word
        if(!(onEdgeOfWord)) {    
            // moving to the right
            if(amount > 0) {
                if(onLeft) {
                    pos = lettersLeftIndices[endIndex] + 1;
                }
                else {
                    pos = lettersRightIndices[endIndex] + 1;
                }
            }
            // moving to the left
            else {
                if(onLeft) {
                    pos = lettersLeftIndices[startIndex] - 1;
                }
                else {
                    pos = lettersRightIndices[startIndex] - 1;
                }
            }
        }
        

        // horizontally move from one side to the other when moving across a
        if(!(mobile) && movedOnToWord) {
            movedOnToWord = false;

            // go to the right side
            if(onLeft && (amount > 0)) {
                let lineOfStartOfWord = Math.floor((pos - (cursorContent.length)) / lineLength);
                let lineOfEndOfWord = Math.floor(pos / lineLength);
                let lineOfLastPos = Math.floor(lastPos / lineLength);

                if((lineOfEndOfWord > lineOfStartOfWord) && (lineOfLastPos == lineOfStartOfWord)) {
                    let actualPos = pos;
                    pos = -1;
                    clearCursor();
                    // wthat the frick is this, why is this so complicated
                    pos = Math.floor((actualPos - cursorContent.length) / lineLength) * lineLength;

                    onLeft = false;
                }
            }
            // go to the left side
            else if(!(onLeft) && (amount < 0)) {
                let lineOfStartOfWord = Math.floor(pos / lineLength);
                let lineOfEndOfWord = Math.floor((pos + cursorContent.length) / lineLength);
                let lineOfLastPos = Math.floor(lastPos / lineLength);

                if((lineOfEndOfWord > lineOfStartOfWord) && (lineOfLastPos == lineOfEndOfWord)) {
                    let actualPos = pos;
                    pos = -1;
                    clearCursor();
                    // wthat the frick is this, why is this so complicated
                    pos = (lineOfLastPos * lineLength) + lineLength - 1;

                    onLeft = true;
                }
            }
        }
    }

    lastLine = Math.floor(pos / lineLength);
    
    displayCursor();

    lastPos = pos;
}

/**
 * note that when switching sides, have to clear the cursor on current side first by setting pos to -1 and calling displayCursor()
 */
function verticalMove(amount) {
    // reset value to prevent going down and left or right from moving to the other side
    lastPos = -2;
    let originalPosition = pos;
    pos += lineLength * amount;

    if(pos < 0) {
        if(onLeft) {
            pos -= lineLength * amount;
        }
        else {         
            clearCursor();

            onLeft = true;

            pos = originalPosition + (lineLength * (lineCount - 1));
            displayCursor();
        }
    }
    else if(pos >= (lineCount * lineLength)) {
        if(onLeft) {
            clearCursor();
            
            onLeft = false;
            
            pos = originalPosition - (lineLength * (lineCount - 1));
            displayCursor();
        }
        else {         
            pos -= lineLength * amount;
        }
    }
    else {
        displayCursor();
    }
}

let onChar = true;
function displayCursor() {
    // left
    if(onLeft) {
        checkCursorSelected(true);
        
        left = "";

        for(let i = 0; i < leftNoSpan.length; i++) {

            if((i > 0) && (i % lineLength === 0)) {
                left += "<br>";
            }
            
            if(onChar) {
                if(i == pos) {
                    cursorContent = leftNoSpan.charAt(i);
                    left += "<span>" + leftNoSpan.charAt(i) + "</span>";
                }
                else {
                    left += leftNoSpan.charAt(i);
                }
            }
            else {
                if((i == lettersLeftIndices[startIndex]) && 
                (pos >= lettersLeftIndices[startIndex]) && (pos <= lettersLeftIndices[endIndex])) {
                    left += "<span>";
                    
                    for(let index = 0; index < cursorContent.length; index++) {
                        if((i + index) % lineLength === 0) {
                            left += "<br>";
                        }

                        left += cursorContent[index];
                    }

                    left += "</span>";
                }
                else if((i < lettersLeftIndices[startIndex]) || (i > lettersLeftIndices[endIndex])) {
                    left += leftNoSpan.charAt(i);
                }
            }
        }
        
        current.ref = components[getComponentIndex("leftMain")].ref;
        update(left);
    }
    // right
    else {
        checkCursorSelected(false);

        right = "";

        for(let i = 0; i < rightNoSpan.length; i++) {
            if((i > 0) && (i % lineLength === 0)) {
                right += "<br>";
            }
            
            if(onChar) {
                if(i == pos) {
                    cursorContent = rightNoSpan.charAt(i);
                    right += "<span>" + rightNoSpan.charAt(i) + "</span>";
                }
                else {
                    right += rightNoSpan.charAt(i);
                }
            }
            else {
                if((i == lettersRightIndices[startIndex]) && 
                (pos >= lettersRightIndices[startIndex]) && (pos <= lettersRightIndices[endIndex])) {
                    right += "<span>";
                    
                    for(let index = 0; index < cursorContent.length; index++) {
                        if((i + index) % lineLength === 0) {
                            right += "<br>";
                        }

                        right += cursorContent[index];
                    }

                    right += "</span>";
                }
                else if((i < lettersRightIndices[startIndex]) || (i > lettersRightIndices[endIndex])) {
                    right += rightNoSpan.charAt(i);
                }
            }
        }
        
        current.ref = components[getComponentIndex("rightMain")].ref;
        update(right);
    }
}

let startIndex = -1;
let endIndex = -1;
let movedOnToWord = false;
function checkCursorSelected(checkingLeft) {

    let inWord = false;
    if(checkingLeft) {
        if(lettersLeftIndices.includes(pos)) {
            inWord = true;
            cursorContent = "";
    
            let index = lettersLeftIndices.indexOf(pos);
            
            while(lettersLeftIndices[index - 1] == lettersLeftIndices[index] - 1) {
                --index;
            }
            startIndex = index;
    
            while(lettersLeftIndices[index + 1] == lettersLeftIndices[index] + 1) {
                cursorContent += leftNoSpan[lettersLeftIndices[index]];
                
                ++index;
            }
            // need to do this to get the last letter
            cursorContent += leftNoSpan[lettersLeftIndices[index]];
            endIndex = index;
        }
    }
    else {
        if(lettersRightIndices.includes(pos)) {
            inWord = true;
            cursorContent = "";
    
            let index = lettersRightIndices.indexOf(pos);
            
            while(lettersRightIndices[index - 1] == lettersRightIndices[index] - 1) {
                --index;
            }
            startIndex = index;
    
            while(lettersRightIndices[index + 1] == lettersRightIndices[index] + 1) {
                cursorContent += rightNoSpan[lettersRightIndices[index]];
                
                ++index;
            }
            // need to do this to get the last letter
            cursorContent += rightNoSpan[lettersRightIndices[index]];
            endIndex = index;
        }
    }
    
    onChar = !(inWord);

    movedOnToWord = inWord;
}

function getSelectedWord() {
    let word = "";

    for(let i = startIndex; i < (endIndex + 1); i++) {
        if(onLeft) {
            word += leftNoSpan[lettersLeftIndices[i]];
        }
        else {
            word += rightNoSpan[lettersRightIndices[i]];
        }
    }

    return word;
}

function getSimilarity(word) {
    let similarity = 0;
    let checkedChars = [];

    for(let i = 0; i < word.length; i++) {

        if(!(checkedChars.includes(word.charAt(i)))) {
            for(let j = 0; j < password.length; j++) {

                if(password.charAt(j) == word.charAt(i)) {
                    ++similarity;
                    checkedChars.push(word.charAt(i));

                    break;
                }

            }
        }

    }

    return similarity;
}

let selectedWord = "";
let extraLineIndicator = "> ";
function attemptWord() {
    selectedWord = getSelectedWord();

    // make sure that the word has not already been attempted
    if(!(selectedWord.includes("."))) {
        document.removeEventListener("keydown", keydown);
        acceptingInput = false;
        
        if(blinkCursor) {
            resetCursorBlink();
            // for some reason just clearing the interval doesn't work and have to call resetCursorBlink() first
            clearInterval(blinkingCursorInterval);
        }

        if(selectedWord == password) {
            gamewin();
        }
        else {
            --gameData.attempts;

            // replace attempt with dots

            let nextWait = 0;

            if(gameData.difficulty != 7) {
                let length = selectedWord.length;
                
                if(onLeft) {
                    nextWait = calcTimeToPrint(left);

                    for(let i = 0; i < leftNoSpan.length - length; i++) {
                        let substring = leftNoSpan.substring(i, i + length);
                        
                        if(substring == selectedWord) {
    
                            for(let j = i; j < i + length; j++) {
                                let left = leftNoSpan.substring(0, j);
                                let right = leftNoSpan.substring(j + 1, leftNoSpan.length);
    
                                leftNoSpan = left + "." + right;
                            }   
                        }
    
                    }
                }
                else {
                    nextWait = calcTimeToPrint(left);

                    for(let i = 0; i < rightNoSpan.length - length; i++) {
                        let substring = rightNoSpan.substring(i, i + length);
                        
                        if(substring == selectedWord) {
    
                            for(let j = i; j < i + length; j++) {
                                let left = rightNoSpan.substring(0, j);
                                let right = rightNoSpan.substring(j + 1, rightNoSpan.length);
    
                                rightNoSpan = left + "." + right;
                            }   
                        }
    
                    }
                }
    
                displayCursor();
            }

            // update password attempts display

            current.ref = components[getComponentIndex("top")].ref;

            components[getComponentIndex("top")].content = topCompleteContent;
            for(let i = 0; i < gameData.attempts; i++) {
                components[getComponentIndex("top")].content += passwordAttemptCharacter;
            }
            
            replace(components[getComponentIndex("top")].content);

            let timeScale = 1;

            window.setTimeout(function() {
                // show attempted password similarity to actual password

                current.ref = components[getComponentIndex("extra")].ref;

                if(gameData.difficulty != 7) {
                    components[getComponentIndex("extra")].content += extraLineIndicator + selectedWord + "<br>";
                }
                components[getComponentIndex("extra")].content += extraLineIndicator + "incorrect password" + "<br>";
                components[getComponentIndex("extra")].content += extraLineIndicator + "similarity: " + getSimilarity(selectedWord) + "<br>";
                components[getComponentIndex("extra")].content += extraLineIndicator + "<br>";
                
                replace(components[getComponentIndex("extra")].content);

                window.setTimeout(function() {
                    if(gameData.attempts == 0) {
                        gameover();
                    }
                    else {
                        document.addEventListener("keydown", keydown);
                        acceptingInput = true;

                        resetCursorBlink();
                    }
                }, calcTimeToPrint(components[getComponentIndex("extra")].content) * timeScale);

            }, calcTimeToPrint(components[getComponentIndex("top")].content) * timeScale);

        }

    }
}


function gameover() {
    // update stuff on the right side
    current.ref = components[getComponentIndex("extra")].ref;
    
    components[getComponentIndex("extra")].content += extraLineIndicator + "you have run out of attempts" + "<br>";
    components[getComponentIndex("extra")].content += extraLineIndicator + "the actual password was: " + password;
    
    replace(components[getComponentIndex("extra")].content);
    
    nextGameMenu();
}

function gamewin() {
    // update stuff on the right side
    current.ref = components[getComponentIndex("extra")].ref;
    
    components[getComponentIndex("extra")].content += extraLineIndicator + "you have successfully guessed" + "<br>";
    components[getComponentIndex("extra")].content += extraLineIndicator + "that the password was: " + password;
    
    replace(components[getComponentIndex("extra")].content);
    
    nextGameMenu();
}

let timeAfterGame = 3 * 1000;

let gameOver = false;
function nextGameMenu() {
    // update right side
    window.setTimeout(function() {
        // have to set pos to -1 because clearCursor does not print the chracter at pos
        pos = -1;

        if(onLeft) {
            current.ref = components[getComponentIndex("leftMain")].ref;
            clearCursor(left);
        }
        else {
            current.ref = components[getComponentIndex("rightMain")].ref;
            clearCursor(right);
        }

        window.setTimeout(function() {
            gameOver = true;

            // update content off to the side
            current.ref = components[getComponentIndex("extra")].ref;
    
            components[getComponentIndex("extra")].content = "";

            components[getComponentIndex("extra")].content += extraLineIndicator + "start a new game?<br>";
            components[getComponentIndex("extra")].content += extraLineIndicator + "press y for yes<br>";
            components[getComponentIndex("extra")].content += extraLineIndicator + "press n for no";
        
            replace(components[getComponentIndex("extra")].content);

            window.setTimeout(function() {
                document.addEventListener("keydown", nextGameKeyDetection);
                
                let buttonsToHide = document.getElementsByClassName("button");
                for(let i = 0; i < buttonsToHide.length; i++) {
                    buttonsToHide[i].style.display = "none";
                }

                let buttonsToShow = document.getElementsByClassName("yesno");
                for(let i = 0; i < buttonsToShow.length; i++) {
                    buttonsToShow[i].style.display = "inline-block";
                }

                acceptingInput = true;
            }, calcTimeToPrint(components[getComponentIndex("extra")].content));
        }, timeAfterGame / 2);

    }, timeAfterGame);
}

function nextGameKeyDetection(e) {
    if(e.key == "y") {
        gameOver = false;

        document.removeEventListener("keydown", nextGameKeyDetection);
        
        startNewGame();
    }
    if(e.key == "n") {
        document.removeEventListener("keydown", nextGameKeyDetection);

        current.ref = components[getComponentIndex("extra")].ref;

        components[getComponentIndex("extra")].content = "";

        replace(components[getComponentIndex("extra")].content);
    }
}

function startNewGame() {
    let cssRef = document.styleSheets[0].cssRules[1].style;
    mainColor = cssRef.getPropertyValue("--mainColor");
    bgColor = cssRef.getPropertyValue("--bgColor");
    
    // update content off to the side
    current.ref = components[getComponentIndex("extra")].ref;
    components[getComponentIndex("extra")].content = extraLineIndicator + "starting a new game...";
    replace(components[getComponentIndex("extra")].content);
    
    window.setTimeout(function() {
        // clear all stuff on the screen
        for(let i = 0; i < components.length; i++) {
            current.ref = components[i].ref;
            
            components[i].content = "";
    
            replace(components[i].content);    
        }

        // reset stuff
        let actualDifficulty = gameData.difficulty;
        if(queuedDifficulty != -1) {
            actualDifficulty = queuedDifficulty
        }

        gameData.difficultyOptions = [3, 4, 5, 7];
        gameData.difficulty = -1;
        gameData.wordLength = -1;
        gameData.wordFrequency = 0;
        gameData.attempts = -1;
        gameData.maxWords = -1;
        gameData.wordCount = 0;
        gameData.quadrantsWordCount = [0, 0, 0, 0];
        gameData.maxWordsPerQuadrant = -1;
        
        printIndex = 0;
        cursorContent = "";
        components = [];
        lettersLeftIndices = [];
        lettersRightIndices = [];
        generatedWords = [];
        password = "not yet set";
        originalLeft = "";
        originalRight = "";
        leftNoSpan = "";
        rightNoSpan = "";
        left = "";
        right = "";
        validInput = false;
        pos = 0;
        onLeft = true;
        lastPos = -2;
        lastLine = -1;
        onChar = true;
        startIndex = -1;
        endIndex = -1;
        selectedWord = "";

        setDifficulty(actualDifficulty);

        components.push(new Component('top'));
        components[0].content = 'please wait . . . initializing system<br>.<br>..<br>...';
        
        components.push(new LineNumbersComponent('leftLineNumbers'));
        
        components.push(new MainComponent('leftMain'));
        
        components.push(new LineNumbersComponent('rightLineNumbers'));
        
        components.push(new MainComponent('rightMain'));
        
        components.push(new Component('extra'));
        components[components.length - 1].content = "";
        
        window.setTimeout(function() {
            setup(0);
        }, 200);
    }, timeAfterGame);
}

let mobile = false;
window.onload = () => {
    // get color values defined in CSS
    let cssRef = document.styleSheets[0].cssRules[1].style;
    mainColor = cssRef.getPropertyValue("--mainColor");
    bgColor = cssRef.getPropertyValue("--bgColor");

    let styles = getComputedStyle(document.getElementById("bottomHalf"));
    let mobileCheck = styles.flexDirection;
    mobile = (mobileCheck == "column");

    setDifficulty(3);

    components.push(new Component('top'));
    components[0].content = 'please wait . . . initializing system<br>.<br>..<br>...';
    
    components.push(new LineNumbersComponent('leftLineNumbers'));
    
    components.push(new MainComponent('leftMain'));
    
    components.push(new LineNumbersComponent('rightLineNumbers'));
    
    components.push(new MainComponent('rightMain'));
    
    components.push(new Component('extra'));
    components[components.length - 1].content = "";
    
    window.setTimeout(function() {
        setup(0);
    }, 200);
};
