<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="header w-100 col-12 col-lg-12">
	<h2 class="ap-1 am-0 bg-header">LATEST ASCII REQUESTS</h2>
</div>

<div class="container-fluid m-0">
	<div class="col-12 bg-secondary apb-1">
		<div class="row">
			<div class="col-12 apt-1">
				<span class="col-4 white text-truncate">REQUESTED BY</span>
				<span class="col-8 white">REQUEST</span>
			</div>
		</div>
		<?php
		foreach(fetchAll('SELECT requests.id, title,nick FROM requests, users where requests.requestedby=users.id and STATUS = 0 ORDER BY requests.id DESC LIMIT 10') as $row) {
			?>
			<div class="row">
				<div class="col-12 text-truncate">
					<span class="col-4"><a class="yellow" href="/member/<?=$row->nick?>"><?=($row->nick)?></a></span>
					<span class="col-8"><a class="cyan text-truncate" href="/info_requests.php?id=<?=$row->id?>"><?=$row->title?></a></span>
				</div>
			</div>
			<?php
		}
		?>
	</div>
</div>
