<?php
require_once "session.php";
$h1 = "WELCOME TO aSCIIaRENA";
include "header.php";
?>
<html ng-app="figfont">
<div class="row">
  <div class="col-lg-2">
    <?php include "sidebar.php"; ?>
  </div>
  <div class="col-lg-8">
    <div class="header col-lg-12">
      <h2>LOGO EDITOR</h2>
    </div>
    <div class="col-lg-12" style="margin-top: 16px;">
      <span>
        <label for="fontList">Font:</label>
        <select id="fontList">
          <option value="Graffiti.flf" selected>Graffiti</option>
        </select>
      </span>
      <span>
        <label for="taagCharWidth">Character Width:</label>
        <select id="taagCharWidth">
          <option value="full">Full</option>
          <option value="fitted">Fitted</option>
          <option value="controlled smushing">Smush (R)</option>
          <option value="universal smushing">Smush (U)</option>
          <option value="default" selected>Default</option>
        </select>
      </span>
      <span>
        <label for="taagCharHeight">Character Height: </label>
        <select id="taagCharHeight">
          <option value="full">Full</option>
          <option value="fitted">Fitted</option>
          <option value="controlled smushing">Smush (R)</option>
          <option value="universal smushing">Smush (U)</option>
          <option value="default" selected>Default</option>
        </select>
      </span>
    </div>
    <div class="col-lg-12 d-flex justify-content-between" style="margin-top: 15px;">
     <textarea id="inputText">ENTER TEXT</textarea>
   </div>
   <div id="outputFigDisplay" style="margin-top: 16px; background: #1a1a1a; padding: 16px; overflow: hidden;"></div>
   <script type="text/javascript" src="/assets/js/logoeditor/jquery-1.7.2.min.js"></script>
   <script type="text/javascript" src="/assets/js/logoeditor/figlet.js"></script>
   <script type="text/javascript" src="/assets/js/logoeditor/aolfont.js"></script>
   <script type="text/javascript" src="/assets/js/logoeditor/share-box.js"></script>
   <script type="text/javascript" src="/assets/js/logoeditor/main.js"></script>
   <script type="text/javascript" src="/assets/js/logoeditor/macros.min.js" charset="ISO-8859-1" defer="defer"></script>
 </div>
 <div class="col-lg-2">
  <?php include "sidebar_right.php"; ?>
</div>
</div>
<?php include "footer.php";
