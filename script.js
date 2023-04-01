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

let printIndex = 0;
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
        window.setTimeout(function() {
            print(content);
        }, printSpeed);
    } else {
        printIndex = 0;
    }
}

// like print, but instantly prints stuff out
function update(content) {
    current.ref.innerHTML = content;
}

function replace(content) {
    current.ref.innerHTML = '';
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

let gameData = {
    difficultyOptions: [3, 4, 5, 7],
    difficulty: -1,
    wordLength: -1,
    wordFrequency: 0,
    attempts: -1,
    maxWords: -1,
    wordCount: 0,
    maxBracketSets: -1,
    bracketSetCount: 0,
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
        // this.wordFrequency = this.difficulty - 3;
        // for(let i = 0; i < this.wordFrequency; i++) {
        //     MainComponent.possibleChars.push("w");
        // }
        this.maxWords = this.difficulty + 2;
        this.maxBracketSets = this.maxWords - 2;
        
        this.maxWordsPerQuadrant = Math.ceil(this.maxWords / 4);
        
        this.attempts = (this.difficultyOptions[0] * 2) - this.difficulty;
        if(this.attempts < 1) {
            this.attempts = 1;
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
            'w', 'b'
    ];
    
    // the set of brackets to choose from when a bracket set is chosen
    static possibleBrackets = ["()", "{}", "[]", "<>"];
    
    constructor(name) {
        super(name);

        this.generate();
    }
    
    // POSSIBLY split this into multiple smaller functions
    generate() {
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
                    if(lastSelection != "w" && lastSelection != "b" && gameData.wordCount < gameData.maxWords) {
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
                        
                        if(gameData.quadrantsWordCount[quad] < gameData.maxWordsPerQuadrant) {
                            ++gameData.wordCount;
                            ++gameData.quadrantsWordCount[quad];
                            
                            
                            do {
                                wordToPrint = words[random(0, words.length - 1)];
                            }
                            while (gameData.wordLength > wordToPrint.length);
                            
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
                else if(selection == "b") {
                    /* make sure that there are never 2 consecutive words, and make sure that a
                    word is never in a set of brackets */
                    if(lastSelection != "w" && lastSelection != "b" && gameData.bracketSetCount < gameData.maxBracketSets) {
                        ++gameData.bracketSetCount;
                        
                        // first determine the number of characters between the brackets (does not include brackets)
                        let bracketSetLength = random(2, 5);
                        
                        // choose which brackets to use
                        let bracketSet = MainComponent.possibleBrackets[
                            random(0, MainComponent.possibleBrackets.length - 1)];
                        
                        // start generating the bracket sequence by adding the opening bracket from the chosen bracket set
                        wordToPrint = bracketSet.charAt(0);
                        
                        // add all of the random characters in between the brackets
                        for(let j = 0; j < bracketSetLength; j++) {
                            wordToPrint +=
                            /* 3 + gameData.wordFrequency because the 3 gets the the last regular possibleChar that is not
                            a word or bracket, but then have to add gameData.wordFrequency to account for all of the extra
                            w's that are added into the array*/
                            MainComponent.possibleChars[
                            random(0,
                            MainComponent.possibleChars.length - (3 + gameData.wordFrequency))];
                            // "█";
                        }
                        
                        // finish the bracket sequence by adding the closing bracket
                        wordToPrint += bracketSet.charAt(1);
                        
                        lastSelection = selection;
                        
                        // print out the first character of wordToPrint
                        selection = bracketSet.charAt(0);
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
            
            // reached the end of the current line
            if(i % lineLength === 0) {
                this.content += "<br>";
            }
            
        }
      }
}

let gameDivHeight = 0;
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

            window.setTimeout(function () {
                setup(component + 1);
            }, calcTimeToPrint(components[component].content));
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

            components[getComponentIndex("top")].content =
                'hello, and welcome to the system!<br>please enter your password<br><br>password attempts: █ █ █';
            
            replace(components[getComponentIndex("top")].content);

            window.setTimeout(function () {
                play();
            }, calcTimeToPrint(components[getComponentIndex("top")].content));
        }
    }
}

// the followingare for the left and right game content
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
        if(originalLeft.substring(i, i + 4) == '<br>') {
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
function play() {
    formatMainContent();

    window.setTimeout(function () {
        displayCursor();
        
        window.setTimeout(function() {
            keydownListener = document.addEventListener("keydown", keydown);
        }, 250);
    }, 500);
}

function keydown(e) {
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
    }
    
}

// the position of the user, which is their index of the main game content
let pos = 0;
// if the player is on the left side of the game or not
let onLeft = true;

/**
 * note that when switching sides, have to clear the cursor on current side first by setting pos to -1 and calling displayCursor()
 */
function horizontalMove(amount) {
    // on the left side
    if(onLeft) {
        // don't allow moving left if it will move player out of bounds
        if(pos + amount >= 0) {
            pos += amount;
            
            // move from left side to right side
            if(pos >= lineLength * lineCount)  {
                // clear cursor on left side
                pos = -1;
                displayCursor();
                
                onLeft = false;
                
                pos = 0;
            }
        }
    }
    // on the right side
    else {
        // don't allow moving right if it will move player out of bounds
        if(pos + amount < lineLength * lineCount)  {
            pos += amount;
            
            // move from right side to left side
            if(pos < 0) {
                // clear cursor on right side
                pos = -1;
                displayCursor();
                
                onLeft = true;
                
                pos = (lineLength * lineCount) - 1;
            }
        }
    }
    
    displayCursor();
}

/**
 * note that when switching sides, have to clear the cursor on current side first by setting pos to -1 and calling displayCursor()
 */
function verticalMove(amount) {
    let originalPosition = pos;
    pos += lineLength * amount;

    if(pos < 0) {
        if(onLeft) {
            pos -= lineLength * amount;
        }
        else {         
            // clear cursor on right side
            pos = -1;
            displayCursor();

            onLeft = true;

            pos = originalPosition + (lineLength * (lineCount - 1));
            displayCursor();
        }
    }
    else if(pos >= (lineCount * lineLength)) {
        if(onLeft) {
            // clear cursor on left side
            pos = -1;
            displayCursor();
            
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

function select() {
    //
}

function displayCursor() {
    // left
    if(onLeft) {
        left = "";
        
        for(let i = 0; i < leftNoSpan.length; i++) {
            if(i > 0 && i % lineLength === 0) {
                left += "<br>"
            }
            
            if(i == pos) {
                left += "<span>" + leftNoSpan.charAt(i) + "</span>";
            }
            else {
                left += leftNoSpan.charAt(i);
            }
        }
        
        current.ref = components[getComponentIndex("leftMain")].ref;
        update(left);
    }
    // right
    else {
        right = "";
        
        for(let i = 0; i < rightNoSpan.length; i++) {
            if(i > 0 && i % lineLength === 0) {
                right += "<br>"
            }
            
            if(i == pos) {
                right += "<span>" + rightNoSpan.charAt(i) + "</span>";
            }
            else {
                right += rightNoSpan.charAt(i);
            }
        }
        
        current.ref = components[getComponentIndex("rightMain")].ref;
        update(right);
    }
    
    // console.clear();
    // console.log(pos, leftNoSpan.charAt(pos), onLeft);
    // console.log(originalLeft.length, originalLeft)
    // console.log(leftNoSpan.length, leftNoSpan);
    // console.log(left.length, left);
}

window.onload = () => {
    setDifficulty(4);
    
    components.push(new Component('top'));
    components[0].content = 'please wait . . . initializing system<br>.<br>..<br>...';
    
    components.push(new LineNumbersComponent('leftLineNumbers'));
    
    components.push(new MainComponent('leftMain'));
    
    components.push(new LineNumbersComponent('rightLineNumbers'));
    
    components.push(new MainComponent('rightMain'));
    
    components.push(new Component('extra'));
    components[components.length - 1].content = ">nothing";
    
    window.setTimeout(function() {
        setup(0);
    }, 250);
};