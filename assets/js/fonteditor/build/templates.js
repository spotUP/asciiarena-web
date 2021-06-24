angular.module('figfont').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('partials/dialog-export.htm',
    "<div class=\"modal fade\" id=\"{{id}}\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">\n" +
    "    <div class=\"modal-dialog\">\n" +
    "        <div class=\"modal-content\">\n" +
    "            <div class=\"modal-header\">\n" +
    "                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n" +
    "                <h4 class=\"modal-title\" id=\"myModalLabel\">Exported FIGFont Data</h4>\n" +
    "            </div>\n" +
    "            <div class=\"modal-body\">\n" +
    "                <textarea class='fig-data-txt fig-font' ng-model='input.data'></textarea>\n" +
    "                <div style=\"margin-top:16px\">\n" +
    "                    Copy the above text and place it into a text file. Rename the file to have a *.flf extension. Then place the\n" +
    "                    file in your FIGlet fonts directory.\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <button type=\"button\" class=\"btn btn-default\" ng-click=\"selectAll()\">Select All</button>\n" +
    "                <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n" +
    "            </div>\n" +
    "        </div><!-- /.modal-content -->\n" +
    "    </div><!-- /.modal-dialog -->\n" +
    "</div><!-- /.modal -->"
    );


  $templateCache.put('partials/dialog-import.htm',
    "<div class=\"modal fade\" id=\"{{id}}\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">\n" +
    "    <div class=\"modal-dialog\">\n" +
    "        <div class=\"modal-content\">\n" +
    "            <div class=\"modal-header\">\n" +
    "                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n" +
    "                <h4 class=\"modal-title\" id=\"myModalLabel\">Import FIGFont Data</h4>\n" +
    "            </div>\n" +
    "            <div class=\"modal-body\">\n" +
    "                <textarea class='fig-data-txt fig-font' ng-model='input.data'></textarea>\n" +
    "                <p ng-show=\"errorPresent === true\" style=\"margin-top:16px\" class=\"fig-error\">\n" +
    "                    ERROR: Unable to parse your input. Please make sure its in the correct format.\n" +
    "                </p>\n" +
    "                <div style=\"margin-top:16px\">\n" +
    "                    Copy the contents of a *.flf file and paste it into the textbox above. Then press Import.\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <button type=\"button\" class=\"btn btn-default\" ng-click=\"import()\">Import</button>\n" +
    "                <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n" +
    "            </div>\n" +
    "        </div><!-- /.modal-content -->\n" +
    "    </div><!-- /.modal-dialog -->\n" +
    "</div><!-- /.modal -->"
    );


  $templateCache.put('partials/dialog-submit-font.htm',
    "<div class=\"modal fade\" id=\"{{id}}\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">\n" +
    "    <div class=\"modal-dialog\">\n" +
    "        <div class=\"modal-content\">\n" +
    "            <div class=\"modal-header\">\n" +
    "                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>\n" +
    "                <h4 class=\"modal-title\" id=\"myModalLabel\">Submitting a FIGlet Font</h4>\n" +
    "            </div>\n" +
    "            <div class=\"modal-body\">\n" +
    "                <div>\n" +
    "                    <p>\n" +
    "                    In order to submit a FIGlet font you must do the following:\n" +
    "                    </p>\n" +
    "                    <ul>\n" +
    "                        <li>\n" +
    "                            Paste the exported FIGlet font data into a *.flf file.\n" +
    "                        </li>\n" +
    "                        <li>\n" +
    "                            Email this file to <a href=\"mailto:figlet@figlet.org?subject=FIGlet Font Submission\">figlet@figlet.org</a> with the subject line \"FIGlet Font Submission\".\n" +
    "                        </li>\n" +
    "                    </ul>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"modal-footer\">\n" +
    "                <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n" +
    "            </div>\n" +
    "        </div><!-- /.modal-content -->\n" +
    "    </div><!-- /.modal-dialog -->\n" +
    "</div><!-- /.modal -->"
    );

  $templateCache.put('partials/main.htm',
    "<div>\n" +
    "    <div id=\"main\" class=\"row apt-1 apb-1\">\n" +
    "        <div class=\"col-md-4\">\n" +
    "            <div class=\"row\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                   <label class=\"fig-draw-label\" for=\"figStatus\">Style:</label>\n" +
    "               </div>\n" +
    "               <div class=\"col-md-6\">\n" +
    "                   <select id=\"fontSelect\">\n" +
    "                   </select>\n" +
    "               </div>\n" +
    "           </div>\n" +
    "            <div class=\"row apt-1\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                   <label class=\"fig-draw-label\" for=\"figStatus\">Visibility:</label>\n" +
    "               </div>\n" +
    "               <div class=\"col-md-6\">\n" +
    "                   <select  ng-model=\"input.fontstatus\" id=\"figStatus\">\n" +
    "					             <option value=\"1\">Private</option>\n" +
    "                 		 <option value=\"2\">Public (Anyone can view)</option>\n" +
    "                 		 <option value=\"3\">Public (Anyone can edit)</option>\n" +
    "                   </select>\n" +
    "               </div>\n" +
    "           </div>\n" +
    
    "            <div class=\"row apt-1\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                   <label class=\"fig-draw-label\" for=\"figFontName\">Font Name:</label>\n" +
    "               </div>\n" +
    "               <div class=\"col-md-6\">\n" +
    "                   <input id=\"figFontName\" type=\"text\" class=\"txt-single-input\" maxlength=20 ng-model=\"input.fontname\"></input>\n" +
    "               </div>\n" +
    "           </div>\n" +
    //"            <div class=\"row apt-1\">\n" +
    //"               <div class=\"col-md-6\">\n" +
    //"                   <label class=\"fig-draw-label\" for=\"figCharSelect\">Character:</label>\n" +
    //"               </div>\n" +
    //"               <div class=\"col-md-6\">\n" +
    //"                   <select id=\"figCharSelect\" ng-model=\"input.selectedChar\" ng-options=\"elm.code as elm.character for elm in figCharDropDown\" class=\"fig-chardropdown\" size=\"1\"></select>\n" +
    //"               </div>\n" +
    //"           </div>\n" +


    "        </div>\n" +
    "        <div class=\"col-md-6\">\n" +
    "            <div class=\"row\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                     <label class=\"fig-opt-label\" for=\"hlayout\">H-Layout:</label>\n" +
    "             </div>\n" +
    "                <div class=\"col-md-6\">\n" +
    "                     <select id=\"hlayout\" ng-model=\"input.horizontalLayout\" ng-options=\"elm as elm for elm in input.layouts\"></select>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div ng-show=\"input.horizontalLayout==='Controlled Smushing'\">\n" +
    "                <div class=\"fig-opt-entry\" ng-repeat=\"idx in [1, 6] | makeRange\">\n" +
    "                    <div class=\"fig-opt\">\n" +
    "                        <label class=\"fig-opt-label\" for=\"hrule{{idx}}\">Rule #{{idx}}:</label>\n" +
    "                        <input id=\"hrule{{idx}}\" ng-model=\"input.hrule[idx]\" type=\"checkbox\"/>\n" +
    "                    </div>\n" +
    "                    <div class=\"fig-opt-info2\">\n" +
    "                        <span class=\"glyphicon glyphicon-info-sign fig-opt-tips fig-icon\" data-toggle=\"tooltip\" title=\"{{ruleToolTip('h', idx)}}\"></span>\n" +
    "                    </div>\n" +
    "                    <div style=\"clear:both\"></div>\n" +
    "                </div>\n" +
    "                <div style=\"margin-bottom:16px;\" ng-show=\"input.hrule[1] === false && input.hrule[2] === false && input.hrule[3] === false && input.hrule[4] === false && input.hrule[5] === false && input.hrule[6] === false\">\n" +
    "                    <strong>Note:</strong> Not selecting any smushing rules is the same as selecting \"Universal Smushing\".\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"row apt-1\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <label for=\"vlayout\" class=\"fig-opt-label\">V-Layout:</label>\n" +
    "               </div>\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <select id=\"vlayout\" ng-model=\"input.verticalLayout\" ng-options=\"elm as elm for elm in input.layouts\"></select>\n" +
    "                </div>\n" +
    "                </div>\n" +
    "                <div class=\"fig-opt-info2\">\n" +
    "                    <span class=\"glyphicon glyphicon-info-sign fig-opt-tips fig-icon\" data-toggle=\"tooltip\" title=\"The vertical kerning for the font.\"></span>\n" +
    "                </div>\n" +
    "            <div ng-show=\"input.verticalLayout==='Controlled Smushing'\">\n" +
    "                <div class=\"fig-opt-entry\" ng-repeat=\"idx in [1, 5] | makeRange\">\n" +
    "                    <div class=\"fig-opt\">\n" +
    "                        <label class=\"fig-opt-label\" for=\"vrule{{idx}}\">Rule #{{idx}}:</label>\n" +
    "                        <input id=\"vrule{{idx}}\" ng-model=\"input.vrule[idx]\" type=\"checkbox\"/>\n" +
    "                    </div>\n" +
    "                </div>\n" +
    "                <div style=\"margin-bottom:16px;\" ng-show=\"input.vrule[1] === false && input.vrule[2] === false && input.vrule[3] === false && input.vrule[4] === false && input.vrule[5] === false\">\n" +
    "                    <strong>Note:</strong> Not selecting any smushing rules is the same as selecting \"Universal Smushing\".\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"row apt-1\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <label class=\"fig-opt-label\" for=\"hardBlank\">Hard blank:</label>\n" +
    "              </div>\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <input id=\"hardBlank\" type=\"text\" class=\"txt-single-input\" maxlength=1 ng-model=\"input.hardBlank\"></input>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "            <div class=\"row apt-1\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <label class=\"fig-opt-label\" for=\"baseline\">Baseline:</label>\n" +
    "                </div>\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <input id=\"baseline\" type=\"text\" class=\"txt-single-input\" maxlength=1 ng-model=\"input.baseline\"></input>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            </div>\n" +















    "           <div class=\"row m-0\">\n" +
    "             <div class=\"col-md-6\">\n" +       
    "           <div class=\"row ap-1 white\">\n" +
    "               <br><br>Character Table\n" +
    "           </div>\n" +
    //"               <div data-toggle=\"buttons\">\n" +
    "                 <div class=\"btn-group btn-group-toggle\">\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"32\">&nbsp;</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"33\">!</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"34\">\"</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"35\">#</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"36\">$</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"37\">%</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"38\">&</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"39\">\'</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"40\">(</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"41\">)</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"42\">*</label>\n" +
    "                 </div>\n" +
    "                 <div class=\"btn-group btn-group-toggle\">\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"43\">+</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"44\">,</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"45\">-</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"46\">.</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"47\">/</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"48\">0</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"49\">1</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"50\">2</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"51\">3</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"52\">4</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"53\">5</label>\n" +
    "                 </div>\n" +
    "                 <div class=\"btn-group btn-group-toggle\">\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"54\">6</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"55\">7</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"56\">8</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"57\">9</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"58\">:</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"59\">;</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"60\">&lt;</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"61\">=</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"62\">&gt;</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"63\">?</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"64\">@</label>\n" +
    "                 </div>\n" +
    "                 <div class=\"btn-group btn-group-toggle\">\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"65\">A</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"66\">B</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"67\">C</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"68\">D</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"69\">E</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"70\">F</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"71\">G</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"72\">H</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"73\">I</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"74\">J</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"75\">K</label>\n" +
    "                 </div>\n" +
    "                 <div class=\"btn-group btn-group-toggle\">\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"76\">L</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"77\">M</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"78\">N</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"79\">O</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"80\">P</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"81\">Q</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"82\">R</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"83\">S</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"84\">T</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"85\">U</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"86\">V</label>\n" +
    "                 </div>\n" +
    "                 <div class=\"btn-group btn-group-toggle\">\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"87\">W</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"88\">X</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"89\">Y</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"90\">Z</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"91\">[</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"92\">\\</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"93\">]</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"94\">^</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"95\">_</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"96\">`</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"97\">a</label>\n" +
    "                 </div>\n" +
    "                 <div class=\"btn-group btn-group-toggle\">\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"98\">b</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"99\">c</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"100\">d</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"101\">e</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"102\">f</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"103\">g</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"104\">h</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"105\">i</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"106\">j</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"107\">k</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"108\">l</label>\n" +
    "                 </div>\n" +
    "                 <div class=\"btn-group btn-group-toggle\">\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"109\">m</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"110\">n</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"111\">o</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"112\">p</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"113\">q</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"114\">r</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"115\">s</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"116\">t</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"117\">u</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"118\">v</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"119\">w</label>\n" +
    "                 </div>\n" +
    "                 <div class=\"btn-group btn-group-toggle\">\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"120\">x</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"121\">y</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"122\">z</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"123\">{</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"124\">|</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"125\">}</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"126\">~</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"196\">Ä</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"214\">Ö</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"220\">Ü</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"228\">ä</label>\n" +
    "                 </div>\n" +
    "                 <div class=\"btn-group btn-group-toggle\">\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"246\" autocomplete=\"off\">ö</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"252\" autocomplete=\"off\">ü</label>\n" +
    "                 <label class=\"btn btn-lg fontbtn\"><input type=\"radio\" ng-model=\"input.selectedChar\" ng-value=\"223\" autocomplete=\"off\">ß</label>\n" +
    "                 </div>\n" +
    "             </div>\n" +






    "           <div class=\"col-md-6\">\n" +
    "             <div class=\"col-md-12\">\n" +
    "               <div class=\"row ap-1 white\">\n" +
    "                 <br><br>Character Editor\n" +
    "               </div>\n" +
    "               <div class=\"row bg-blue\">\n" +
    "                   <textarea id=\"figCharArt\" ng-model=\"input.figChars[input.selectedChar]\" ng-trim='false' class=\"fig-txt w-100 fig-font bg-secondary\"></textarea>\n" +
    "           </div>\n" +
    "                   </div>\n" +
    "               </div>\n" +
    "            </div>\n" +
    //"            <div class=\"row apt-1\">\n" +
    //"               <div class=\"col-md-6\">\n" +
    //"                    <label class=\"fig-opt-label\" for=\"printDirection\">Print Direction:</label>\n" +
    //"               </div>\n" +
    //"               <div class=\"col-md-6\">\n" +
    //"                    <select\n" +
    //"                        id=\"printDirection\"\n" +
    //"                        ng-model=\"input.printDirection\"\n" +
    //"                        ng-options=\"elm.value as elm.label for elm in printDirection\"\n" +
    //"                        size=\"1\"\n" +
    //"                    ></select>\n" +
    //"               </div>\n" +
    //"            </div>\n" +
    "            <div class=\"container\">\n"+
    "               <div class=\"row m-0\">\n" +
    "                   <div class=\"fig-opt-entry\">\n" +
    "                       <input type=\"button\" class=\"btn-big btn-default\" ng-click=\"saveFont()\" value=\"Save\">\n" +
    "                   </div>\n" +
    "               </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>"
    );


$templateCache.put('partials/test.htm',
  "<div>\n" +
  "    <textarea ng-model=\"input.figText\" class=\"fig-test-txt\" ng-trim=\"false\"></textarea>\n" +
  "    <div style=\"margin-top:16px;margin-bottom:16px;\">\n" +
  "        <div style=\"float:left\">\n" +
  "            <input type=\"checkbox\" ng-model=\"input.showHardBlanks\" id=\"fig-showhardblanks\" />\n" +
  "            <label for=\"fig-showhardblanks\">Show Hardblanks</label>\n" +
  "        </div>\n" +
  "        <div style=\"clear:both\"></div>\n" +
  "    </div>\n" +
  "    <div class=\"fig-test-output\" >{{figOutput}}</div>\n" +
  "</div>"
  );

}]);
