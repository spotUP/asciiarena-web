<?php
require_once "session.php";
$h1 = "ASCII STYLE DESIGNER";
include "header.php";
?>
<div class="modal-body row m-0 p-0">
    <div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1 bg-secondary">
        <?php
        if (is_logged_in()) 
        {
        ?>
            <html ng-app="figfont">
            <div class="row" >
                <div class="col-lg-12">
                    <h2 class="bg-header" id="nav-tabs"></h2>
                    <div class="bs-component">
                        <ul class="nav nav-tabs apt-1 bg-secondary">
                            <li class="nav-item bg-secondary">
                                <p><a style="background: #212121 !important;" class="nav-link bg-secondary" href='styleeditor.php#/edit'>Character Editor </a></p>
                            </li>
                            <li class="nav-item bg-secondary">
                                <p><a style="background: #212121 !important;" class="nav-link bg-secondary" href='styleeditor.php#/test'>Logo Maker </a></p>
                            </li>
                        </ul>
                    </div>
                </div>
                <div id="view-container" class="container">
                    <div id='view' class='page apt-1 apl-1 apr-1 bg-secondary' ng-view="" ng-cloak></div>
                </div>
                <div dialog-export></div>
                <div dialog-import></div>
                <div dialog-submit-font></div>
                <link rel="stylesheet" href="/assets/css/fonteditor.css" media="screen">
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


