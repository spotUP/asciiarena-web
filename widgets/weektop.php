<?php defined('VALID') or die('Nuh-uh!');
$weektop_id = random_int(0, 65536);
$weektop = "weektop_{$weektop_id}";
$weektophdr = "weektophdr_{$weektop_id}";
?>
<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
	<div class="header col-lg-12 p-0">
		<h2 id="<?=$weektophdr?>" class="ap-1 bg-header">WEEKTOP - BBS UPLOADERS</h2>
	</div>
<div class="container-fluid p-0 p-lg-2">
	<div class="row m-0 p-0 bg-secondary apb-1" id="<?=$weektop?>"></div>
	</div>
</div>
<script>
	function fetch_weektop_<?=$weektop?>() {
		$.ajax({
			url: "https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Stats?StatType=16&Count=5"
		}).done(function (data) {
      var a = ''
			$.each(data.stats, function (i, item) {
        a = a+'<div class="col-lg-12 p-0 pl-lg-2 pr-lg-2 d-flex justify-content-between">'
        a = a+'<a class="yellow text-truncate">'
        a = a+item.name
        a = a+'</a>'
        a = a+'<span class="text-truncate">'
        var cnt = item.count
        if (cnt>10485759) {
          cnt = (cnt / 1024 / 1024).toFixed(0)
          a = a +cnt+' GB'
        } else if (cnt>900000) {
          cnt = (cnt / 1024 / 1024).toFixed(2)
          a = a +cnt+' GB'
        } else if (cnt>10239) {
          cnt = (cnt / 1024).toFixed(0)
          a = a+cnt+' MB'
        } else if (cnt>900) {
          cnt = (cnt / 1024).toFixed(2)
          a = a+cnt+' MB'
            
        } else {
          a = a+cnt+' KB'
        }
        a = a+'</span></div>'
        $("#<?=$weektop?>").html(a)
      });
		});
	}

	$(function () {
		fetch_weektop_<?=$weektop?>();
		setInterval(fetch_weektop_<?=$weektop?>, 60000);
	});
</script>
