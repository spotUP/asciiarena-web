<?php
require_once "session.php";
$h1 = ["wELCOME tO aSCIIaRENA", "bY uP rOUGH and diViNE sTYLERS"];
include "header.php";
?>
<div class="modal-body row m-0 p-0">
  <div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
    <?php
    if (is_logged_in()) 
    {
      ?>
      <html ng-app="figfont">
      <div class="row">

        <div class="header col-lg-12">
          <h2>LOGO EDITOR</h2>
        </div>
        <div class="col-lg-12" style="margin-top: 16px;">
          <span>
            <label for="fontList">Font:</label>
            <select class="custom-select" id="fontList">
              <option value="Graffiti.flf" selected>Graffiti</option>
            </select>
          </span>
          <span>
            <label for="taagCharWidth">Character Width:</label>
            <select class="custom-select" id="taagCharWidth">
              <option value="full">Full</option>
              <option value="fitted">Fitted</option>
              <option value="controlled smushing">Smush (R)</option>
              <option value="universal smushing">Smush (U)</option>
              <option value="default" selected>Default</option>
            </select>
          </span>
          <span>
            <label for="taagCharHeight">Character Height: </label>
            <select class="custom-select" id="taagCharHeight">
              <option value="full">Full</option>
              <option value="fitted">Fitted</option>
              <option value="controlled smushing">Smush (R)</option>
              <option value="universal smushing">Smush (U)</option>
              <option value="default" selected>Default</option>
            </select>
          </span>
        </div>
        <div class="col-lg-12 d-flex justify-content-between" style="margin-top: 15px;">
          <textarea id="inputText">MY LOGO</textarea>
       </div>
       <div id="outputFigDisplay" style="margin-top: 16px; background: #1a1a1a; padding: 16px; overflow: hidden;"></div>
       <script type="text/javascript" src="/assets/js/logoeditor/jquery-1.7.2.min.js"></script>
       <script type="text/javascript" src="/assets/js/logoeditor/figlet.js"></script>
       <script type="text/javascript" src="/assets/js/logoeditor/aolfont.js"></script>
       <script type="text/javascript" src="/assets/js/logoeditor/share-box.js"></script>
       <script type="text/javascript" src="/assets/js/logoeditor/main.js"></script>
       <script type="text/javascript" src="/assets/js/logoeditor/macros.min.js" charset="ISO-8859-1" defer="defer"></script>
     </div>
     <?php
   }
   else
   {
    ?>
    <div class="col-lg-12">
      <div class="bs-component">
        <div class="animate__animated animate__shakeX alert alert-dismissible alert-primary">
          <button type="button" class="close" data-dismiss="alert">x</button>
          You need to be <a class="ascii" data-toggle="modal" style="padding-right: 8px;" href="#login">logged in</a>to use this feature.
        </div>
      </div>
    </div>
    <?php
  }
  ?>
</div>
<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
  <?php include "sidebar.php"; ?>
</div>
<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
  <?php include "sidebar_right.php"; ?>
</div>
</div>
<?php include "footer.php"; ?>


