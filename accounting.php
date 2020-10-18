<?php
require_once "session.php";
defined('VALID') or die('Nuh-uh!');
header('Content-Type: text/html; charset=ISO-8859-1');
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<title>aSCIIaRENA</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
	<link rel="stylesheet" href="/assets/css/bootstrap.css" media="screen">
	<link rel="stylesheet" href="/assets/css/site.css" media="screen">
	<script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
	<script src="/assets/js/bootstrap.bundle.js"></script>
	<style>
		.myinput{
			color: white;
		}
		.myinput:hover{
			color: black;
			background: #aaaaaa;
		}
		.myinput:focus{
			color: black;
			background: #aaaaaa;
		}
	</style>
</head>

<body>
	<div class="navbar navbar-expand-lg fixed-top navbar-dark bg-menu" style="top: 0px; border-top: 3px solid black;">
		<div class="container-fluid">
			<div class="collapse navbar-collapse" id="navbarResponsive">
				<ul class="navbar-nav">
					<li class="nav-item">
						<a style="padding-right: 8px;" class="nav-link" href="#">File</a>
					</li>

					<li class="nav-item">
						<a style="padding-right: 8px;" class="nav-link" href="#">Edit</a>
					</li>

					<li class="nav-item">
						<a style="padding-right: 8px;" class="nav-link" href="#">Print</a>
					</li>

					<li class="nav-item">
						<a style="padding-right: 8px;" class="nav-link" href="#">Select</a>
					</li>

					<li class="nav-item">
						<a style="padding-right: 8px;" class="nav-link" href="#">Format</a>
					</li>

					<li class="nav-item">
						<a style="padding-right: 8px;" class="nav-link" href="#">Options</a>
					</li>

					<li class="nav-item">
						<a style="padding-right: 8px;" class="nav-link" href="#">Chart</a>
					</li>

					<li class="nav-item">
						<a style="padding-right: 8px;" class="nav-link" href="#">Window</a>
					</li>
				</ul>
			</div>
		</div>
	</div>
	<div class="row pt-4" style="padding-bottom: 16px;">
		<div class="col-2" style="color: #eeee44; text-align:center;">A</div>
		<div class="col-2" style="color: #eeee44; text-align:center;">B</div>
		<div class="col-2" style="color: #eeee44; text-align:center;">C</div>
		<div class="col-2" style="color: #eeee44; text-align:center;">D</div>
		<div class="col-2" style="color: #eeee44; text-align:center;">E</div>
		<div class="col-2" style="color: #eeee44; text-align:center;">F</div>
	</div>
	<div style="float: left;">
		<span style="color: #eeee44;"><br>1<br> 2<br> 3<br> 4<br> 5<br> 6<br> 7<br> 8<br> 9<br> 10<br> 11<br> 12<br> 13<br> 14<br> 15<br> 16<br> 17<br> 18<br> 19<br> 20<br> 21<br>F12<br></span>
	</div>

	<div class="container" style="background: #1c00b0; margin-left: 32px; padding-bottom: 16px; padding-top: 16px;">
		<div class="row">
			<div class="col-2 myinput">Loan Amount</div><div class="col-2 myinput" contenteditable="true">1,000.00</div>
		</div>

		<div class="row">
			<div class="col-2 myinput">Interest</div><div class="col-2 myinput" contenteditable="true">12.00%</div>
		</div>

		<div class="row">
			<div class="col-2 myinput">Term (months)</div><div class="col-2 myinput" contenteditable="true">12</div>
		</div>

		<div class="row">
			<div class="col-2 myinput">Starting</div><div class="col-2 myinput" contenteditable="true">1/88</div>
		</div>

		<div class="row" style="padding-top: 16px;">
			<div class="col-2 myinput" contenteditable="true">Month</div>
			<div class="col-2 myinput" contenteditable="true">Balance</div>
			<div class="col-2 myinput" contenteditable="true">Payment</div>
			<div class="col-2 myinput" contenteditable="true">Interest</div>
			<div class="col-2 myinput" contenteditable="true">Principal</div>
			<div class="col-2 myinput" contenteditable="true">New Balance</div>
		</div>

		<div class="row" style="padding-top: 16px;">
			<div class="col-2 myinput" contenteditable="true">1/88</div>
			<div class="col-2 myinput" contenteditable="true">1,000.00</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">10.00</div>
			<div class="col-2 myinput" contenteditable="true">78.85</div>
			<div class="col-2 myinput" contenteditable="true">921.15</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">2/88</div>
			<div class="col-2 myinput" contenteditable="true">921.15</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">9.21</div>
			<div class="col-2 myinput" contenteditable="true">79.64</div>
			<div class="col-2 myinput" contenteditable="true">841.51</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">3/88</div>
			<div class="col-2 myinput" contenteditable="true">841.51</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">8.42</div>
			<div class="col-2 myinput" contenteditable="true">80.43</div>
			<div class="col-2 myinput" contenteditable="true">761.08</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">4/88</div>
			<div class="col-2 myinput" contenteditable="true">761.08</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">7.61</div>
			<div class="col-2 myinput" contenteditable="true">81.24</div>
			<div class="col-2 myinput" contenteditable="true">679.84</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">5/88</div>
			<div class="col-2 myinput" contenteditable="true">679.84</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">6.80</div>
			<div class="col-2 myinput" contenteditable="true">82.05</div>
			<div class="col-2 myinput" contenteditable="true">597.79</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">6/88</div>
			<div class="col-2 myinput" contenteditable="true">597.79</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">5.98</div>
			<div class="col-2 myinput" contenteditable="true">82.87</div>
			<div class="col-2 myinput" contenteditable="true">514.92</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">7/88</div>
			<div class="col-2 myinput" contenteditable="true">514.92</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">5.15</div>
			<div class="col-2 myinput" contenteditable="true">83.70</div>
			<div class="col-2 myinput" contenteditable="true">431.22</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">8/88</div>
			<div class="col-2 myinput" contenteditable="true">431.22</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">4.31</div>
			<div class="col-2 myinput" contenteditable="true">84.54</div>
			<div class="col-2 myinput" contenteditable="true">346.68</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">9/88</div>
			<div class="col-2 myinput" contenteditable="true">346.68</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">3.47</div>
			<div class="col-2 myinput" contenteditable="true">85.38</div>
			<div class="col-2 myinput" contenteditable="true">261.30</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">10/88</div>
			<div class="col-2 myinput" contenteditable="true">261.30</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">2.61</div>
			<div class="col-2 myinput" contenteditable="true">86.24</div>
			<div class="col-2 myinput" contenteditable="true">175.07</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">11/88</div>
			<div class="col-2 myinput" contenteditable="true">175.07</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">1.75</div>
			<div class="col-2 myinput" contenteditable="true">87.10</div>
			<div class="col-2 myinput" contenteditable="true">87.97</div>
		</div>

		<div class="row">
			<div class="col-2 myinput" contenteditable="true">12/88</div>
			<div class="col-2 myinput" contenteditable="true">87.97</div>
			<div class="col-2 myinput" contenteditable="true">88.85</div>
			<div class="col-2 myinput" contenteditable="true">0.88</div>
			<div class="col-2 myinput" contenteditable="true">87.97</div>
			<div class="col-2 myinput" contenteditable="true">0.00</div>
		</div>

		<div class="row" style="padding-top: 16px;">
			<div class="col-2 myinput" contenteditable="true">Totals</div>
			<div class="col-2 myinput" contenteditable="true"></div>
			<div class="col-2 myinput" contenteditable="true">1,066.19</div>
			<div class="col-2 myinput" contenteditable="true">66.19</div>
			<div class="col-2 myinput" contenteditable="true"></div>
			<div class="col-2 myinput" contenteditable="true"></div>
		</div>
	</div>

	<div class="navbar navbar-expand-lg fixed-bottom navbar-dark bg-secondary d-flex justify-content-between bg-menu" style="height: 22px;"><span style="margin-left: 32px; color: black;">Press ALT to choose commands.</span> <span style="margin-right: 32px; color: black;">SS 00.WKS</span>
</div>
