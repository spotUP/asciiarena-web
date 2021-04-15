<?php defined('VALID') or die('Nuh-uh!');

//-----------------------------------------------------------
// FUNCTION: Replace <BR> with linebreaks
//-----------------------------------------------------------

	function br2nl($string) {
		return preg_replace('/<br[[:space:]]*\/?[[:space:]]*>/i', chr(13) . chr(10), $string);
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
		if($base64) {
			$insertstring = base64_decode($insertstring);
			$insertstring = wordwrap($insertstring, 86, "\n", true);
			$insertstring = htmlspecialchars($insertstring);
			$insertstring = nl2br($insertstring);
			$insertstring = str_replace("<br />", "<br>", $insertstring);
		}
		return $insertstring;

	}

	function fixOutputEdit($insertstring) {
		global $base64;

		if($base64 == 1) {
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
		if(strlen($string) <= $limit) {
			return $string;
		} // return with no change if string is shorter than $limit
		$string = substr($string, 0, $limit);
		if(false !== ($breakpoint = strrpos($string, $break))) {
			$string = substr($string, 0, $breakpoint);
		}
		return $string . $pad;
	}

	/**
	 * Pluralize an array into a nice string.
	 * @param array $a
	 * @param string $f // Separator before last element
	 * @param string $s // Separator between each element
	 * @return string
	 */
	function pluralize($a = [], $f = " & ", $s = ", ") {
		if(count($a) < 3) {
			return implode($f, $a);
		}
		$last = array_pop($a);
		return implode($s, $a) . "{$f}{$last}";
	}

	/**
	 * Split up names and ids and then combine into an array of links again
	 * @param string $names
	 * @param string $ids
	 * @param string $base
	 * @param string $fallback
	 * @return mixed|string
	 */
	function combinize($names = "", $ids = "", $base = "/", $fallback = "") {
		if(!empty($names)) {
			$a = array_map("trim", preg_split("([&,])", $names));
			if(empty($ids)) {
				$b = $a;
			} else {
				$b = explode(",", $names);
			}
			$links = [];
			if(count($a) === count($b)) {
				foreach($a as $k => $v) {
					$links[] = "<a href='{$base}".urlsafe($b[$k])."'>{$v}</a>";
				}
				return pluralize($links);
			}
		}
		return $fallback;
	}

	/**
	 * Takes a stringed list of values and base64_encodes them
	 * @param string $values
	 * @return string
	 */
	function b64ize($values = "") {
		$a = array_map("trim", preg_split("([&,])", $values));
		$ret = [];
		foreach($a as $v) {
			$ret[] = base64_encode($v);
		}
		return pluralize($ret);
	}

	function json_out($data = [], $code = 200) {
		http_response_code($code);
		header("Content-Type: application/json");
		try {
			return json_encode($data);
		} catch (Exception $e) {
			return "[]";
		}
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
		"December",
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
		"Zimbabwe",
	];

//-----------------------------------------------------------
// FUNCTION: create url safe string
//-----------------------------------------------------------

function urlsafe($string) {
   $string = strtolower(iconv("utf-8", "us-ascii//TRANSLIT", $string));
   $string = preg_replace('/[\s\!]+/', '-', $string);
   $string = preg_replace('/[^-a-z0-9_]+/', '', $string);
   $string = preg_replace('/-+$/', '-', $string);
   $string = preg_replace('/-+/', '-', $string);
   return $string;
}

//-----------------------------------------------------------
// FUNCTION: fix text encoding issues
//-----------------------------------------------------------

function RemoveBS($Str) {  
  $StrArr = str_split($Str); $NewStr = '';
  foreach ($StrArr as $Char) {    
    $CharNo = ord($Char);
    if ($CharNo == 163) { $NewStr .= $Char; continue; } // keep £ 
    if ($CharNo > 31 && $CharNo < 127) {
      $NewStr .= $Char;    
    }
  }  
  return $NewStr;
}

//-----------------------------------------------------------
// FUNCTION: recalculate crew & artist ratings
//-----------------------------------------------------------

function recalculate_ratings() {
	$ask = 'update artists a set a.rating=0';
	doQuery($ask);
	$ask = 'update artists a
			inner join (
				select round(avg(rating),2) as avgrating, artist, count(*) as cnt from comments 
				where rating>0 group by artist having cnt>2
			) as r on a.nick=r.artist
		set a.rating = r.avgrating';
	doQuery($ask);
	$ask = 'update crews c set c.rating=0';
	doQuery($ask);
	$ask = 'update crews c
			inner join (
				select round(avg(rating),2) as avgrating, crew, count(*) as cnt from comments
				where rating>0 group by crew having cnt>1
			) as r on c.name=r.crew
		set c.rating = r.avgrating';
	doQuery($ask);
}

//-----------------------------------------------------------
//  formatBytes($file_size) mixed file sizes
//  formatBytes($file_size, 0) KB file sizes
//  formatBytes($file_size, 1) MB file sizes etc
//-----------------------------------------------------------

function formatBytes($bytes, $format = 99) {
$byte_size = 1024;
    $byte_type = array(" KB", " MB", " GB", " TB", " PB", " EB", " ZB", " YB");
 
    $bytes /= $byte_size;
    $i = 0;
 
    if ($format == 99 || $format > 7) {
      while ($bytes > $byte_size) {
            $bytes /= $byte_size;
            $i++;
        }
    } else {
      while ($i < $format) {
            $bytes /= $byte_size;
            $i++;
        }
    }
 
    $bytes = sprintf("%1.0f", $bytes);
    $bytes .= $byte_type[$i];
 
    return$bytes;
}
