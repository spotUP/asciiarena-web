<?php
require_once "session.php";
include "header.php";
?><table class="table table-hover"><tbody><?php
foreach(fetchAll("SELECT * FROM collys ORDER BY filename ASC") as $row) {
	$dirname = explode(".", $row->filename);
	$filename = "collections/{$dirname[0]}/{$row->filename}.diz";
	$status = (file_exists($filename)) ? "success" : "danger";
?>
<tr class="table-<?=$status?>"><td><?=$row->filename?></td></tr>
<?php }
?>
</tbody></table>
	</div>
</body>
</html>
