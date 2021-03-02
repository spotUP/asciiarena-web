<?php /** @noinspection PhpIncludeInspection */
	defined('VALID') or die('Nuh-uh!');
	/**
	 * @param array $widgets
	 * @param bool $shuffle
	 *
	 * Widget renderer. Takes an array of widgets and includes them one by one if they exist in the widgets-dir.
	 * Either use just the filename without the suffix or an array consisting of the parameters needed.
	 * Required parameter is *file*, everything else is optional.
	 */
	function widgets($widgets = [], $shuffle = false) {
		global $_user;
		if ($shuffle) {
			shuffle($widgets);
		}
		foreach ($widgets as $widget) {
			$file = $widget;
			[$header, $class] = "";
			$style = "margin-bottom: 16px;";
			$limit = 5;
			$skip_row = false;
			$output = [];
			if (is_array($widget)) {
				extract($widget, EXTR_OVERWRITE);
			}
			if (file_exists(BASEDIR . "/widgets/{$file}.php")) {
				$output[] = "<div class=\"widget\">";
				if (!$skip_row) {
					$output[] = "<div class=\"row {$class}\" style=\"{$style}\">";
				}
				if (!empty($header)) {
					$output[] = "<div class=\"header col-12\"><h2 class='ap-1 bg-header'>{$header}</h2></div>";
				}
				ob_start();
				include BASEDIR . "/widgets/{$file}.php";
				$content = ob_get_clean();
				$output[] = $content;
				if (!$skip_row) {
					$output[] = "</div>";
				}
				$output[] = "</div>";
				if (!empty($content)) {
					echo implode("\n", $output);
				}
			}
		}
	}
