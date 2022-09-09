<?php defined('VALID') or die('Nuh-uh!');
$bbsweektop_id = random_int(0, 65536);
$bbsweektop = "bbsweektop_{$bbsweektop_id}";
$bbsweektophdr = "bbsweektophdr_{$bbsweektop_id}";
?>
<div class="container fluid col-12 p-0 pl-lg-2 pr-lg-2">
	<div class="header col-lg-12 p-0">
		<h2 id="<?=$bbsweektophdr?>" class="ap-1 bg-header">WEEKTOP - BBS:ES</h2>
	</div>
<div class="container-fluid p-0 p-lg-2 bg-secondary">
	<div class="row m-0 p-0 bg-secondary apb-1" id="<?=$bbsweektop?>"></div>
	</div>
</div>
<script>
	function fetch_bbsweektop_<?=$bbsweektop?>() {
		$.ajax({
			url: "https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers/Stats?StatType=26&Count=5"
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
        $("#<?=$bbsweektop?>").html(a)
      });
		});
	}

	$(function () {
		fetch_bbsweektop_<?=$bbsweektop?>();
		setInterval(fetch_bbsweektop_<?=$bbsweektop?>, 60000);
	});
</script>
