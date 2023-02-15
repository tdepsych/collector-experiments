
  /* ******************************************************************************************************************************* 
     The base code for the wordsearch was taken from Li Zhineng's Word Search Puzzle (https://github.com/lizhineng/word-search-game) 
     This has then been heavily adapted to make it a behavioural task with scoring, and random-without-replacement stimuli          
     ******************************************************************************************************************************* */ 

  // // First, work out if this is the first wordsearch attempted. This is needed as it dictates where to select the stimuli words from later
  var firstWordsearch = '';
  if (parent.parent.firstWordsearch == 1) {
    firstWordsearch = 'no';
  } else {
    firstWordsearch = 'yes';
  }
  
  //================= //
  // TASK LENGTH (MS) //
  //================= //
  
  // This sets how long the task lasts before ending automatically. The timing is in ms (300,000 = 5min)
  // Phase.set_timer(function(){Phase.submit(parent.parent.global_count++)},300000);
  Phase.set_timer(function(){Phase.submit()},300000);
  
  // This is just a variable function to reverse the highleted word - needed to check both forward and backwards highlighting ←  {IGNORE} 
  const reverse = s => [].reduceRight.call(s, (a, b) => a + b)
  
  // This is just an empty variable needed for the randomisation of the stimuli ←  {IGNORE} 
  var source_array = '';
  
  
  // This just stops the javascript running until the page has actually appeared on screen - needed to ensure the timer doesn't start early etc.
// Phase.set_timer(function(){ 
    
  var hideList = '{{task_body_text}}';
  if (hideList == "Yes") {
    $('.ws-words').hide();
    // console.log("They get the word list");
  } else {
    console.log("They get the word list");
  }

  //================ //
  // STIMULI SORTING //
  //================ // 
  
  /* First we just check if the stimuli list have been generated before, if not, this is the first wordsearch and we use the whole list
     if it does exist, we use the existing list, as that will have had the previously used words removed. */
  
  // if (parent.parent.global_count == 1) {
  if (firstWordsearch == 'yes') {
    console.log("First Wordsearch"); 
    parent.parent.firstWordsearch = 1;
    // Get the source words from the procedure sheet  
    var source_words_nt = 'book,bake,chair,glass,sink,cork,knot,rain,ship,vest,flirt,joke,lust,star,gift,bird,cake,grin,silk,wise,debt,evil,fire,rage,fight,crime,dirt,sick,fault,tomb';
    var source_words_t = 'bitch,cock,fuck,shit,whore,twat,slut,dildo,cunt,crap';
    
    // Change the words into useable arrays
    source_words_nt = source_words_nt.split(',');
    source_words_t = source_words_t.split(',');

    // Shuffle the source word arrays
    var shuffled_NonTaboo = shuffle(source_words_nt); // Shuffle the non-taboo words
    var shuffled_Taboo = shuffle(source_words_t); // Shuffle the non-taboo words

    // Select the first 5 taboo words
    var tabooWords1 = source_words_t.slice(0, 5);

    // Select the required number of non-taboo words
    var nonTabooWords1 = source_words_nt.slice(0, 15);

    // Merge the selected taboo words with the non-taboo words
    var selectedWords = $.merge( $.merge( [], tabooWords1 ), nonTabooWords1 );

    // Shuffle the stimuli array  
    var grid_stimuli = shuffle(selectedWords); // Shuffle the selected words to randomise the displayed word list
    
    console.log("First Words: " + grid_stimuli); 
    
    // Set the value of a hidden input to be the stimuli words. 
    document.getElementById("ws_wordList").value = grid_stimuli; // this saves them in our data spreadsheet meaning we know what words were on what wordsearch puzzle
    
    // Get the five unused taboo words
    var TabooRemain = source_words_t.slice(5,10);
    
    // Get the five unused non taboo words
    var nonTabooRemain = source_words_nt.slice(15,30);
      
    // Merge the unused words into a single variable
    var remainingStimuli = $.merge( $.merge( [], TabooRemain ), nonTabooRemain );
    
    // Store the remaining 20 words into a global variable
    parent.parent.stimuli_TabooRemain = remainingStimuli;
       
  } else {
    // As we're only running 2 wordsearches, we can simply pass in the previous array and we're good to go
    console.log("Second Wordsearch"); 
    
    // Shuffle the stimuli array  
    var grid_stimuli = shuffle(parent.parent.stimuli_TabooRemain); // Shuffle the selected words to randomise the displayed word list
       
    console.log("Second Words: " + grid_stimuli); 
    
    // Set the value of a hidden input to be the stimuli words. 
    document.getElementById("ws_wordList").value = grid_stimuli; // this saves them in our data spreadsheet meaning we know what words were on what wordsearch puzzle
  }


  //============ //
  //PROGRESS BAR //
  //============ //
          
  // This creates the progress bar
  Phase.set_timer(function(){
  function createProgressbar(id, duration, callback) {
    // We select the div that we want to turn into a progressbar
    var progressbar = document.getElementById(id);
    progressbar.className = 'progressbar';
    // We create the div that changes width to show progress
    var progressbarinner = document.createElement('div');
    progressbarinner.className = 'inner';
    // Now we set the animation parameters
    progressbarinner.style.animationDuration = duration;
    // Eventually couple a callback
    if (typeof(callback) === 'function') {
      progressbarinner.addEventListener('animationend', callback);
    }   
    // Append the progressbar to the main progressbardiv
    progressbar.appendChild(progressbarinner);
    // When everything is set up we start the animation
    progressbarinner.style.animationPlayState = 'running';
  }
  createProgressbar('progressbar1', '300s'); // If you want to change how long the bar lasts, alter the '180s' (it's total seconds)
  },1);

