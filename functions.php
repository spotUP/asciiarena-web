<?php defined('VALID') or die('Nuh-uh!');

//-----------------------------------------------------------
// FUNCTION: Replace <BR> with linebreaks
//-----------------------------------------------------------

	function br2nl($string) {
		return preg_replace('/<br[[:space:]]*/?[[:space:]]*>/i', chr(13) . chr(10), $string);
	}

//-----------------------------------------------------------
// FUNCTION: Verify e-mail address
//-----------------------------------------------------------

	function checkEmail($mail) {
		return filter_var($mail, FILTER_VALIDATE_EMAIL);
	}

	function spamFix($contact) {
		return str_replace(["@", "."], ["(at)", "(dot)"], $contact);
	}

	function fixOutputPost($insertstring, $base64 = false) {
		if ($base64) {
			$insertstring = base64_decode($insertstring);
			$insertstring = wordwrap($insertstring, 86, "\n", true);
			$insertstring = htmlspecialchars($insertstring);
//			$insertstring = str_replace(" ", "&nbsp;", $insertstring);
//		$insertstring=makeClickableLinks($insertstring);
			$insertstring = nl2br($insertstring);
			$insertstring = str_replace("<br />", "<br>", $insertstring);
		}
		return $insertstring;

	}

	function fixOutputEdit($insertstring) {
		global $base64;

		if ($base64 == 1) {
			$insertstring = base64_decode($insertstring);
		}
		$insertstring = wordwrap($insertstring, 86, "\n", true);
		$insertstring = br2nl($insertstring);
		return $insertstring;
	}

//-----------------------------------------------------------
// FUNCTION: truncate long string
//-----------------------------------------------------------

	function myTruncate($string, $limit, $break = " ", $pad = "") {
		if (strlen($string) <= $limit) {
			return $string;
		} // return with no change if string is shorter than $limit
		$string = substr($string, 0, $limit);
		if (false !== ($breakpoint = strrpos($string, $break))) {
			$string = substr($string, 0, $breakpoint);
		}
		return $string . $pad;
	}

	function pluralize($a = []) {
		if (count($a) < 3) {
			return implode(" & ", $a);
		}
		$last = array_pop($a);
		return implode(", ", $a) . " & {$last}";
	}

	function combinize($names = "", $ids = "", $base = "/", $fallback = "") {
		if (!empty($names) && !empty($ids)) {
			$a = array_map("trim", preg_split("([&,])", $names));
			$b = explode(",", $ids);
			$links = [];
			if (count($a) === count($b)) {
				foreach ($a as $k => $v) {
					$links[] = "<a href='{$base}{$b[$k]}'>{$v}</a>";
				}
				return pluralize($links);
			}
		}
		return $fallback;
	}

//---------------------------------------------------------------------------------------------------------------
// BG COLOR ARRAY (HEX)
//---------------------------------------------------------------------------------------------------------------

	$bg_color_list = [
		'#000000' => 'Black',
		'#0000aa' => 'Dark Blue',
		'#00aa00' => 'Dark Green',
		'#00aaaa' => 'Dark Cyan',
		'#aa0000' => 'Dark Red',
		'#aa00aa' => 'Magenta',
		'#aa5500' => 'Brown',
		'#555555' => 'Dark Grey',
		'#aaaaaa' => 'Grey',
		'#5555ff' => 'Blue',
		'#55ff55' => 'Green',
		'#5555ff' => 'Cyan',
		'#ff5555' => 'Red',
		'#ff55ff' => 'Magenta',
		'#ffff55' => 'Yellow',
		'#ffffff' => 'White',
	];

//---------------------------------------------------------------------------------------------------------------
// FG COLOR ARRAY (RGB)
//---------------------------------------------------------------------------------------------------------------

	$fg_color_list = [
		'0,0,0' => 'Black',
		'0,0,170' => 'Dark Blue',
		'0,170,0' => 'Dark Green',
		'0,170,170' => 'Dark Cyan',
		'170,0,0' => 'Dark Red',
		'170,0,170' => 'Magenta',
		'170,85,0' => 'Brown',
		'85,85,85' => 'Dark Grey',
		'170,170,170' => 'Grey',
		'85,85,255' => 'Blue',
		'85,255,85' => 'Green',
		'85,85,255' => 'Cyan',
		'255,85,85' => 'Red',
		'255,85,255' => 'Magenta',
		'255,255,85' => 'Yellow',
		'255,255,255' => 'White',
	];

//---------------------------------------------------------------------------------------------------------------
// MONTH ARRAY
//---------------------------------------------------------------------------------------------------------------

	$month_list = [
		"Unknown",
		"January",
		"February",
		"Mars",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	];

