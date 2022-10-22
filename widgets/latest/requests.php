<?php defined('VALID') or die('Nuh-uh!'); ?>
<div class="header w-100 col-12 col-lg-12">
	<h2 class="ap-1 am-0 bg-header">LATEST ASCII REQUESTS</h2>
</div>

<div class="container-fluid m-0">
	<div class="col-12 bg-secondary apb-1">
		<div class="row">
			<div class="col-sm-10 text-truncate d-none d-sm-block apt-1">
				<span class="white">REQUEST</span>
			</div>
			<div class="col-6 col-sm-2 text-truncate apb-1 apt-1">
				<span class="white text-truncate">REQUESTED BY</span>
			</div>
		</div>
		<?php
		foreach(fetchAll('SELECT requests.id, title,nick FROM requests, users where requests.requestedby=users.id and STATUS = 0 ORDER BY requests.id DESC LIMIT 10') as $row) {
			?>
			<div class="row">
				<div class="col-6 col-sm-10 mb-4 mb-sm-0 text-truncate">
					<a class="cyan text-truncate" href="/info_requests.php?id=<?=$row->id?>"><?=$row->title?></a>
				</div>
				<div class="col-sm-2 text-truncate">
					<a class="yellow" href="/member/<?=$row->nick?>"><?=($row->nick)?></a>
				</div>
			</div>
			<?php
		}
		?>
	</div>
</div>