// ========== //        
// WORDSEARCH //
// ========== //

// We just need to define a empty variable to allow it to be filled later - you can ignore this
var first = '';
var old_word_time = 0;

/* ------------------- */
/* IGNORE THIS SECTION */
/* ------------------- */

  /* Returns a random integer between min and max
     @param {Number} min
     @param {Number} max
     return {Number}
  */
        if (typeof Math.rangeInt != 'function') {
            Math.rangeInt = function(min, max){
              if (max == undefined) {
                  max = min;
                  min = 0;
              }
              return Math.floor(Math.random() * (max - min + 1)) + min;
            }
        }
  
  /*
    Mege two objects
    @param {Object} o1 Object 1
    @param {Object} o2 Object 2
    @return {Object}
  */
  
  if (typeof Object.merge != 'function') {
    Object.merge = function(o1, o2) {
      for (var i in o1) {
        o2[i] = o1[i];
      }
      return o2;
    }
  }
  (function(){
    'use strict';
  
    // Extend the element method
    Element.prototype.wordSearch = function(settings) {
      return new WordSearch(this, settings);
    }
  
    /**
    * Word seach
    *
    * @param {Element} wrapWl the game's wrap element
    * @param {Array} settings
    * constructor
    */
    function WordSearch(wrapEl, settings) {
      this.wrapEl = wrapEl;
  
      // Add `.ws-area` to wrap element
      this.wrapEl.classList.add('ws-area');
  
      //Words solved.
      this.solved = 0;
  
/* ---------------- */
/* DEFAULT SETTINGS */
/* ---------------- */

/*  These settings allow you to change the direction the words are placed in, the overall size of the wordsearch grid, and what the words included are
    By using {{text}}, you can dynamically set the list from the procedure spreadsheet by including the words in an array in the "text" column.
*/
      var default_settings = {
        'directions': ['W', 'N', 'WN', 'EN'],
        'gridSize': 15,
        'words': grid_stimuli,
        'wordsList' : [],
        'debug': false
      }

/* ------------------- */
/* IGNORE THIS SECTION */
/* ------------------- */

      this.settings = Object.merge(settings, default_settings);
      // Check the words' length if it is overflow the grid
      if (this.parseWords(this.settings.gridSize)) {
        // Add words into the matrix data
        var isWorked = false;
  
        while (isWorked == false) {
          // initialize the application
          this.initialize();
  
          isWorked = this.addWords();
        }
  
        // Fill up the remaining blank items
        if (!this.settings.debug) {
          this.fillUpFools();
        }
  
        // Draw the matrix into wrap element
        this.drawmatrix();
      }
    }
  
/* Anything this.settings.words ... needs to go after this point  */  

    /*
      Parse words
      @param {Number} Max size
      @return {Boolean}
    */
    WordSearch.prototype.parseWords = function(maxSize) {
      var itWorked = true;
  
      for (var i = 0; i < this.settings.words.length; i++) {
        // Convert all the letters to upper case      
        this.settings.wordsList[i] =  this.settings.words[i].trim();
        this.settings.words[i] =  removeDiacritics(this.settings.wordsList[i].trim().toUpperCase());
  
        var word = this.settings.words[i];
        if (word.length > maxSize) {
          alert('The length of word `' + word + '` is overflow the gridSize.');
          console.error('The length of word `' + word + '` is overflow the gridSize.');
          itWorked = false;
        }
      }
      return itWorked;
    }
  
    /* Put the words into the matrix */
    WordSearch.prototype.addWords = function() {
        var keepGoing = true,
          counter = 0,
          isWorked = true;
  
        while (keepGoing) {
          // Getting random direction
          var dir = this.settings.directions[Math.rangeInt(this.settings.directions.length - 1)],
            result = this.addWord(this.settings.words[counter], dir),
            isWorked = true;
  
          if (result == false) {
            keepGoing = false;
            isWorked = false;
          }
  
          counter++;
          if (counter >= this.settings.words.length) {
            keepGoing = false;
          }
        }
  
        return isWorked;
    }
    
  
/* ------------------------------------- */
/* SETTINGS FOR POSSIBLE WORD DIRECTIONS */
/* ------------------------------------- */

    /* Add word into the matrix 
       @param {String} word
       @param {Number} direction
    */
    WordSearch.prototype.addWord = function(word, direction) {
      var itWorked = true,
        directions = {
          'W': [0, 1], // Horizontal (From left to right)
          'N': [1, 0], // Vertical (From top to bottom)
          'WN': [1, 1], // From top left to bottom right
          'EN': [1, -1] // From top right to bottom left
        },
        row, col; // y, x
  
      switch (direction) {
        case 'W': // Horizontal (From left to right)
          var row = Math.rangeInt(this.settings.gridSize  - 1),
            col = Math.rangeInt(this.settings.gridSize - word.length);
          break;
  
        case 'N': // Vertical (From top to bottom)
          var row = Math.rangeInt(this.settings.gridSize - word.length),
            col = Math.rangeInt(this.settings.gridSize  - 1);
          break;
  
        case 'WN': // From top left to bottom right
          var row = Math.rangeInt(this.settings.gridSize - word.length),
            col = Math.rangeInt(this.settings.gridSize - word.length);
          break;
  
        case 'EN': // From top right to bottom left
          var row = Math.rangeInt(this.settings.gridSize - word.length),
            col = Math.rangeInt(word.length - 1, this.settings.gridSize - 1);
          break;
  
        default:
          var error = 'UNKNOWN DIRECTION ' + direction + '!';
          alert(error);
          console.log(error);
          break;
      }
      
/* ------------------- */
/* IGNORE THIS SECTION */
/* ------------------- */
  
      // Add words to the matrix
      for (var i = 0; i < word.length; i++) {
        var newRow = row + i * directions[direction][0],
          newCol = col + i * directions[direction][1];
  
        // The letter on the board
        var origin = this.matrix[newRow][newCol].letter;
  
        if (origin == '.' || origin == word[i]) {
          this.matrix[newRow][newCol].letter = word[i];
        } else {
          itWorked = false;
        }
      }
  
      return itWorked;
    }
  
    /** Initialize the application **/
    
    WordSearch.prototype.initialize = function() {
      /**
      * Letter matrix
      *
      * param {Array}
      */
      this.matrix = [];
  
      /**
      * Selection from
      * @Param {Object}
      */
      this.selectFrom = null;
  
      /**
      * Selected items
      */
      this.selected = [];
  
      this.initmatrix(this.settings.gridSize);
    }
  
    /**
    * Fill default items into the matrix
    * @param {Number} size Grid size
    */
    WordSearch.prototype.initmatrix = function(size) {
      for (var row = 0; row < size; row++) {
        for (var col = 0; col < size; col++) {
          var item = {
            letter: '.', // Default value
            row: row,
            col: col
          }
  
          if (!this.matrix[row]) {
            this.matrix[row] = [];
          }
  
          this.matrix[row][col] = item;
        }
      }
    }
  
  
/* ------------------- */
/* LETTER GRID STYLING */
/* ------------------- */

/* Draw the matrix */
    WordSearch.prototype.drawmatrix = function() {
      $(".ws_title").html("Found " + this.solved + " out of " + this.settings.words.length + " words so far" );
      for (var row = 0; row < this.settings.gridSize; row++) {
        // New row
        var divEl = document.createElement('div');
        divEl.setAttribute('class', 'ws-row');
        this.wrapEl.appendChild(divEl);
  
        for (var col = 0; col < this.settings.gridSize; col++) {
          var cvEl = document.createElement('canvas');
          cvEl.setAttribute('class', 'ws-col');
          // These lines control the sizes of the spacing around the indivudal letters
          cvEl.setAttribute('width', 30);
          cvEl.setAttribute('height', 30);
  
          // Fill text in middle center
          var x = cvEl.width / 2,
              y = cvEl.height / 2;
  
          var ctx = cvEl.getContext('2d');
          // These values change the appearence of each individual letter
          ctx.font = '400 20px Calibri';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#333'; // Text color
          ctx.fillText(this.matrix[row][col].letter, x, y);
  
          // Add event listeners
          cvEl.addEventListener('mousedown', this.onMousedown(this.matrix[row][col]));
          cvEl.addEventListener('mouseover', this.onMouseover(this.matrix[row][col]));
          cvEl.addEventListener('mouseup', this.onMouseup());
  
          divEl.appendChild(cvEl);
        }
      }
    }
  
/* ------------------- */
/* IGNORE THIS SECTION */
/* ------------------- */
  
    /* Fill up the remaining items */
    WordSearch.prototype.fillUpFools = function() {
      var rangeLanguage = searchLanguage(this.settings.words[0].split('')[0]);
      for (var row = 0; row < this.settings.gridSize; row++) {
        for (var col = 0; col < this.settings.gridSize; col++) {
          if (this.matrix[row][col].letter == '.') {
            // Math.rangeInt(65, 90) => A ~ Z
            this.matrix[row][col].letter = String.fromCharCode(Math.rangeInt(rangeLanguage[0], rangeLanguage[1]));
          }
        }
      }
    }
  
    /* Returns matrix items
       @param rowFrom
       @param colFrom
       @param rowTo
       @param colTo
       @return {Array}
    */
    WordSearch.prototype.getItems = function(rowFrom, colFrom, rowTo, colTo) {
      var items = [];
  
      if ( rowFrom === rowTo || colFrom === colTo || Math.abs(rowTo - rowFrom) == Math.abs(colTo - colFrom) ) {
        var shiftY = (rowFrom === rowTo) ? 0 : (rowTo > rowFrom) ? 1 : -1,
          shiftX = (colFrom === colTo) ? 0 : (colTo > colFrom) ? 1 : -1,
          row = rowFrom,
          col = colFrom;
  
        items.push(this.getItem(row, col));
        do {
          row += shiftY;
          col += shiftX;
          items.push(this.getItem(row, col));
        } while( row !== rowTo || col !== colTo );
      }

      return items;
    }
    
  
    /**
    * Returns matrix item
    * @param {Number} row
    * @param {Number} col
    * @return {*}
    */
    WordSearch.prototype.getItem = function(row, col) {
      return (this.matrix[row] ? this.matrix[row][col] : undefined);
    }
  
    /**
    * Clear the exist highlights
    */
    WordSearch.prototype.clearHighlight = function() {
      var selectedEls = document.querySelectorAll('.ws-selected');
      for (var i = 0; i < selectedEls.length; i++) {
        selectedEls[i].classList.remove('ws-selected');
      }
    }
  
/* --------------------- */
/* MARKING CORRECT WORDS */
/* --------------------- */
  /**
  * Lookup if the wordlist contains the selected
  * @param {Array} selected
  */
  WordSearch.prototype.lookup = function(selected) {
      
  var words = [''];
  
  for (var i = 0; i < selected.length; i++) {
    words[0] += selected[i].letter;
  }
  words.push(words[0].split('').reverse().join(''));
  
  // This section changes the yellow blocks to green by adding a css class (ws-found)
  if (this.settings.words.indexOf(words[0]) > -1 || this.settings.words.indexOf(words[1]) > -1) {
    for (var i = 0; i < selected.length; i++) {
      var row = selected[i].row + 1, col = selected[i].col + 1, el = document.querySelector('.ws-area .ws-row:nth-child(' + row + ') .ws-col:nth-child(' + col + ')');
      el.classList.add('ws-found');
    }

    // These sections crosses the word off list by adding a <del> tag to it
    var wordList = document.querySelector(".ws-words");
    var wordListItems = wordList.getElementsByTagName("li");
        
    for(var i=0; i<wordListItems.length; i++){
      if(words[0] == removeDiacritics(wordListItems[i].innerHTML.toUpperCase())){         
        if(wordListItems[i].innerHTML != "<del>"+wordListItems[i].innerHTML+"</del>") { //Check the word is never found
          wordListItems[i].innerHTML = "<del>"+wordListItems[i].innerHTML+"</del>";
          //Increment solved words.
          this.solved++;
          console.log(this.solved);
          // var time_elapsed = Phase.elapsed();
          // console.log(time_elapsed);
          $(".ws_title").html("Found " + this.solved + " out of " + this.settings.words.length + " words so far" );
        }
      }
          
      if(reverse(words[0]) == removeDiacritics(wordListItems[i].innerHTML.toUpperCase())){         
        if(wordListItems[i].innerHTML != "<del>"+wordListItems[i].innerHTML+"</del>") { //Check the word is never found
          wordListItems[i].innerHTML = "<del>"+wordListItems[i].innerHTML+"</del>";
          //Increment solved words.
          this.solved++;
          console.log(this.solved);
          // var time_elapsed = Phase.elapsed();
          // console.log(time_elapsed);
          $(".ws_title").html("Found " + this.solved + " out of " + this.settings.words.length + " words so far" );
        }
      }
    }

    /* ------------------------------------ */
    /* ADDING DATA TO COLLECTOR SPREADSHEET */
    /* ------------------------------------ */
    
    
    
    /* This is where we grab and store the word just found so we can save it to the spreadsheet.  
       It works by getting a list of all the words that have been found to that point and storing it to a variabele
       When a word is found, it refreshes that list, and stores it in a second variabele
       It then compares the first and second variables, removing any duplicate items. What's left is the word we want.
    */    
    var second = $("del").map(function(){return $(this).html();}).get();
    var word_found = second.filter(function (item) {return first.indexOf(item) === -1;});
    first = second;
    console.log(word_found);
              
    var new_word_time = Phase.elapsed();
    var timetoFind = new_word_time - old_word_time;
    old_word_time = new_word_time;
    console.log("time to find: " + timetoFind);
    console.log(new_word_time);
              
    Phase.add_response({
      username: parent.parent.$("#participant_code").val(),
      ws_score: this.solved,
      ws_word: word_found,
      ws_time: timetoFind
    })

    /* -------------------- */
    /* END OF GAME SETTINGS */
    /* -------------------- */

    if(this.solved == this.settings.words.length){
      // Phase.submit(parent.parent.global_count++) // this code ends the task
      Phase.submit() // this code ends the task
    }
    // This changes the tiles red for 1 second if they are not correct
  } else {
    for (var i = 0; i < selected.length; i++) {
      var row = selected[i].row + 1, col = selected[i].col + 1, el = document.querySelector('.ws-area .ws-row:nth-child(' + row + ') .ws-col:nth-child(' + col + ')');
      el.classList.add('ws-wrong');
      setTimeout(function() {
        $('.ws-col').removeClass('ws-wrong');
      }, 1000);
    }
  }
}
  
/* ----------------------- */
/* IGNORE EVERYTHING BELOW */
/* ----------------------- */
  
    /**
    * Mouse event - Mouse down
    * @param {Object} item
    */
    WordSearch.prototype.onMousedown = function(item) {
      var _this = this;
      return function() {
        _this.selectFrom = item;
      }
    }
  
    /**
    * Mouse event - Mouse move
    * @param {Object}
    */
    WordSearch.prototype.onMouseover = function(item) {
      var _this = this;
      return function() {
        if (_this.selectFrom) {
          _this.selected = _this.getItems(_this.selectFrom.row, _this.selectFrom.col, item.row, item.col);
  
          _this.clearHighlight();
  
          for (var i = 0; i < _this.selected.length; i ++) {
            var current = _this.selected[i],
              row = current.row + 1,
              col = current.col + 1,
              el = document.querySelector('.ws-area .ws-row:nth-child(' + row + ') .ws-col:nth-child(' + col + ')');
  
            el.className += ' ws-selected';
          }
        }
      }
    }
  
    /* Mouse event - Mouse up */
    
    WordSearch.prototype.onMouseup = function() {
      var _this = this;
      return function() {
        _this.selectFrom = null;
        _this.clearHighlight();
        _this.lookup(_this.selected);
        _this.selected = [];
      }
    }
  
  })();
  $.getScript("../../collector-experiments/User/Assets/Wordsearch/wordsearch_js_end.js");

// },1);