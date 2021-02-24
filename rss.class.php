<?php
include_once('session.php');

class RSS
  {

	public function GetFeed($id)
	{
		return $this->getDetails($id) . $this->getItems($id);
	}

	private function getDetails($id)
	{
		switch ($id)
		{
			case 0:
				$title = "Latest Added Collys";
			case 1:
				$title = "Latest Released Collys";
			break;
			default:
		}
		
	
		$details = '<?xml version="1.0" encoding="ISO-8859-1" ?>
				<rss version="2.0">
					<channel>
						<title>'. $title .'</title>
						<link></link>
						<description></description>';
		return $details;
	}

	private function getItems($id)
	{
		
		switch ($id)
		{
			case 0:
				$ask="select * from collys order by timestamp desc limit 5";										// latest added collys
			case 1:
				$ask="(select * from collys order by year desc limit 5) order by month desc, timestamp asc ";		// latest released collys
			break;
			default:
				$ask="";
		}
		
		$result=fetchAll($ask);
		$items = '';
		foreach($result as $row)
		{
			$encodedfilename = base64_encode($row->filename);
			$items .= '<item>
				<title>'. $row->id .' ('. $row->filename .')</title>
				<link>https://www.asciiarena.se/info_release.php?filename='.$encodedfilename.' </link>
				<description></description>
			</item>';
		}
		$items .= '</channel>
				</rss>';
		return $items;
	}

}

?>
