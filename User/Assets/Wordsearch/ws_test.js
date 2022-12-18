 /**
   * Mege two objects
   *
   * @param {Object} o1 Object 1
   * @param {Object} o2 Object 2
   * @return {Object}
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
  
      // // Default settings
      // var default_settings = {
      //   'directions': ['W', 'N', 'WN', 'EN'],
      //   'gridSize': 20,
      //   'words': {{text}},
      //   'wordsList' : [],
      //   'debug': false
      // }

      // this.settings = Object.merge(settings, default_settings);
  
    //   // Check the words' length if it is overflow the grid
    //   if (this.parseWords(this.settings.gridSize)) {
    //     // Add words into the matrix data
    //     var isWorked = false;
  
    //     while (isWorked == false) {
    //       // initialize the application
    //       this.initialize();
  
    //       isWorked = this.addWords();
    //     }
  
    //     // Fill up the remaining blank items
    //     if (!this.settings.debug) {
    //       this.fillUpFools();
    //     }
  
    //     // Draw the matrix into wrap element
    //     this.drawmatrix();
    //   }
    // }
  
    // /**
    //  * Parse words
    //  * @param {Number} Max size
    //  * @return {Boolean}
    //  */
    // WordSearch.prototype.parseWords = function(maxSize) {
    //   var itWorked = true;
  
    //   for (var i = 0; i < this.settings.words.length; i++) {
    //     // Convert all the letters to upper case      
    //     this.settings.wordsList[i] =  this.settings.words[i].trim();
    //     this.settings.words[i] =  removeDiacritics(this.settings.wordsList[i].trim().toUpperCase());
  
    //     var word = this.settings.words[i];
    //     if (word.length > maxSize) {
    //       alert('The length of word `' + word + '` is overflow the gridSize.');
    //       console.error('The length of word `' + word + '` is overflow the gridSize.');
    //       itWorked = false;
    //     }
    //   }
  
    //   return itWorked;
    // }
  
    // /**
    //  * Put the words into the matrix
    //  */
    // WordSearch.prototype.addWords = function() {
    //     var keepGoing = true,
    //       counter = 0,
    //       isWorked = true;
  
    //     while (keepGoing) {
    //       // Getting random direction
    //       var dir = this.settings.directions[Math.rangeInt(this.settings.directions.length - 1)],
    //         result = this.addWord(this.settings.words[counter], dir),
    //         isWorked = true;
  
    //       if (result == false) {
    //         keepGoing = false;
    //         isWorked = false;
    //       }
  
    //       counter++;
    //       if (counter >= this.settings.words.length) {
    //         keepGoing = false;
    //       }
    //     }
  
    //     return isWorked;
    // }
  
    // /**
    //  * Add word into the matrix
    //  *
    //  * @param {String} word
    //  * @param {Number} direction
    //  */
    // WordSearch.prototype.addWord = function(word, direction) {
    //   var itWorked = true,
    //     directions = {
    //       'W': [0, 1], // Horizontal (From left to right)
    //       'N': [1, 0], // Vertical (From top to bottom)
    //       'WN': [1, 1], // From top left to bottom right
    //       'EN': [1, -1] // From top right to bottom left
    //     },
    //     row, col; // y, x
  
    //   switch (direction) {
    //     case 'W': // Horizontal (From left to right)
    //       var row = Math.rangeInt(this.settings.gridSize  - 1),
    //         col = Math.rangeInt(this.settings.gridSize - word.length);
    //       break;
  
    //     case 'N': // Vertical (From top to bottom)
    //       var row = Math.rangeInt(this.settings.gridSize - word.length),
    //         col = Math.rangeInt(this.settings.gridSize  - 1);
    //       break;
  
    //     case 'WN': // From top left to bottom right
    //       var row = Math.rangeInt(this.settings.gridSize - word.length),
    //         col = Math.rangeInt(this.settings.gridSize - word.length);
    //       break;
  
    //     case 'EN': // From top right to bottom left
    //       var row = Math.rangeInt(this.settings.gridSize - word.length),
    //         col = Math.rangeInt(word.length - 1, this.settings.gridSize - 1);
    //       break;
  
    //     default:
    //       var error = 'UNKNOWN DIRECTION ' + direction + '!';
    //       alert(error);
    //       console.log(error);
    //       break;
    //   }
  
    //   // Add words to the matrix
    //   for (var i = 0; i < word.length; i++) {
    //     var newRow = row + i * directions[direction][0],
    //       newCol = col + i * directions[direction][1];
  
    //     // The letter on the board
    //     var origin = this.matrix[newRow][newCol].letter;
  
    //     if (origin == '.' || origin == word[i]) {
    //       this.matrix[newRow][newCol].letter = word[i];
    //     } else {
    //       itWorked = false;
    //     }
    //   }
  
    //   return itWorked;
    // }
  
    // /**
    //  * Initialize the application
    //  */
    // WordSearch.prototype.initialize = function() {
    //   /**
    //    * Letter matrix
    //    *
    //    * param {Array}
    //    */
    //   this.matrix = [];
  
    //   /**
    //    * Selection from
    //    * @Param {Object}
    //    */
    //   this.selectFrom = null;
  
    //   /**
    //    * Selected items
    //    */
    //   this.selected = [];
  
    //   this.initmatrix(this.settings.gridSize);
    // }
  
    // /**
    //  * Fill default items into the matrix
    //  * @param {Number} size Grid size
    //  */
    // WordSearch.prototype.initmatrix = function(size) {
    //   for (var row = 0; row < size; row++) {
    //     for (var col = 0; col < size; col++) {
    //       var item = {
    //         letter: '.', // Default value
    //         row: row,
    //         col: col
    //       }
  
    //       if (!this.matrix[row]) {
    //         this.matrix[row] = [];
    //       }
  
    //       this.matrix[row][col] = item;
    //     }
    //   }
    // }
  
    // /**
    //  * Draw the matrix
    //  */
    // WordSearch.prototype.drawmatrix = function() {
    //   for (var row = 0; row < this.settings.gridSize; row++) {
    //     // New row
    //     var divEl = document.createElement('div');
    //     divEl.setAttribute('class', 'ws-row');
    //     this.wrapEl.appendChild(divEl);
  
    //     for (var col = 0; col < this.settings.gridSize; col++) {
    //       var cvEl = document.createElement('canvas');
    //       cvEl.setAttribute('class', 'ws-col');
    //       cvEl.setAttribute('width', 30);
    //       cvEl.setAttribute('height', 30);
  
    //       // Fill text in middle center
    //       var x = cvEl.width / 2,
    //         y = cvEl.height / 2;
  
    //       var ctx = cvEl.getContext('2d');
    //       ctx.font = '400 20px Calibri';
    //       ctx.textAlign = 'center';
    //       ctx.textBaseline = 'middle';
    //       ctx.fillStyle = '#333'; // Text color
    //       ctx.fillText(this.matrix[row][col].letter, x, y);
  
    //       // Add event listeners
    //       cvEl.addEventListener('mousedown', this.onMousedown(this.matrix[row][col]));
    //       cvEl.addEventListener('mouseover', this.onMouseover(this.matrix[row][col]));
    //       cvEl.addEventListener('mouseup', this.onMouseup());
  
    //       divEl.appendChild(cvEl);
    //     }
    //   }
    // }
  
    // /**
    //  * Fill up the remaining items
    //  */
    // WordSearch.prototype.fillUpFools = function() {
    //   var rangeLanguage = searchLanguage(this.settings.words[0].split('')[0]);
    //   for (var row = 0; row < this.settings.gridSize; row++) {
    //     for (var col = 0; col < this.settings.gridSize; col++) {
    //       if (this.matrix[row][col].letter == '.') {
    //         // Math.rangeInt(65, 90) => A ~ Z
    //         this.matrix[row][col].letter = String.fromCharCode(Math.rangeInt(rangeLanguage[0], rangeLanguage[1]));
    //       }
    //     }
    //   }
    // }
  
    // /**
    //  * Returns matrix items
    //  * @param rowFrom
    //  * @param colFrom
    //  * @param rowTo
    //  * @param colTo
    //  * @return {Array}
    //  */
    // WordSearch.prototype.getItems = function(rowFrom, colFrom, rowTo, colTo) {
    //   var items = [];
  
    //   if ( rowFrom === rowTo || colFrom === colTo || Math.abs(rowTo - rowFrom) == Math.abs(colTo - colFrom) ) {
    //     var shiftY = (rowFrom === rowTo) ? 0 : (rowTo > rowFrom) ? 1 : -1,
    //       shiftX = (colFrom === colTo) ? 0 : (colTo > colFrom) ? 1 : -1,
    //       row = rowFrom,
    //       col = colFrom;
  
    //     items.push(this.getItem(row, col));
    //     do {
    //       row += shiftY;
    //       col += shiftX;
    //       items.push(this.getItem(row, col));
    //     } while( row !== rowTo || col !== colTo );
    //   }
  
    //   return items;
    // }
  
    // /**
    //  * Returns matrix item
    //  * @param {Number} row
    //  * @param {Number} col
    //  * @return {*}
    //  */
    // WordSearch.prototype.getItem = function(row, col) {
    //   return (this.matrix[row] ? this.matrix[row][col] : undefined);
    // }
  
    // /**
    //  * Clear the exist highlights
    //  */
    // WordSearch.prototype.clearHighlight = function() {
    //   var selectedEls = document.querySelectorAll('.ws-selected');
    //   for (var i = 0; i < selectedEls.length; i++) {
    //     selectedEls[i].classList.remove('ws-selected');
    //   }
    // }
  
    // /**
    //  * Lookup if the wordlist contains the selected
    //  * @param {Array} selected
    //  */
    // WordSearch.prototype.lookup = function(selected) {
    //   var words = [''];
  
    //   for (var i = 0; i < selected.length; i++) {
    //     words[0] += selected[i].letter;
    //   }
    //   words.push(words[0].split('').reverse().join(''));
  
    //   if (this.settings.words.indexOf(words[0]) > -1 ||
    //       this.settings.words.indexOf(words[1]) > -1) {
    //     for (var i = 0; i < selected.length; i++) {
    //       var row = selected[i].row + 1,
    //         col = selected[i].col + 1,
    //         el = document.querySelector('.ws-area .ws-row:nth-child(' + row + ') .ws-col:nth-child(' + col + ')');
  
    //       el.classList.add('ws-found');
    //     }
  
    //     //Cross word off list.
    //     var wordList = document.querySelector(".ws-words");
    //     var wordListItems = wordList.getElementsByTagName("li");
    //     for(var i=0; i<wordListItems.length; i++){
    //       if(words[0] == removeDiacritics(wordListItems[i].innerHTML.toUpperCase())){         
    //         if(wordListItems[i].innerHTML != "<del>"+wordListItems[i].innerHTML+"</del>") { //Check the word is never found
    //           wordListItems[i].innerHTML = "<del>"+wordListItems[i].innerHTML+"</del>";
    //           //Increment solved words.
    //           this.solved++;
    //         }
            
        
    //       }
    //     }
  
    //     //Game over?
    //     if(this.solved == this.settings.words.length){
    //       this.gameOver();
    //     }
    //   }
    // }
  
    // /**
    //  * Game Over
    //  */
    // WordSearch.prototype.gameOver = function() {
    //   //Create overlay.
    //   var overlay = document.createElement("div");
    //   overlay.setAttribute("id", "ws-game-over-outer");
    //   overlay.setAttribute("class", "ws-game-over-outer");
    //   this.wrapEl.parentNode.appendChild(overlay);
  
    //   //Create overlay content.
    //   var overlay = document.getElementById("ws-game-over-outer");
    //     overlay.innerHTML = "<div class='ws-game-over-inner' id='ws-game-over-inner'>"+
    //                           "<div class='ws-game-over' id='ws-game-over'>"+
    //                             "<h2>Congratulations!</h2>"+
    //                             "<p>You've found all of the words!</p>"+
    //                           "</div>"+
    //                         "</div>";
    // }
  
  //   /**
  //    * Mouse event - Mouse down
  //    * @param {Object} item
  //    */
  //   WordSearch.prototype.onMousedown = function(item) {
  //     var _this = this;
  //     return function() {
  //       _this.selectFrom = item;
  //     }
  //   }
  
  //   /**
  //    * Mouse event - Mouse move
  //    * @param {Object}
  //    */
  //   WordSearch.prototype.onMouseover = function(item) {
  //     var _this = this;
  //     return function() {
  //       if (_this.selectFrom) {
  //         _this.selected = _this.getItems(_this.selectFrom.row, _this.selectFrom.col, item.row, item.col);
  
  //         _this.clearHighlight();
  
  //         for (var i = 0; i < _this.selected.length; i ++) {
  //           var current = _this.selected[i],
  //             row = current.row + 1,
  //             col = current.col + 1,
  //             el = document.querySelector('.ws-area .ws-row:nth-child(' + row + ') .ws-col:nth-child(' + col + ')');
  
  //           el.className += ' ws-selected';
  //         }
  //       }
  //     }
  //   }
  
  //   /**
  //    * Mouse event - Mouse up
  //    */
  //   WordSearch.prototype.onMouseup = function() {
  //     var _this = this;
  //     return function() {
  //       _this.selectFrom = null;
  //       _this.clearHighlight();
  //       _this.lookup(_this.selected);
  //       _this.selected = [];
  //     }
  //   }
  
  // })();