//---------------------------------------------------------------------------------------------------------------
// COUNTRY ARRAY
//---------------------------------------------------------------------------------------------------------------

	$country_list = [
		"Afghanistan",
		"Albania",
		"Algeria",
		"Andorra",
		"Angola",
		"Antigua and Barbuda",
		"Argentina",
		"Armenia",
		"Australia",
		"Austria",
		"Azerbaijan",
		"Bahamas",
		"Bahrain",
		"Bangladesh",
		"Barbados",
		"Belarus",
		"Belgium",
		"Belize",
		"Benin",
		"Bhutan",
		"Bolivia",
		"Bosnia and Herzegovina",
		"Botswana",
		"Brazil",
		"Brunei",
		"Bulgaria",
		"Burkina Faso",
		"Burundi",
		"Cambodia",
		"Cameroon",
		"Canada",
		"Cape Verde",
		"Central African Republic",
		"Chad",
		"Chile",
		"China",
		"Colombi",
		"Comoros",
		"Congo (Brazzaville)",
		"Congo",
		"Costa Rica",
		"Cote d'Ivoire",
		"Croatia",
		"Cuba",
		"Cyprus",
		"Czech Republic",
		"Denmark",
		"Djibouti",
		"Dominica",
		"Dominican Republic",
		"East Timor (Timor Timur)",
		"Ecuador",
		"Egypt",
		"El Salvador",
		"Equatorial Guinea",
		"Eritrea",
		"Estonia",
		"Ethiopia",
		"Fiji",
		"Finland",
		"France",
		"Gabon",
		"Gambia, The",
		"Georgia",
		"Germany",
		"Ghana",
		"Greece",
		"Grenada",
		"Guatemala",
		"Guinea",
		"Guinea-Bissau",
		"Guyana",
		"Haiti",
		"Honduras",
		"Hungary",
		"Iceland",
		"India",
		"Indonesia",
		"Iran",
		"Iraq",
		"Ireland",
		"Israel",
		"Italy",
		"Jamaica",
		"Japan",
		"Jordan",
		"Kazakhstan",
		"Kenya",
		"Kiribati",
		"Korea, North",
		"Korea, South",
		"Kuwait",
		"Kyrgyzstan",
		"Laos",
		"Latvia",
		"Lebanon",
		"Lesotho",
		"Liberia",
		"Libya",
		"Liechtenstein",
		"Lithuania",
		"Luxembourg",
		"Macedonia",
		"Madagascar",
		"Malawi",
		"Malaysia",
		"Maldives",
		"Mali",
		"Malta",
		"Marshall Islands",
		"Mauritania",
		"Mauritius",
		"Mexico",
		"Micronesia",
		"Moldova",
		"Monaco",
		"Mongolia",
		"Morocco",
		"Mozambique",
		"Myanmar",
		"Namibia",
		"Nauru",
		"Nepa",
		"Netherlands",
		"New Zealand",
		"Nicaragua",
		"Niger",
		"Nigeria",
		"Norway",
		"Oman",
		"Pakistan",
		"Palau",
		"Panama",
		"Papua New Guinea",
		"Paraguay",
		"Peru",
		"Philippines",
		"Poland",
		"Portugal",
		"Qatar",
		"Romania",
		"Russia",
		"Rwanda",
		"Saint Kitts and Nevis",
		"Saint Lucia",
		"Saint Vincent",
		"Samoa",
		"San Marino",
		"Sao Tome and Principe",
		"Saudi Arabia",
		"Senegal",
		"Serbia and Montenegro",
		"Seychelles",
		"Sierra Leone",
		"Singapore",
		"Slovakia",
		"Slovenia",
		"Solomon Islands",
		"Somalia",
		"South Africa",
		"Spain",
		"Sri Lanka",
		"Sudan",
		"Suriname",
		"Swaziland",
		"Sweden",
		"Switzerland",
		"Syria",
		"Taiwan",
		"Tajikistan",
		"Tanzania",
		"Thailand",
		"Togo",
		"Tonga",
		"Trinidad and Tobago",
		"Tunisia",
		"Turkey",
		"Turkmenistan",
		"Tuvalu",
		"Uganda",
		"Ukraine",
		"United Arab Emirates",
		"United Kingdom",
		"United States",
		"Uruguay",
		"Uzbekistan",
		"Vanuatu",
		"Vatican City",
		"Venezuela",
		"Vietnam",
		"Yemen",
		"Zambia",
		"Zimbabwe"
	];
