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
        <?php /* widgets([
            ["file" => "latest/releases", "header" => "LATEST RELEASES", "columns" => 2],
            ["file" => "wall", "header" => "WALL OF FAME"]
        ]); */ ?>

        <!-- app css -->
        <!--    <link rel="stylesheet" type="text/css" href="assets/css/fonteditor.css" /> -->

        <div class="row" >
            <div class="col-lg-12">
                <h2 id="nav-tabs">PRIVATE FONT EDITOR</h2>
                <div class="bs-component">
                    <ul class="nav nav-tabs">
                        <li class="nav-item">
                            <p><a class="nav-link" href='fonteditor.php#/edit'>Edit </a></p>
                        </li>
                        <li class="nav-item">
                            <p><a class="nav-link" href='fonteditor.php#/test'>Test </a></p>
                        </li>
                    </ul>
                </div>
            </div>











    <div id="view-container" class="container">
        <div id='view' 
        class='page'
        ng-view="" 
        ng-cloak
        ></div>
    </div>
    <div dialog-export></div>
    <div dialog-import></div>
    <div dialog-submit-font></div>

    <script src='/assets/js/fonteditor/vendor/figlet/lib/figlet.js'></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
    <script src="https://netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min.js"></script>
    <script src='https://ajax.googleapis.com/ajax/libs/angularjs/1.2.9/angular.min.js'></script>
    <script src='https://ajax.googleapis.com/ajax/libs/angularjs/1.2.9/angular-route.min.js'></script>
    <script src='https://ajax.googleapis.com/ajax/libs/angularjs/1.2.9/angular-animate.min.js'></script>
    <script src="/assets/js/fonteditor/app.js"></script>
    <script src="/assets/js/fonteditor/build/services.js"></script>
    <script src="/assets/js/fonteditor/build/controllers.js"></script>
    <script src="/assets/js/fonteditor/build/filters.js"></script>
    <script src="/assets/js/fonteditor/build/directives.js"></script>
    <script src="/assets/js/fonteditor/build/templates.js"></script>
</div>
</div>

</html>




<div class="col-lg-2">
    <?php include "sidebar_right.php"; ?>
</div>
</div>
<?php include "footer.php";
