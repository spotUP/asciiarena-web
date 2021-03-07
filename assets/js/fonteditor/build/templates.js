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
    "    <div class=\"row\">\n" +
    "        <div class=\"col-md-6\">\n" +
    "            <div class=\"row\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                   <label class=\"fig-draw-label\" for=\"figCharSelect\">Character:</label>\n" +
    "               </div>\n" +
    "               <div class=\"col-md-6\">\n" +
    "                   <select id=\"figCharSelect\" ng-model=\"input.selectedChar\" ng-options=\"elm.code as elm.character for elm in figCharDropDown\" class=\"fig-chardropdown\" size=\"1\"></select>\n" +
    "               </div>\n" +
    "           </div>\n" +
    "           <div class=\"row\">\n" +
    "               <div class=\"col-md-12\">\n" +
    "                   <textarea id=\"figCharArt\" ng-model=\"input.figChars[input.selectedChar]\" ng-trim='false' class=\"fig-txt fig-font bg-secondary\"></textarea>\n" +
    "               </div>\n" +
    "           </div>\n" +
    "        </div>\n" +
    "        <div class=\"col-md-6\">\n" +
    "            <div class=\"row\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                     <label class=\"fig-opt-label\" for=\"hlayout\">Horizontal Layout:</label>\n" +
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
    "            <div class=\"row\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <label for=\"vlayout\" class=\"fig-opt-label\">Vertical Layout:</label>\n" +
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
    "            <div class=\"row\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <label class=\"fig-opt-label\" for=\"printDirection\">Print Direction:</label>\n" +
    "               </div>\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <select\n" +
    "                        id=\"printDirection\"\n" +
    "                        ng-model=\"input.printDirection\"\n" +
    "                        ng-options=\"elm.value as elm.label for elm in printDirection\"\n" +
    "                        size=\"1\"\n" +
    "                    ></select>\n" +
    "               </div>\n" +
    "            </div>\n" +
    "            <div class=\"row\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                       <div class=\"custom-control custom-switch\">\n" +
    "                           <input type=\"checkbox\" class=\"custom-control-input\" id=\"caseInsensitive\"  ng-model=\"input.caseInsensitive\" checked>\n" +
    "                           <label class=\"fig-opt-label custom-control-label\" for=\"caseInsensitive\">Case Insensitive:</label>\n" +
    "                       </div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"row\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <label class=\"fig-opt-label\" for=\"hardBlank\">Hard blank:</label>\n" +
    "              </div>\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <input id=\"hardBlank\" type=\"text\" class=\"txt-single-input\" maxlength=1 ng-model=\"input.hardBlank\"></input>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "            <div class=\"row\">\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <label class=\"fig-opt-label\" for=\"baseline\">Baseline:</label>\n" +
    "                </div>\n" +
    "               <div class=\"col-md-6\">\n" +
    "                    <input id=\"baseline\" type=\"text\" class=\"txt-single-input\" maxlength=1 ng-model=\"input.baseline\"></input>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "            <div class=\"fig-opt-entry\">\n" +
    "                <button class=\"btn btn-default\" ng-click=\"export()\">Export</button>\n" +
    "                <button class=\"btn btn-default\" ng-click=\"import()\">Import</button>\n" +
    "                <button class=\"btn btn-default\" ng-click=\"submitFont()\"> Save </button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <br/>\n" +
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
