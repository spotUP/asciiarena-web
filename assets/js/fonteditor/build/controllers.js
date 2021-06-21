/*
	Controller for the main route
*/

var appControllers = appControllers || angular.module('figfont.controllers', []);

appControllers.controller('ExampleCtrl', [
    '$scope', 
	function($scope) {
        'use strict';

	}
]);
/*
	Controller for the main route
*/

var appControllers = appControllers || angular.module('figfont.controllers', []);

appControllers.controller('MainCtrl', [
    '$rootScope',
    '$scope', 
    '$timeout',
    'library',
	function($rootScope, $scope, $timeout, library) {

        "use strict";

        getUserFonts();
        $("#fontSelect").change(loadFont);

        $scope.figCharDropDown = [];
        $scope.input = {};
        
        $scope.input.fontname = '';
        $scope.input.fontstatus = 1;
        $scope.input.fontid = 0;
        
        $scope.input.selectedChar = 65;
        $scope.input.selectedChar2 = 48;
        $scope.input.txt = '';
        $scope.input.figChars = {}; 
        $scope.input.hardBlank = '$';
        $scope.input.endMark = '@';
        $scope.input.layouts = [
            'Full',
            'Fitted',
            'Controlled Smushing',
            'Universal Smushing'
        ];
        $scope.input.horizontalLayout = 'Fitted';
        $scope.input.verticalLayout = 'Full';
        $scope.input.hrule = {};
        $scope.input.hrule[1] = false;
        $scope.input.hrule[2] = false;
        $scope.input.hrule[3] = false;
        $scope.input.hrule[4] = false;
        $scope.input.hrule[5] = false;
        $scope.input.hrule[6] = false;
        $scope.input.vrule = {};
        $scope.input.vrule[1] = false;
        $scope.input.vrule[2] = false;
        $scope.input.vrule[3] = false;
        $scope.input.vrule[4] = false;
        $scope.input.vrule[5] = false;
        $scope.input.printDirection = 0;
        $scope.input.caseInsensitive = false;
        $scope.input.codeTagCount = 0;

        $scope.printDirection = [
            {
                label: 'Left to Right',
                value: 0
            },
            {
                label: 'Right to Left',
                value: 1
            }
        ];

        var ii,
            charOrder = [],
            fontName = '__FONT_IN_PROGRESS__';

        // 32-126, 196, 214, 220, 228, 246, 252, 223
        
        for (ii = 32; ii <= 126; ii++) {
            charOrder.push(ii);
        }
        charOrder.push(196);
        charOrder.push(214);
        charOrder.push(220);
        charOrder.push(228);
        charOrder.push(246);
        charOrder.push(252);
        charOrder.push(223);


        // setup default comment header
        $scope.input.figChars[-1] = "Font Author: Enter your name here\n\n" +
            "FIGFont created with: http://www.asciiarena.com";

        function getUserFonts() {
          let fontlist = $("#fontSelect");
          fontlist.empty();
          fontlist.append($("<option/>").val("0").text("Select Font"));
    
          $.get('/cmds.php?cmd=get_font', function (data) {  
            
            $.each(data, function (i, font) {
              fontlist.append($("<option/>").val(font.fontid).text(font.fontname));
            });
            
            $("#fontSelect").val($scope.input.fontid)
          });
        }

        /*
            Utility functions
        */

        /**
        * Imports a font.
        *
        * @method importFont
        * @param data The FIGfont data - a flf file in text form.
        * @return {undefined} Returns nothing.
        */
        function importFont(fontName, fontData = null) {
            var ii,
                ch;


            figlet.parseFont(fontName, fontData, function(err, opts, comment) {
                if (err) {
                    return;
                }

                $scope.input.figChars[-1] = comment;
                
                $scope.input.fontname = fontName;

                $scope.input.horizontalLayout = getLayoutFromNumber(opts.fittingRules.hLayout);
                $scope.input.verticalLayout = getLayoutFromNumber(opts.fittingRules.vLayout);
                $scope.input.hrule[1] = opts.fittingRules.hRule1;
                $scope.input.hrule[2] = opts.fittingRules.hRule2;
                $scope.input.hrule[3] = opts.fittingRules.hRule3;
                $scope.input.hrule[4] = opts.fittingRules.hRule4;
                $scope.input.hrule[5] = opts.fittingRules.hRule5;
                $scope.input.hrule[6] = opts.fittingRules.hRule6;
                $scope.input.vrule[1] = opts.fittingRules.vRule1;
                $scope.input.vrule[2] = opts.fittingRules.vRule2;
                $scope.input.vrule[3] = opts.fittingRules.vRule3;
                $scope.input.vrule[4] = opts.fittingRules.vRule4;
                $scope.input.vrule[5] = opts.fittingRules.vRule5;

                $scope.input.printDirection = opts.printDirection;
                $scope.input.caseInsensitive = library.get('caseInsensitive');
                $scope.input.codeTagCount = opts.codeTagCount;
                $scope.input.hardBlank = opts.hardBlank;
                $scope.input.baseline = opts.baseline;

                for (ii = 0; ii < charOrder.length; ii++) {
                    setFigChar(fontName,charOrder[ii], String.fromCharCode(charOrder[ii]));
                }

            });

        }

        function setFigChar(fontName,idx, ch) {
            figlet.text(ch, {
                font: fontName,
                showHardBlanks: true
            }, function(err, data) {
                if (err) return;
                $scope.input.figChars[idx] = data;
            });
        }

        function getLayoutFromNumber(num) {
            if (num === 0) {
                return 'Full';
            } else if (num === 1) {
                return 'Fitted';
            } else if (num === 3) {
                return 'Controlled Smushing';
            } else if (num === 2) {
                return 'Universal Smushing';
            }
        }

        /**
        * Creates the character drop down
        *
        * @method createFigCharDropDown
        * @return {undefined} Returns nothing
        */
        function createFigCharDropDown() {
            $scope.figCharDropDown = [];

            $scope.figCharDropDown.push({
                character: "[Font Comment Header]",
                code: -1
            });

            for (ii = 0; ii < charOrder.length; ii++) {
                var idx = charOrder[ii];

                // initialize figchar if needed
                $scope.input.figChars[idx] = $scope.input.figChars[idx] || '';

                // skip chars for case insentivity
                if ($scope.input.caseInsensitive === true) {
                    if (idx >= 97 && idx <= 122) {
                        continue;
                    }
                }

                // add character to drop down
                $scope.figCharDropDown.push({
                    character: String.fromCharCode(idx),
                    code: idx
                });
            }
        }

        /**
        * Creates a string of spaces based on the number you pass in
        *
        * @method spacePad
        * @param num The number of spaces to return
        * @return {String} Returns a string with the number of spaces as the num parameter
        */
        function spacePad(num) {
            var pad = '',
                ii = 0;
            for (ii = 0; ii < num; ii++) {
                pad += ' ';
            }
            return pad;
        }

        /**
        * Create a number of blank lines of a certain width
        *
        * @method blankLines
        * @param num The number of blank lines
        * @param width How wide the lines should be
        * @return {String} Returns a string of the result
        */
        function blankLines(num, width) {
            var lines = [],
                ii;
            for (ii = 0; ii < num; ii++) {
                lines.push( spacePad(width) );
            }
            return lines.join('\n');
        }

        /**
        * Ensures all of the figChars have the same height and are consistant in their widths
        *
        * @method fixFigChars
        * @return {Array} Returns the figChar array
        */
        function fixFigChars() {
            var idx,
                ii,
                height = 0,
                figChar,
                charWidth = {},
                maxWidth = 0;

            /*
                Fix case insensitivity
            */
            if ($scope.input.caseInsensitive === true) {
                for (ii = 97; ii <= 122; ii++) {
                    $scope.input.figChars[ii] = $scope.input.figChars[ii-32];
                }
            }

            /*
                Here we figure out the max height of the characters and make sure each character
                has a consistant width across each of its lines
            */
            for (idx in $scope.input.figChars) {

                if (idx === '-1') continue; // ignore comment header

                figChar = $scope.input.figChars[idx].replace('\r\n','\n').split('\n');
                height = Math.max(height, figChar.length);
                charWidth[idx] = 0;

                for (ii = 0; ii < figChar.length;ii++) {
                    charWidth[idx] = Math.max(charWidth[idx], figChar[ii].length);
                }
                for (ii = 0; ii < figChar.length;ii++) {
                    if (figChar[ii].length < charWidth[idx]) {
                        figChar[ii] += spacePad(charWidth[idx] - figChar[ii].length);
                    }
                    maxWidth = Math.max(maxWidth, charWidth[idx]);
                }
                $scope.input.figChars[idx] = figChar.join('\n');
            }

            // Now loop back again and fix any height issues
            for (idx in $scope.input.figChars) {
                if (idx === '-1') continue; // ignore comment header

                figChar = $scope.input.figChars[idx].replace('\r\n','\n').split('\n');
                if (figChar.length < height) {
                    $scope.input.figChars[idx] = figChar.join('\n') + '\n' + blankLines(height - figChar.length, charWidth[idx]);
                }
            }

            $scope.input.height = height;
            $scope.input.maxLength = maxWidth + 2;
        }

        /**
        * Returns what the Old_layout value is for the font
        *
        * @method getOldlayoutValue
        * @return {String} Returns what the Old_layout value is for the font
        */
        function getOldlayoutValue() {
            var val = 0;
            if ($scope.input.horizontalLayout === 'Full') {
                return -1;
            } else if ($scope.input.horizontalLayout === 'Fitted') {
                return 0;
            } else if ($scope.input.horizontalLayout === 'Universal Smushing') {
                return 0;
            } else {
                val += ($scope.input.hrule[1]) ? 1 : 0;
                val += ($scope.input.hrule[2]) ? 2 : 0;
                val += ($scope.input.hrule[3]) ? 4 : 0;
                val += ($scope.input.hrule[4]) ? 8 : 0;
                val += ($scope.input.hrule[5]) ? 16 : 0;
                val += ($scope.input.hrule[6]) ? 32 : 0;
            }
            return val;
        }

        /**
        * Returns what the full_layout value is for the font
        *
        * @method getFullLayoutValue
        * @return {String} Returns what the full_layout value is for the font
        */
        function getFullLayoutValue() {
            var val = 0;

            // horizontal rules
            if ($scope.input.horizontalLayout === 'Full') {
                val += 0;
            } else if ($scope.input.horizontalLayout === 'Fitted') {
                val += 64;
            } else if ($scope.input.horizontalLayout === 'Universal Smushing') {
                val += 128;
            } else {
                val += 128;
                val += ($scope.input.hrule[1]) ? 1 : 0;
                val += ($scope.input.hrule[2]) ? 2 : 0;
                val += ($scope.input.hrule[3]) ? 4 : 0;
                val += ($scope.input.hrule[4]) ? 8 : 0;
                val += ($scope.input.hrule[5]) ? 16 : 0;
                val += ($scope.input.hrule[6]) ? 32 : 0;
            }

            // vertical rules
            if ($scope.input.verticalLayout === 'Full') {
                val += 0;
            } else if ($scope.input.verticalLayout === 'Fitted') {
                val += 8192;
            } else if ($scope.input.verticalLayout === 'Universal Smushing') {
                val += 16384;
            } else {
                val += 16384;
                val += ($scope.input.vrule[1]) ? 256 : 0;
                val += ($scope.input.vrule[2]) ? 512 : 0;
                val += ($scope.input.vrule[3]) ? 1024 : 0;
                val += ($scope.input.vrule[4]) ? 2048 : 0;
                val += ($scope.input.vrule[5]) ? 4096 : 0;
            }

            return val;
        }

        /**
        * Creates a FIGFont header
        *
        * @method generateFigFontHeader
        * @return {String} Returns a valid figfont header
        */
        function generateFigFontHeader() {
            var header = [],
                baseline = $scope.input.baseline,
                commentLines = 0;

            if (!baseline) {
                baseline = $scope.input.height;
            }
            baseline = parseInt(baseline, 10);
            if ( baseline <= 0 || baseline > $scope.input.height) {
                baseline = $scope.input.height;
            }

            commentLines = $scope.input.figChars['-1'].replace('\r\n','\n').split('\n').length;

            header.push('flf2a' + $scope.input.hardBlank);
            header.push($scope.input.height);
            header.push(baseline);
            header.push($scope.input.maxLength);
            header.push(getOldlayoutValue());
            header.push(commentLines);
            header.push($scope.input.printDirection);
            header.push(getFullLayoutValue());
            header.push($scope.input.codeTagCount);

            return header.join(' ');
        }

        /**
        * Returns a string of text that can be used for a FigFont file
        *
        * @method createFigFileData
        * @return {String} Returns a string of text that can be used for a FigFont file
        */
        function createFigFileData() {
            var ii,
                output = '';

            fixFigChars(); // make sure the width and heights are good

            output = generateFigFontHeader() + '\n';
            output += $scope.input.figChars['-1'].replace('\r\n','\n') + '\n';

            for (ii = 0; ii < charOrder.length; ii++) {
                output += $scope.input.figChars[ charOrder[ii] ].split('\n').join($scope.input.endMark+'\n') + 
                    $scope.input.endMark + $scope.input.endMark + '\n';
            }

            return output;
        }

        function showAlert(content, success) {
          var alertContent = '';
          if (success) {
          alertContent = `<div id="#success-alert" class="bs-component quick-alert amt-1 animate__animated animate__shakeX alert alert-dismissible alert-success"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
          } else {
          alertContent = `<div id="#failure-alert" class="bs-component quick-alert amt-1 animate__animated animate__shakeX alert alert-dismissible alert-warning"><button type="button" class="close" data-dismiss="alert">x</button>${content}</div>`;
          }
          $("#main").parent().prepend(alertContent);
        }


        function loadFont() {
          var fontid = $("#fontSelect").val();
          if (fontid>0) {
            $.get(`/cmds.php?cmd=get_font&id=${fontid}`, function (data) {  
              if (data.length>0) {
                importFont(data[0].fontname, data[0].fontdata);
                $scope.input.fontid = fontid;
                $scope.input.fontstatus = data[0].fontstatus;
                fixFigChars();
                $scope.$digest();
              } else {
                $scope.input.fontname = '';         
                $scope.input.fontid = 0;
                $scope.input.fontstatus = 1;
              }
              
            });
          } else {
            $scope.input.fontname = '';         
            $scope.input.fontid = 0;
            $scope.input.fontstatus = 1;
          }
            
        };

        /*
            GUI functions
        */

        $scope.ruleToolTip = function(layout, num) {
            if (layout === 'h') {
                if (num === 1) {
                    return 'Equal Character Smushing. Ex: If | and | are in adjacent ASCII art characters, they\'ll be smushed into one character.';
                } else if (num === 2) {
                    return 'Underscores "_" will be overwritten by "|\\/[]{}()<>" characters. Ex: When two ASCII art characters overlap by 1 character, the underscore loses out to the specified characters.';
                } else if (num === 3) {
                    return 'Hierarchy Smushing. A hierarchy of six classes is used: "|", "/\\", "[]", "{}", "()", and "<>".  When two smushing sub-characters are from different classes, the one from the latter class will be used.';
                } else if (num === 4) {
                    return 'Opposite Pair Smushing. Smushes opposing brackets ("[]" or "]["), braces ("{}" or "}{") and parentheses ("()" or ")(") together, replacing any such pair with a vertical bar ("|").';
                } else if (num === 5) {
                    return 'Big X Smushing. Smushes "/\\" into "|", "\\/" into "Y", and "><" into "X". Note that "<>" is not smushed in any way by this rule. The name "BIG X" is historical; originally all three pairs were smushed into "X".';
                } else if (num === 6) {
                    return 'Hard Blank Smushing. Smushes two hardblanks together, replacing them with a single hardblank.';
                }
            }
            if (layout === 'v') {
                if (num === 1) {
                    return 'Equal Character Smushing. Ex: If | and | are in adjacent ASCII art characters, they\'ll be smushed into one character.';
                } else if (num === 2) {
                    return 'Underscores "_" will be overwritten by "|\\/[]{}()<>" characters. Ex: When two ASCII art characters overlap by 1 character, the underscore loses out to the specified characters.';
                } else if (num === 3) {
                    return 'Hierarchy Smushing. A hierarchy of six classes is used: "|", "/\\", "[]", "{}", "()", and "<>".  When two smushing sub-characters are from different classes, the one from the latter class will be used.';
                } else if (num === 4) {
                    return 'Horizontal Line Smushing. Smushes stacked pairs of "-" and "_", replacing them with a single "=" sub-character.  It does not matter which is found above the other.';
                } else if (num === 5) {
                    return 'Vertical Line Supersmushing. This one rule is different from all others, in that it "supersmushes" vertical lines consisting of several vertical bars ("|").  This creates the illusion that FIGcharacters have slid vertically against each other. Supersmushing continues until any sub-characters other than "|" would have to be smushed.  Supersmushing can produce impressive results, but it is seldom possible, since other sub-characters would usually have to be considered for smushing as soon as any such stacked vertical lines are encountered.';
                }
            }
        };

        $scope.saveFont = function() {
          if ($scope.input.fontname.trim().length==0) {
            showAlert("You must fill the name field!", false);
            return
          }

          $.ajax({
            "type": "POST",
            "url": "/cmds.php?cmd=save_font",
            "data": {
              "fontid": $scope.input.fontid,
              "fontstatus": $scope.input.fontstatus,
              "fontname": $scope.input.fontname,
              "fontdata": createFigFileData()
            },
            "error": (r) => {
                showAlert("There was an error during saving!",false);
              },
            "success": () => {
                showAlert("Font Saved!", true);
                getUserFonts();              
              }
          });
            
        };
        
        /*
            watches
        */

        $scope.$watch('input.caseInsensitive', function(newVal) {
            
            if ($scope.input.selectedChar >= 97 && $scope.input.selectedChar <= 122) {
                $scope.input.selectedChar -= 32;
            }

            createFigCharDropDown();
        });

        $scope.$on('data:import', function() {
            var figfont = library.get('figfont');
            if (figfont) {
                var fontName = library.get('fontName');
                importFont(fontName, figfont);
                $scope.input.fontid = library.get('fontId');
                $scope.input.fontstatus=library.get('fontStatus');

                fixFigChars();
            }
        });

        $scope.$on('$destroy', function() {
            library.set('caseInsensitive', $scope.input.caseInsensitive);
            library.set('fontName', $scope.input.fontname);
            library.set('fontId', $scope.input.fontid);
            library.set('fontStatus', $scope.input.fontstatus);
            library.set('figfont', createFigFileData());
        });

        /*
            Init
        */

        createFigCharDropDown();

        var figfont = library.get('figfont');
        if (figfont) {
            var fontName = library.get('fontName');
            importFont(fontName,figfont);
            $scope.input.fontid = library.get('fontId');
            $scope.input.fontstatus=library.get('fontStatus');

            fixFigChars();
            $("#fontSelect").val($scope.input.fontid)
        }

        $timeout(function() {
            $(".fig-opt-tips").tooltip({
                placement: "right"
            });


        }, 1);

	}
]);
/*
	Controller for the main route
*/

var appControllers = appControllers || angular.module('figfont.controllers', []);

appControllers.controller('TestCtrl', [
    '$rootScope',
    '$scope', 
    '$timeout',
    'library',
	function($rootScope, $scope, $timeout, library) {

        "use strict";

        var fontName = '__FONT_IN_PROGRESS__';

        $scope.input = {};
        $scope.input.fontid = "0";
        $scope.input.fontname = '';
        $scope.input.fontstatus = 1;
        $scope.input.figText = library.get('figTestText') || '';
        $scope.input.showHardBlanks = library.get('figTestHb') || false;

        /*
            Utility functions
        */

        function updateFigText() {
            figlet.text($scope.input.figText, {
                font: fontName,
                showHardBlanks: $scope.input.showHardBlanks
            }, function(err, data) {
                if (err) {
                    $scope.figOutput = 'Font not loaded. See Edit section.';
                    return;
                }
                $scope.figOutput = data;
            });
        }

        /*
            GUI functions
        */



        /*
            watches
        */

        $scope.$watch('input.figText', function() {
            updateFigText();
        });

        $scope.$watch('input.showHardBlanks', function() {
            updateFigText();
        });

        $scope.$on('$destroy', function() {
            library.set('figTestText', $scope.input.figText);
            library.set('figTestHb', $scope.input.showHardBlanks);
        });

        /*
            Init
        */

        var figfont = library.get('figfont');
        if (figfont) {
            var fontName = library.get('fontName');
            figlet.parseFont(fontName, figfont);
            $scope.input.fontid = library.get('fontId');
            $scope.input.fontstatus=library.get('fontStatus');
        }

        $timeout(function() {
            $('.fig-test-txt').focus();
        }, 100);

	}
]);