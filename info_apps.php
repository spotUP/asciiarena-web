<?php
require_once "session.php";
$h1 = "rELEAsE iNFO";

$filename = $_GET['filename'];
$_SESSION['filename'] = $filename;
$nick = $_user['nick'];
$filename = preg_replace('/\.\.+/', '', $filename);
$app_available = true;
if (!fetchOne("SELECT 1 FROM apps WHERE filename = :filename", [":filename" => $filename])) {
		header("HTTP/1.0 404 Not Found");
		$app_available = false;
} else {
	$app = fetchOne("SELECT * FROM apps WHERE filename = :filename", [":filename" => $filename]);
}

require_once "header.php"; ?>

<div id="blacker"></div>
<div class="modal-body row m-0 p-0">
	<div class="col-lg-8 order-md-1 order-lg-2 order-xl-2 m-0 p-0 m-sm-1 p-sm-1">
		<?php if ($app_available) { ?>
                <div class="row">
                        <div class="header col-lg-12">
                                <h1 class="ap-1 bg-header"><?=htmlentities($app->name)?></h1>
                        </div>
                </div>
                <div class="container-fluid">
                        <div class="row ap-1 bg-secondary overflow-hidden">
                                <div class="animate__animated animate__backInLeft col-lg-8 d-flex justify-content-center justify-content-lg-start" style="position: relative; top: -16px;"
>
					<br/>
                                        <span>
						<?php
						$file_id = preg_replace('/\\.[^.\\s]{3,4}$/', '', $filename).'.diz';
						if (file_exists('apps/'.$file_id)) {
							echo '<pre>';
							echo file_get_contents('apps/'.$file_id);
							echo '</pre>';
						} elseif (file_exists('apps/'.$filename.'.diz.png')) {
							?>
							<img src="/apps/<?=$filename?>.diz.png" class="app-diz">
							<?php
						}
						?>
                                        </span>
                                </div>
                                <div class="col-lg-4">
                                        <div class="row d-flex justify-content-between">
						<span>Filename:</span>
						<span><?=htmlentities($filename)?></span>
					</div>
                                        <div class="row d-flex justify-content-between">
						<span>Size:</span>
						<span><?=formatBytes($app->filesize)?></span>
					</div>
                                        <div class="row d-flex justify-content-between">
						<span>Author:</span>
						<span><?=$app->author?></span>
					</div>
                                        <div class="row d-flex justify-content-between">
						<span>Downloads:</span>
						<span><?=sprintf("%u", $app->downloads)?></span>
					</div>
                                        <div class="row d-flex justify-content-between">
						<span>Uploader:</span>
						<span><a href="/member/<?=urlsafe($app->uploader)?>"><?=$app->uploader?></a></span>
					</div>
                                        <div class="row d-flex justify-content-between">
						<span>Uploaded:</span>
						<span><?=date("d M Y", $app->timestamp)?></span>
					</div>
				</div>

			</div>
		</div>
		<div class="container-fluid bg-secondary amb-1 apb-1" style="height: 132px;">
			<?php
			if (!isset($_POST[ 'download' ])) {
			?>
			<form action="/application/<?=$filename?>" method="post" id="download-app">
				<input type="submit" class="btn-big amb-1" name="download" value="Download">
			</form>
			<?php
			} else {
				echo "downloading...";
				doQuery("update apps set downloads=downloads+1 where filename=:filename", ["filename" => $filename]);
				?>
                                <script>
					var link = document.createElement("a");
                                        link.setAttribute('download', '');
                                        link.href = '/apps/<?=$filename?>';
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
				</script>
                                <meta content="1"; URL="<?=$filenameandpath?>" http-equiv="Refresh">
				<?php
			}
			?>
		</div>
		<?php } else { ?>
		<div class="row">
			<div class="col-lg-12">
				<div class="bs-component aml-1 amb-1">
					<div class="alert alert-danger">file not found</div>
				</div>
			</div>
		</div>
		<?php } ?>
	</div>

	<div class="col-lg-2 order-md-2 order-lg-1 order-xl-1">
		<?php include('sidebar.php'); ?>
	</div>

	<div class="col-lg-2 order-md-3 order-lg-3 order-xl-3">
		<?php include('sidebar_right.php'); ?>
	</div>
</div>
</div>
<?php include('footer.php'); ?>
