<?php
require_once "session.php";
require_once "header.php";
//-----------------------------------------------------------------------------
// DISPLAY NEWS
//-----------------------------------------------------------------------------

$id = (int)$_GET['news_id'] ?? 0;
$news = fetchOne("SELECT * FROM news WHERE id = {$id}");
if($news) {
?>
				<table width="700"><caption><?=$news->subject?></caption>	
					<tr><td><?=$news->text?></td></tr>
					<tr><td bgcolor="#006600">Posted by <?=$news->poster?> <?=Date("Y-m-d H:i", $news->timestamp)?></td></tr>
			</table>
<?php }	?>
			</div>
		</div>
	</div>
	</body>
</html>
	
