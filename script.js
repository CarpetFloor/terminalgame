const printSpeed = 15;
// number of vertical lines in playable game area
const lineCount = 16;
const lineLength = 12;

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
function print(content) {
    if(content.substring(printIndex, printIndex + 4) == '<br>') {
        current.ref.innerHTML += '<br>';

        printIndex += 3;
    }
    else {
        current.ref.innerHTML += (content.charAt(printIndex)).toString();
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

function replace(content) {
    current.ref.innerHTML = '';
    print(content);
}

/**
 * not able to just get the length of the content and multiply by printSpeed because <br> is used for newlines, 
 * and when printing doesn't take any longer than a single character
 */
function calcTimeToPrint(content) {
    let length = 0;

    for(let i = 0; i < content.length; i++) {
        ++length;

        if(content.substring(i, i + 4) == '<br>') {
            i += 3;
        }
    }
    
    let speed = Math.floor(printSpeed * 1.25);
    if(printSpeed === 0) {
        speed = 10;
    }

    return length * speed;
}


window.onload = () => {
    setup(0);
}

// position of user
let position = {
    row: -1, 
    i: -1
}

let gameData = {
    difficultyOptions: [3, 4, 5, 7], 
    /**
     * Impacts:
     * -Word length
     * -Word occurance
     * -Bracket occurance
     * -Lives
     */
    difficulty: -1, 
    wordLength: -1, 
    wordFrequency: -1, 
    bracketFrequency: -1,
    lives: -1, 
    initialize: function() {
        this.difficulty = this.difficultyOptions[0];
        this.wordLength = this.difficulty;
        this.wordFrequency = this.difficulty - 3;
        this.bracketFrequency = this.wordFrequency;
        this.lives = (this.difficultyOptions[0] * 2) - this.difficulty;
        if(this.lives < 1) {
            this.lives = 1;
        }
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
let lineRightStartsOn = -1;
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
    constructor(name) {
        super(name);

        /**
         * the last two are for adding a word, 
         * or adding matching brackets
         */
        this.possibleChars = [
            '[', ']', '{', '}', 
            '(', ')', "<", ">", 
            '!', '@', '#', '$', 
            '%', "^", '&', '*', 
            '-', '_', '=', '+', 
            '\\', '|', ';', ':', 
            "'", '"', ',', '.', 
            '`', '~', 
            'word', 'brackets' 
        ];

        this.lines = [];
    }

    generate() {
        for(let i = 0; i < lineCount; i++) {
            let currentLine = "";

            for(let j = 0; j < lineLength; j++) {
                let selection = "";

                // there is enough room to fit a word or bracket
                if(j < (lineLength - gameData.wordLength)) {
                    selection = this.possibleChars[random(0, this.possibleChars.length - 1)];
                }
                else {
                    selection = this.possibleChars[random(0, this.possibleChars.length - 3)];
                }

                currentLine += selection;
            }

            this.lines += currentLine;
        }
    }
}

// font used does not have different cases, so can simply write all text in lowercase
components.push(new Component('top'));
components[0].content = 'please wait . . . initializing system<br>.<br>..<br>...';
components.push(new LineNumbersComponent('leftLineNumbers'));
components.push(new MainComponent('leftMain'));
components.push(new LineNumbersComponent('rightLineNumbers'));
// components.push(new MainComponent('rightMain'));
// components.push(new Component('extra'));

function setup(component) {
    if(component === 0) {
        gameData.initialize();
    }

    if(component <= components.length) {
        if(component < components.length) {
            current.ref = components[component].ref;

            print(components[component].content);

            window.setTimeout(function () {
                setup(component + 1);
            }, calcTimeToPrint(components[component].content));
        }
        // reprint top
        else {
            current.ref = components[getComponentIndex("top")].ref;

            components[getComponentIndex("top")].content = 
                'hello, and welcome to the system!<br>please enter your password<br><br>password attempts: █ █ █';
            
            replace(components[getComponentIndex("top")].content);

            window.setTimeout(function () {
                play();
            }, calcTimeToPrint(components[getComponentIndex("top")].content));
        }
    }
}


function play() {
    console.log("game started!");
}