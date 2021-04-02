<div class="modal fade" id="{{id}}" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
<div class="modal-dialog">
    <div class="modal-content">
               <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                   <h4 class="modal-title" id="myModalLabel">Exported FIGFont Data</h4>
               </div>
                <div class="modal-body">
                    <textarea class='fig-data-txt fig-font' ng-model='input.data'></textarea>
                    <div style="margin-top:16px">
                        Copy the above text and place it into a text file. Rename the file to have a *.flf extension. Then place the
                        file in your FIGlet fonts directory.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" ng-click="selectAll()">Select All</button>
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div><!-- /.modal-content -->
        </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->


    <div class="modal fade" id="{{id}}" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                    <h4 class="modal-title" id="myModalLabel">Import FIGFont Data</h4>
                </div>
                <div class="modal-body">
                    <textarea class='fig-data-txt fig-font' ng-model='input.data'></textarea>
                    <p ng-show="errorPresent === true" style="margin-top:16px" class="fig-error">
                        ERROR: Unable to parse your input. Please make sure its in the correct format.
                    </p>
                    <div style="margin-top:16px">
                        Copy the contents of a *.flf file and paste it into the textbox above. Then press Import.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" ng-click="import()">Import</button>
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div><!-- /.modal-content -->
        </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->



    <div class="modal fade" id="{{id}}" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                   <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                    <h4 class="modal-title" id="myModalLabel">Submitting a FIGlet Font</h4>
                </div>
                <div class="modal-body">
                    <div>
                        <p>
                        In order to submit a FIGlet font you must do the following:
                        </p>
                        <ul>
                            <li>
                                Paste the exported FIGlet font data into a *.flf file.
                            </li>
                            <li>
                                Email this file to <a href="mailto:figlet@figlet.org?subject=FIGlet Font Submission">figlet@figlet.org</a> with the subject line "FIGlet Font Submission".
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div><!-- /.modal-content -->
        </div><!-- /.modal-dialog -->
    </div><!-- /.modal -->"


    <div>
        <div class="row apt-1 apb-1">
            <div class="col-md-6">
                <div class="row">
                   <div class="col-md-6">
                       <label class="fig-draw-label" for="figCharSelect">Character:</label>
                   </div>
                   <div class="col-md-6">
                       <select id="figCharSelect" ng-model="input.selectedChar" ng-options="elm.code as elm.character for elm in figCharDropDown" class="fig-chardropdown" size="1"></select>
                   </div>
               </div>
               <div class="row">
                   <div class="col-md-12 apt-1">
                       <textarea id="figCharArt" ng-model="input.figChars[input.selectedChar]" ng-trim='false' class="fig-txt fig-font bg-secondary"></textarea>
               </div>
               </div>
            </div>
            <div class="col-md-6">
                <div class="row">
                   <div class="col-md-6">
                         <label class="fig-opt-label" for="hlayout">Horizontal Layout:</label>
                 </div>
                    <div class="col-md-6">
                         <select id="hlayout" ng-model="input.horizontalLayout" ng-options="elm as elm for elm in input.layouts"></select>
                </div>
                </div>
                <div ng-show="input.horizontalLayout==='Controlled Smushing'">
                    <div class="fig-opt-entry" ng-repeat="idx in [1, 6] | makeRange">
                        <div class="fig-opt">
                            <label class="fig-opt-label" for="hrule{{idx}}">Rule #{{idx}}:</label>
                            <input id="hrule{{idx}}" ng-model="input.hrule[idx]" type="checkbox"/>
                        </div>
                        <div class="fig-opt-info2">
                            <span class="glyphicon glyphicon-info-sign fig-opt-tips fig-icon" data-toggle="tooltip" title="{{ruleToolTip('h', idx)}}"></span>
                        </div>
                        <div style="clear:both"></div>
                    </div>
                    <div style="margin-bottom:16px;" ng-show="input.hrule[1] === false && input.hrule[2] === false && input.hrule[3] === false && input.hrule[4] === false && input.hrule[5] === false && input.hrule[6] === false">
                        <strong>Note:</strong> Not selecting any smushing rules is the same as selecting "Universal Smushing".
                    </div>
                </div>
                <div class="row apt-1">
                   <div class="col-md-6">
                        <label for="vlayout" class="fig-opt-label">Vertical Layout:</label>
                   </div>
                   <div class="col-md-6">
                        <select id="vlayout" ng-model="input.verticalLayout" ng-options="elm as elm for elm in input.layouts"></select>
                    </div>
                    </div>
                    <div class="fig-opt-info2">
                        <span class="glyphicon glyphicon-info-sign fig-opt-tips fig-icon" data-toggle="tooltip" title="The vertical kerning for the font."></span>
                    </div>
                <div ng-show="input.verticalLayout==='Controlled Smushing'">
                    <div class="fig-opt-entry" ng-repeat="idx in [1, 5] | makeRange">
                        <div class="fig-opt">
                            <label class="fig-opt-label" for="vrule{{idx}}">Rule #{{idx}}:</label>
                            <input id="vrule{{idx}}" ng-model="input.vrule[idx]" type="checkbox"/>
                        </div>
                    </div>
                    <div style="margin-bottom:16px;" ng-show="input.vrule[1] === false && input.vrule[2] === false && input.vrule[3] === false && input.vrule[4] === false && input.vrule[5] === false">
                        <strong>Note:</strong> Not selecting any smushing rules is the same as selecting "Universal Smushing".
                    </div>
                </div>
                <div class="row apt-1">
                   <div class="col-md-6">
                        <label class="fig-opt-label" for="printDirection">Print Direction:</label>
                   </div>
                   <div class="col-md-6">
                        <select
                            id="printDirection"
                            ng-model="input.printDirection"
                            ng-options="elm.value as elm.label for elm in printDirection"
                            size="1"
                        ></select>
                   </div>
                </div>
                <div class="row apt-1">
                   <div class="col-md-6">
                        <label class="fig-opt-label" for="hardBlank">Hard blank:</label>
                  </div>
                   <div class="col-md-6">
                        <input id="hardBlank" type="text" class="txt-single-input" maxlength=1 ng-model="input.hardBlank"></input>
                  </div>
                </div>
                <div class="row apt-1">
                   <div class="col-md-6">
                        <label class="fig-opt-label" for="baseline">Baseline:</label>
                    </div>
                   <div class="col-md-6">
                        <input id="baseline" type="text" class="txt-single-input" maxlength=1 ng-model="input.baseline"></input>
                    </div>
                </div>
                <div class="row apt-1">
                   <div class="col-md-12">
                       <div class="col-md-6 p-0">
                           <div class="custom-control custom-switch">
                               <input type="checkbox" class="custom-control-input" id="caseInsensitive"  ng-model="input.caseInsensitive" checked>
                               <label class="fig-opt-label custom-control-label" for="caseInsensitive">Case Insensitive</label>
                           </div>
                       </div>
                   </div>
                </div>
                <div class="container">
                   <div class="row align-items-end">
                   <br><br><br><br><br><br>
                       <div class="fig-opt-entry">
                           <button class="btn btn-default" ng-click="export()">Export</button>
                           <button class="btn btn-default" ng-click="import()">Import</button>
                           <button class="btn btn-default" ng-click="submitFont()"> Save </button>
                       </div>
                   </div>
                </div>
            </div>
        </div>
    </div>


    <div>
        <textarea ng-model="input.figText" class="fig-test-txt" ng-trim="false"></textarea>
        <div style="margin-top:16px;margin-bottom:16px;">
            <div style="float:left">
                <input type="checkbox" ng-model="input.showHardBlanks" id="fig-showhardblanks" />
                <label for="fig-showhardblanks">Show Hardblanks</label>
            </div>
            <div style="clear:both"></div>
        </div>
        <div class="fig-test-output" >{{figOutput}}</div>
    </div>"


