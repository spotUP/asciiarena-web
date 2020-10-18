<?php
require_once "session.php";
$h1 = "wELCOME tO aSCIIaRENA";
include "header.php";
?>
<style> 

/* 
  ##Device = Desktops
  ##Screen = 1281px to higher resolution desktops
  */

  @media (min-width: 1281px) {

  	.standard-dialogue-width{
  		width: 318px;
  	}
  	.file-dialogue-width{
  		width: 318px;
  	}
  	.font-dialogue-width{
  		width: 318px;
  	}
  	.search-dialogue-width{
  		width: 448px;
  	}
  	.about-dialogue-width{
  		width: 640px;
  	}
  	.hip-dialogue-width{
  		width: 264px;
  	}
  	.hippoinfo-dialogue-width{
  		width: 384px;
  	}  
  }

/* 
  ##Device = Laptops, Desktops
  ##Screen = B/w 1025px to 1280px
  */

  @media (min-width: 1025px) and (max-width: 1280px) {

  	.standard-dialogue-width{
  		width: 318px;
  	}

  	.file-dialogue-width{
  		width: 318px;
  	}
  	.font-dialogue-width{
  		width: 318px;
  	}
  	.search-dialogue-width{
  		width: 448px;
  	}
  	.about-dialogue-width{
  		width: 640px;
  	}
  	.hip-dialogue-width{
  		width: 264px;
  	}
  	.hippoinfo-dialogue-width{
  		width: 384px;
  	}  
  }

/* 
  ##Device = Tablets, Ipads (portrait)
  ##Screen = B/w 768px to 1024px
  */

  @media (min-width: 768px) and (max-width: 1024px) {

  	.standard-dialogue-width{
  		width: 318px;
  	}

  	.file-dialogue-width{
  		width: 318px;
  	}
  	.font-dialogue-width{
  		width: 318px;
  	}
  	.search-dialogue-width{
  		width: 448px;
  	}
  	.about-dialogue-width{
  		width: 640px;
  	}
  	.hip-dialogue-width{
  		width: 264px;
  	}
  	.hippoinfo-dialogue-width{
  		width: 384px;
  	}  
  }

/* 
  ##Device = Tablets, Ipads (landscape)
  ##Screen = B/w 768px to 1024px
  */

  @media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {

  	.standard-dialogue-width{
  		width: 100%;
  	}

  	.file-dialogue-width{
  		width: 100%;
  	}

  	.font-dialogue-width{
  		width: 100%;
  	}

  	.search-dialogue-width{
  		width: 100%;
  	}

  	.about-dialogue-width{
  		width: 100%;
  	}

  	.hip-dialogue-width{
  		width: 100%;
  	}

  	.hippoinfo-dialogue-width{
  		width: 100%;
  	}  
  }

/* 
  ##Device = Low Resolution Tablets, Mobiles (Landscape)
  ##Screen = B/w 481px to 767px
  */

  @media (min-width: 481px) and (max-width: 767px) {

  	.file-dialogue-width{
  		width: 100%;
  	}

  	.font-dialogue-width{
  		width: 100%;
  	}

  	.search-dialogue-width{
  		width: 100%;
  	}

  	.about-dialogue-width{
  		width: 100%;
  	}

  	.hip-dialogue-width{
  		width: 100%;
  	}

  	.hippoinfo-dialogue-width{
  		width: 100%;
  	}  
  }

/* 
  ##Device = Most of the Smartphones Mobiles (Portrait)
  ##Screen = B/w 320px to 479px
  */

  @media (min-width: 320px) and (max-width: 480px) {

  	.file-dialogue-width{
  		width: 100%;
  	}

  	.font-dialogue-width{
  		width: 100%;
  	}

  	.search-dialogue-width{
  		width: 100%;
  	}

  	.about-dialogue-width{
  		width: 100%;
  	}

  	.hip-dialogue-width{
  		width: 100%;
  	}

  	.hippoinfo-dialogue-width{
  		width: 100%;
  	}  
  }
  .hip-header{
  	position: relative;
  	background: #ababab;
  	border-top: 2px solid #000 !important;
  	border-left: 2px solid #000 !important;
  	border-right: 2px solid #fff !important;
  	border-bottom: 2px solid #fff !important;
  	margin-bottom: 4px;
  	padding-top: 4px;
  	padding-bottom: 2px;
  	padding-left: 4px;
  	padding-right: 4px;
  }
  .req-container{
  	background: #ababab;
  	position: relative;
  	--contentWidth: 100%;
  	margin-bottom: 40px;
  }
  .req-content {
  	max-width: var(--contentWidth);
  	box-sizing: border-box !important;
  	margin: 0 auto;
  	padding: 4px;
  	border-bottom: 2px solid white !important;
  }
  .hippo{
  	background-image: url('assets/data/hippo/hippobg.png')

  }
  .req-close-button
  {
  	background-image: url("assets/data/cedd/req_close_button.png");
  	background-repeat: none;
  	width: 20px;
  	height: 21px;
  	position: absolute;
  	top: 0px;
  	left: 0px;
  	z-index: 400;
  }
  .req-size-gadget
  {
  	background-image: url("assets/data/cedd/req_gadget_a.png");
  	background-repeat: none;
  	width: 23px;
  	height: 22px;
  	position: absolute;
  	top: 0px;
  	right: 23px;
  	z-index: 900;
  }
  .req-cycle-gadget
  {
  	background-image: url("assets/data/cedd/req_gadget_b.png");
  	background-repeat: none;
  	width: 23px;
  	height: 22px;
  	top: 0px;
  	right: 0px;
  	z-index: 900;
  	position: absolute;
  }

  .req-label{
  	min-width: 64px;
  	text-align: right;
  	padding-right: 8px;
  	margin-top: 4px;
    color: #000;
  }
  input.tight{
  	font-family: 'Topaz_a1200';
  	font-size: 16px;
  	line-height: 16px;
  	background: #ababab !important;
  	border-left: 2px solid #000 !important;
  	border-top: 2px solid #000 !important;
  	border-right: 2px solid #fff !important;
  	border-bottom: 2px solid #fff !important;
  	color: black !important;
  	font-smooth: never !important;
  	-webkit-font-smooth : none !important;
  	border-radius: 0px;
  	-webkit-appearance: none;
  	position: relative;
  	box-sizing: content-box;
  	width: 100%;
  	margin: 0 auto; 
  	box-sizing: border-box !important;
  	position: relative;
  	padding-top: 10px;
  	padding-bottom: 10px;
  }
  input.tight:focus{
  	outline: none;
  }
  .req-title{
  	position: relative;
  	width: 100%;
  	height: 22px;
  	background: #6688bb;
  	top: 0px;
  	left: 0px;
  	border-bottom: 2px solid black !important;
  	border-top: 2px solid white !important;
  	border-left: 1px solid white !important;
  	border-right: 1px solid black !important;
  	z-index: 200;
  	padding-left: 2px;
  	box-sizing: border-box !important;
  	color: #000;
  }

  .req-title-padding{
  	position: relative;
  	width: 100%;
  	height: 22px;
  	background: #6688bb;
  	top: 0px;
  	left: 0px;
  	border-bottom: 2px solid black;
  	border-top: 2px solid white;
  	border-left: 1px solid white;
  	border-right: 1px solid black;
  	z-index: 200;
  	padding-left: 2px;
  	box-sizing: border-box !important;
  	padding-left: 29px;
  	color: #000;
  }
  .req-tight-border {
  	border-left: 2px solid #fff !important;
  	border-top: 2px solid #fff !important;
  	border-right: 2px solid #000 !important;
  	border-bottom: 2px solid #000 !important;
  	padding-top: 0px;
  	box-sizing: border-box !important;
  	position: relative;
  	width: 100%;
  }
  .req-tight-border:before {
  	background: none;
  	content: "";
  	display: block;
  	position: relative;
  	top: 0px;
  	left: 0px;
  	right: 0px;
  	bottom: 0px;
  	pointer-events: none;
  	box-sizing: border-box !important;
  	width: 100%;
  }

  .range-border {
  	border-left: 2px solid #fff !important;
  	border-top: 2px solid #fff !important;
  	border-right: 2px solid #000 !important;
  	border-bottom: 2px solid #000 !important;
  	padding-top: 3px;
  	box-sizing: border-box !important;
  	position: relative;
  }
  .range-border:before {
  	background: none;
  	content: "";
  	display: block;
  	position: relative;
  	top: 0px;
  	left: 0px;
  	right: 0px;
  	bottom: 0px;
  	pointer-events: none;
  	box-sizing: border-box !important;
  }
  .req-button-container
  {
  	width: 100%;
  	margin-bottom: 3px;
  	display: flex;
  	justify-content: space-between;
  }
  .hip-button{
  	position: relative;
  	font-family: 'Topaz_a1200';
  	background: #aaaaaa;
  	border-top: 2px solid #fff !important;
  	border-left: 2px solid #fff !important;
  	border-right: 2px solid #000 !important;
  	border-bottom: 2px solid #000 !important;
  	box-sizing: border-box !important;
  	padding-bottom: 22px;
  }
  .hip-button:active{
  	position: relative;
  	font-family: 'Topaz_a1200';
  	background: #6688bb;
  	border-top: 2px solid #000 !important;
  	border-left: 2px solid #000 !important;
  	border-right: 2px solid #fff !important;
  	border-bottom: 2px solid #fff !important;
  	box-sizing: border-box !important;

  }
  .hip-button:focus{

  	outline: none;
  }
  .hip-3-button{
  	position: relative;
  	font-family: 'Topaz_a1200';
  	font-size: 16px;
  	width: 100%; 
  	height: 26px;
  	background: #aaaaaa;
  	border-top: 2px solid #fff !important;
  	border-left: 2px solid #fff !important;
  	border-right: 2px solid #000 !important;
  	border-bottom: 2px solid #000 !important;
    margin-left: 0px;
    margin-right: 0px;
    padding-left: 2px;
    padding-right: 2px;
    padding-top: 3px !important;
    padding-bottom: 19px;
  }
  .hip-2-button{
  	position: relative;
  	font-family: 'Topaz_a1200';
  	font-size: 16px;
  	width: 100%; 
  	height: 26px;
  	background: #aaaaaa;
  	border-top: 2px solid #fff !important;
  	border-left: 2px solid #fff !important;
  	border-right: 2px solid #000 !important;
  	border-bottom: 2px solid #000 !important;
  	padding-left: 4px;
  	padding-right: 4px;
    padding-top: 3px;
    padding-bottom: 19px;
    margin-left: 0px;
    margin-right: 0px;
  }
  .hip-1-button{
  	position: relative;
  	font-family: 'Topaz_a1200';
  	font-size: 16px;
  	width: 100%; 
  	height: 26px;
  	background: #aaaaaa;
  	border-top: 2px solid #fff !important;
  	border-left: 2px solid #fff !important;
  	border-right: 2px solid #000 !important;
  	border-bottom: 2px solid #000 !important;
  	padding-left: 2px;
  	padding-right: 2px;
  	margin-left: 0px;
  	margin-right: 0px;
    padding-top: 3px !important;
    padding-bottom: 19px;
  }

  .hip-3-button:active{
  	border-top: 2px solid #000 !important;
  	border-left: 2px solid #000 !important;
  	border-right: 2px solid #fff !important;
  	border-bottom: 2px solid #fff !important;
  	background: #6688bb;
  	outline: none;
  }
  .hip-2-button:active{
  	border-top: 2px solid #000 !important;
  	border-left: 2px solid #000 !important;
  	border-right: 2px solid #fff !important;
  	border-bottom: 2px solid #fff !important;
  	background: #6688bb;
  	outline: none;
  }
  .hip-1-button:active{
  	border-top: 2px solid #000 !important;
  	border-left: 2px solid #000 !important;
  	border-right: 2px solid #fff !important;
  	border-bottom: 2px solid #fff !important;
  	background: #6688bb;
  	outline: none;
  }

  .hip-3-button:focus{
  	outline: none;
  }
  .hip-2-button:focus{
  	outline: none;
  }
  .hip-1-button:focus{
  	outline: none;
  }

  .hip-prev-song{
  	background-image: url('assets/data/hippo/prev-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  }
  .hip-startof-song{
  	background-image: url('assets/data/hippo/startof-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;

  }
  .hip-rewind-song{
  	background-image: url('assets/data/hippo/rewind-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  }
  .hip-play-song{
  	background-image: url('assets/data/hippo/play-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  }
  .hip-forward-song{
  	background-image: url('assets/data/hippo/forward-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  }
  .hip-endof-song{
  	background-image: url('assets/data/hippo/endof-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  }
  .hip-next-song{
  	background-image: url('assets/data/hippo/next-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  }
  .hip-pause-song{
  	background-image: url('assets/data/hippo/pause-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  }
  .hip-eject-song{
  	background-image: url('assets/data/hippo/eject-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  }
  .hip-info-song{
  	background-image: url('assets/data/hippo/info-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  }
  .hip-info-song:focus{
  	background-image: url('assets/data/hippo/info-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  	outline: none;
  }
  .hip-prev-song:focus{
  	background-image: url('assets/data/hippo/prev-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  	outline: none;
  }
  .hip-startof-song:focus{
  	background-image: url('assets/data/hippo/startof-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  	outline: none;
  }
  .hip-rewind-song:focus{
  	background-image: url('assets/data/hippo/rewind-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  	outline: none;
  }
  .hip-play-song:focus{
  	background-image: url('assets/data/hippo/play-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  	outline: none;
  }
  .hip-forward-song:focus{
  	background-image: url('assets/data/hippo/forward-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  	outline: none;
  }
  .hip-endof-song:focus{
  	background-image: url('assets/data/hippo/endof-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  	outline: none;
  }
  .hip-next-song:focus{
  	background-image: url('assets/data/hippo/next-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  	outline: none;
  }
  .hip-pause-song:focus{
  	background-image: url('assets/data/hippo/pause-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  	outline: none;
  }
  .hip-eject-song:focus{
  	background-image: url('assets/data/hippo/eject-song.png');
  	width: 100%; 
  	height: 26px;
  	background-repeat: no-repeat;
  	background-position:center;
  	outline: none;
  }
  input[type=range] {
  	-webkit-appearance: none !important;
  	margin: 0 !important;
  	width: 50px !important;
  }
  input[type=range]:focus {
  	outline: none !important;
  }
  input[type=range]::-webkit-slider-runnable-track {
  	width: 100% !important;
  	height: 22px !important;
  	cursor: pointer !important;
  	background-image: url('assets/data/hippo/rangebg.png');
  	border-radius: 0 !important;
  	border-top: 2px solid #000 !important;
  	border-left: 1px solid #000 !important;
  	border-right: 1px solid #fff !important;
  	border-bottom: 2px solid #fff !important;
  }
  input[type=range]::-webkit-slider-thumb {
  	border-top: 2px solid #fff !important;
  	border-left: 1px solid #fff !important;
  	border-right: 1px solid #000 !important;
  	border-bottom: 2px solid #000 !important;
  	height: 18px !important;
  	width: 11px !important;
  	border-radius: 0 !important;
  	background: #aaaaaa !important;
  	cursor: pointer !important;
  	-webkit-appearance: none !important;
  }
  input[type=range]:focus::-webkit-slider-runnable-track {
  	background-image: url('assets/data/hippo/rangebg.png');
  }
  input[type=range]::-moz-range-track {
  	width: 100% !important;
  	height: 22px !important;
  	cursor: pointer !important;
  	background-image: url('assets/data/hippo/rangebg.png') !important;
  	border-radius: 0 !important;
  	border: 0 !important;
  }
  input[type=range]::-moz-range-thumb {
  	border-top: 2px solid #fff !important;
  	border-left: 1px solid #fff !important;
  	border-right: 1px solid #000 !important;
  	border-bottom: 2px solid #000 !important;
  	height: 18px !important;
  	width: 11px !important;
  	border-radius: 0 !important;
  	background: #aaaaaa !important;
  	cursor: pointer !important;
  }
  input[type=range]::-ms-track {
  	width: 100% !important;
  	height: 22px !important;
  	cursor: pointer !important;
  	background-image: url('assets/data/hippo/rangebg.png') !important;
  	border-color: transparent !important;
  	border-width: 16px 0 !important;
  	color: transparent !important;
  }
  input[type=range]::-ms-fill-lower {
  	background: #aaaaaa !important;
  	border: 0.2px solid #000000 !important;
  	border-radius: 0 !important;
  }
  input[type=range]::-ms-fill-upper {
  	background: #3071a9 !important;
  	border: 0.2px solid #000000 !important;
  	border-radius: 0 !important;
  }
  input[type=range]::-ms-thumb {
  	border-top: 2px solid #fff !important;
  	border-left: 1px solid #fff !important;
  	border-right: 1px solid #000 !important;
  	border-bottom: 2px solid #000 !important;
  	height: 18px !important;
  	width: 11px !important;
  	border-radius: 0 !important;
  	background: #aaaaaa !important;
  }
  input[type=range]:focus::-ms-fill-lower {
  	background-image: url('assets/data/hippo/rangebg.png') !important;
  }
  input[type=range]:focus::-ms-fill-upper {
  	background-image: url('assets/data/hippo/rangebg.png') !important;
  }

  p.req {
  	margin-bottom: -1px;
  	margin-top: 3px;
  	font-size: 16px;
  	line-height: 18px;
  	color: #000;
  }
  .nomargin{
  	margin-top: 0px !important;
  	margin-bottom: 0px !important;
  }
  .center-text{
  	text-align: center;
  }
  .center-align{
  	margin: 0 auto;
  }

  input[type="search"] {
  	-webkit-appearance: none;
  	border-radius: 0px;
  }
  input[type="button"] {
  	-webkit-appearance: none;
  	border-radius: 0px;
  }

  input.req{
  	font-family: 'Topaz_a1200';
  	font-size: 16px;
  	line-height: 16px;
  	background: #ababab;
  	border-left: 2px solid #fff !important;
  	border-top: 2px solid #fff !important;
  	border-right: 2px solid #000 !important;
  	border-bottom: 2px solid #000 !important;
  	color: black !important;
  	font-smooth: never !important;
  	-webkit-font-smooth : none !important;
  	padding-top: 4px;
  	padding-bottom: 20px;
  	margin-top: 0px;
  	position: relative;
  	min-width: 60px;
  }

  input.req:active{
  	background: #6688bb;
  	border-left: 2px solid #000 !important;
  	border-top: 2px solid #000 !important;
  	border-right: 2px solid #fff !important;
  	border-bottom: 2px solid #fff !important;
  }

  input.req:focus{
  	outline: none;
  }
  .checkbox {
  	display: inline-flex;
  	cursor: pointer;
  	position: relative;
  	margin:0;
  	padding:0;
  }
  .checkbox > span {
  	color: #000;
  	user-select: none;
  	width: 178px;
  	height: 20px;
  	padding-top: 4px;
  	padding-left: 8px;
  }
  .checkbox > input {
  	height: 22px;
  	width: 22px;
  	-webkit-appearance: none;
  	-moz-appearance: none;
  	-o-appearance: none;
  	appearance: none;
  	border-top: 2px solid #fff !important;
  	border-left: 2px solid #fff !important;
  	border-bottom: 2px solid #000 !important;
  	border-right: 2px solid #000 !important;
  	outline: none;
  	cursor: pointer;
  	margin:0;
  	padding:0;
  	border-radius: 0px;
  	padding-bottom: 18px;
    margin-bottom: 2px;
  }
  .checkbox > input:checked {
  	border-top: 2px solid #fff !important;
  	border-left: 2px solid #fff !important;
  	border-bottom: 2px solid #000 !important;
  	border-right: 2px solid #000 !important;
  	background: url(assets/data/cedd/checkmark.png);
  	background-repeat: no-repeat;
  }
  .checkbox > input:checked + span::before {
  	display: block;
  	text-align: center;
  	color: #000;
  	position: absolute;
  	left: 6px;
  	top: 1px;
  }
  ::-webkit-input-placeholder { /* Edge */
  	color: #000;
  	font-smooth: never !important;
  	-webkit-font-smooth : none !important;
  }

  :-ms-input-placeholder { /* Internet Explorer 10-11 */
  	color: #000;
  	font-smooth: never !important;
  	-webkit-font-smooth : none !important;
  }

  ::placeholder {
  	color: #000;
  	font-smooth: never !important;
  	-webkit-font-smooth : none !important;
  }
}
.req-double-border {
	border-left: 2px solid #000 !important;
	border-top: 2px solid #000 !important;
	border-right: 2px solid #fff !important;
	border-bottom: 2px solid #fff !important;
	width: fit-content;
	height: 30px;
	padding-top: 2px;
	padding-left: 0px;
	position: relative;
}
.req-double-border:before {
	background: none;
	content: "";
	display: block;
	position: relative;
	top: 0px;
	left: 0px;
	right: 0px;
	bottom: 0px;
	pointer-events: none;
}
.hip-scrollbar-border {
  position: absolute;
  width: 19px;
  height: 368px;
  top: 135px;
  left: 8px;
  border-top: 2px solid #fff !important;
  border-bottom: 2px solid #fff !important;
  border-left: 1px solid #fff !important;
  border-right: 1px solid #fff !important;
  pointer-events: none;
  background: transparent;
  z-index: 100;
}
.hip-scrollbar-border-offset {
  position: absolute;
  width: 19px;
  height: 368px;
  top: 137px;
  left: 9px;
  border-top: 2px solid #000 !important;
  border-bottom: 2px solid #000 !important;
  border-left: 1px solid #000 !important;
  border-right: 1px solid #000 !important;
  pointer-events: none;
  background: transparent;
  z-index: 100;
}

.hip-scrollbar-divider {
  position: absolute;
  width: 5px;
  height: 370px;
  top: 135px;
  left: 28px;
  background-image: url(assets/data/hippo/hippobg.png);
  border-right: 2px solid #fff !important;
  z-index: 100;
}

.hip-scrollbar-tight-border:before {
	background: none;
	content: "";
	display: block;
	position: absolute;
	top: 0px;
	left: 0px;
	right: 0px;
	bottom: 0px;
	pointer-events: none;
	z-index: 99999;
}
.req-divider{
	position: relative;
	width: 100%;
	height: 0px;
	top: 0px;
	margin-bottom: 8px;
	margin-top: 8px;
	border-top: 2px solid black !important;
	border-bottom: 2px solid white !important;
}
.req-scrollbar-divider-left{
	background: url(assets/data/cedd/border_sides.png);
	width: 0px;
	height: 300px;
	position: absolute;
	border-radius: 0px;
	top: 26px;
	right: 28px;
	z-index: 99999;
	border-left: 2px solid black !important;
}
.req-scrollbar-divider-right{
	background: url(assets/data/cedd/border_sides.png);
	width: 0px;
	height: 300px;
	position: absolute;
	border-radius: 0px;
	top: 26px;
	right: 26px;
	z-index: 100;
	border-right: 2px solid white !important;
}
.req-filelist::-webkit-scrollbar {
	width: 16px !important;               /* width of the entire scrollbar */
}
.req-filelist::-webkit-scrollbar-track {
	background: #ababab; /* color of the tracking area */
}
.req-filelist::-webkit-scrollbar-thumb {
	background-color: black !important;    /* color of the scroll thumb */
	border-radius: 0px !important;       /* roundness of the scroll thumb */
	border-right: 2px solid #ababab !important;  /* creates padding around scroll thumb */
	border-left: 2px solid #ababab !important;
}
.req-filelist{
	width: 100%;
	width: -moz-available;
	width: -webkit-fill-available;
	width: fill-available;
	height: 100%;
	background: #aaaaaa;
	position: relative;
	top: 0px;
	border-top: 2px solid white !important;
	border-left: 2px solid white !important; 
	border-bottom: 2px solid black !important;
	border-right: 2px solid black !important;
	height: 300px;
	overflow-y: auto;
	margin-bottom: 4px;
}
.hip-playlist::-webkit-scrollbar {
	width: 16px !important;               /* width of the entire scrollbar */
}
.hip-playlist::-webkit-scrollbar-track {
	margin-top: 2px;
	margin-bottom: 2px;
	background-image: url('assets/data/hippo/rangebg.png');
}
.hip-playlist::-webkit-scrollbar-thumb {
	background-color: #ababab;    /* color of the scroll thumb */
	border-radius: 0px !important;       /* roundness of the scroll thumb */
	border-right: 1px solid #000 !important;  /* creates padding around scroll thumb */
	border-left: 1px solid #fff !important;
	border-top: 2px solid #fff !important;
	border-bottom: 2px solid #000 !important;
	background-clip: content-box !important;
}
.hip-playlist{
	width: 100% !important;
	height: 370px !important;
	background: #aaaaaa;
	position: relative;
	top: 0px;
	left: 0px;
	border-top: 2px solid white !important;
	border-left: 2px solid white !important;
	border-bottom: 2px solid black !important;
	border-right: 2px solid black !important;
	overflow-y: scroll;
	background-image: url("assets/data/hippo/plistbg.png");
	box-sizing: border-box !important;
	margin-top: 4px;
	background-repeat: no-repeat;
	background-position: center;
	color: #000;
}
.nobg{
	background-image: none;
}

.nooverflow{
	overflow: hidden;
}

.req-footer-spacing{
	margin-top: 8px;
}


.Flipped{ 
	direction: rtl !important; /*This cause the division content to be displayed from right to left */ 
} 
ul.ced-filelist {
  padding-left: 0px;
  margin-bottom: 0px;
  margin-top: 2px;
  margin-left: -3px;
  margin-right: 3px;
  direction: ltr;
}
ul li a.ced-filelist:hover{
	background: #6688bb;
	color: #fff !important;
}
ul li.ced-filelist :focus{
	background: #6688bb;
	color: #fff;
}
ul li a.ced-filelist {
	width: 100%;
	display: block;
	text-decoration: none;
	color: #000;
}
ul li a.ced-filelist :focus{
	color: #fff;
	width: 100%;
	display: block;
	text-decoration: none;
	background: #6688bb;
}
.hip-playlist ul{
  padding-left: 0px;
  margin-bottom: 4px;
  margin-top: 2px;
  margin-left: 0px;
  margin-right: 3px;
  direction: ltr !important;
} 

.hip-playlist li{
	list-style-type: none !important;
}

.hip-playlist ul li a:hover{
	background: #6688bb;
	color: #fff !important;
}
.hip-playlist ul li:active{
	background: #6688bb;
	color: #fff;
}
.hip-playlist ul li:focus{
	background: #6688bb;
	color: #fff;
}
.hip-playlist ul li a{
	width: 100%;
	display: block;
	text-decoration: none;
	color: #000;
}
.hip-playlist ul li a:focus{
	color: #fff;
	width: 100%;
	display: block;
	text-decoration: none;
	background: #6688bb;
}
.mobileHide { display: inline;}
/* Smartphone Portrait and Landscape */
@media only screen
and (min-device-width : 320px)
and (max-device-width : 480px)
{  
	.mobileHide { display: none;}
}
.req-border-1{
	border-left: 1px solid #000 !important;
	border-bottom: 2px solid #fff !important;
	border-right: 1px solid #fff !important;
}
.req-border-2{
	border-left: 2px solid #6688bb !important;
	border-right: 2px solid #6688bb !important;
	border-bottom: 2px solid #000 !important;
}
.req-border-3{
	border-left: 1px solid white !important;
	border-right: 1px solid black !important;
}
.fat-1{
	border-bottom: 16px solid #6688bb !important;
}
.fat-2{
	border-bottom: 2px solid #000 !important;
}

.big{
	width: 102px;
}
.nobottomborder{
	border-bottom: 0 !important;
}
.noflex{
	display: block;
}
.infowindow-offset-1{
	top: 26px;
	left: 8px;
}
.infowindow-offset-2{
	top: 27px;
	left: 9px;
}
.infowindow-offset-3{
	top: 26px;
	left: 28px;
}
</style>


<!-- LINE # DIALOGUE -->

<div class="req-container standard-dialogue-width">
	<div class="req-title">Line #</div>
	<div class="req-cycle-gadget"></div>

	<div class="req-border-3">
		<div class="req-border-2">
			<div class="req-border-1">

				<div class="req-content nobottomborder">
					<div class="req-tight-border" style="margin-top: 4px;">
						<input class="tight" type="text">
					</div>
					<p class="req" style="margin-bottom: 13px; margin-top: 13px;">-1 .. 1</p>
					<div class="req-divider"></div>
					<div class="req-button-container">
						<div class="req-double-border"><input class="req" value="OK" type="button"></div>
						<div class=button><input class="req" value="Cancel" type="button"></div>
					</div>
				</div>

			</div>
		</div>
	</div>

</div>

<!-- QUIT DIALOGUE -->

<div class="req-container standard-dialogue-width">
	<div class="req-title">CygnusEdd</div>
	<div class="req-cycle-gadget"></div>

	<div class="req-border-3">
		<div class="req-border-2">
			<div class="req-border-1">

				<div class="req-content nobottomborder">
					<p class="req">XXX changes have been made to this file.<br>They will be lost.<br>OK to quit?<br></p>
					<div class="req-divider"></div>

					<div class="req-button-container">
						<div class=button><input class="req" value="OK" type="button"></div>
						<div class=button><input class="req" value="Cancel" type="button"></div>
					</div>

				</div>
			</div>
		</div>
	</div>
</div>

<!-- FILE DIALOGUE -->
<div class="req-container file-dialogue-width"> <!-- original width: 318px -->
	<div class="req-title-padding">Open file(s)...</div>
	<div class="req-close-button"></div>
	<div class="req-size-gadget"></div>
	<div class="req-cycle-gadget"></div>


	<div class="req-border-3 fat-2">
		<div class="req-border-2 fat-1">
			<div class="req-border-1 nobottomborder">

				<div class="req-content">

					<div class="req-scrollbar-divider-left mobileHide"></div>
					<div class="req-scrollbar-divider-right mobileHide"></div>

					<div class="req-filelist">
						<ul class="ced-filelist">
							<li><a class="ced-filelist" href="#">up-textr.txt</a></li>
							<li><a class="ced-filelist" href="#">ds!-yeah.txt</a></li>
							<li><a class="ced-filelist" href="#">ds!-spot.txt</a></li>
							<li><a class="ced-filelist"  href="#">ds!-warn.txt</a></li>
							<li><a class="ced-filelist"  href="#">ds!-bull.txt</a></li>
							<li><a class="ced-filelist"  href="#">lp-whome.txt</a></li>
							<li><a class="ced-filelist"  href="#">3ad-home.txt</a></li>
							<li><a class="ced-filelist"  href="#">3ad-wank.txt</a></li>
							<li><a class="ced-filelist"  href="#">3ad-ruff.txt</a></li>
							<li><a class="ced-filelist"  href="#">3ad-kill.txt</a></li>
							<li><a class="ced-filelist"  href="#">hos-none.txt</a></li>
							<li><a class="ced-filelist"  href="#">hos-bass.txt</a></li>
							<li><a class="ced-filelist"  href="#">hos-true.txt</a></li>
							<li><a class="ced-filelist"  href="#">hos-mega.txt</a></li>
							<li><a class="ced-filelist"  href="#">hos-rule.txt</a></li>
							<li><a class="ced-filelist"  href="#">hos-back.txt</a></li>
							<li><a class="ced-filelist"  href="#">hos-lowp.txt</a></li>
							<li><a class="ced-filelist"  href="#">ts-dread.txt</a></li>
							<li><a class="ced-filelist"  href="#">s!-named.txt</a></li>
							<li><a class="ced-filelist"  href="#">ds!-yeah.txt</a></li>
							<li><a class="ced-filelist"  href="#">ds!-spot.txt</a></li>
							<li><a class="ced-filelist"  href="#">ds!-warn.txt</a></li>
							<li><a class="ced-filelist"  href="#">ds!-bull.txt</a></li>
						</ul>
					</div>

					<div class="req-button-container">
						<div class="req-label">Drawer</div> 
						<div class="req-tight-border"><input class="tight" type="text" placeholder="aSCIIaRENA:"></div>
					</div>
					<div class="req-button-container">
						<div class="req-label">File</div> 
						<div class="req-tight-border"><input class="tight" type="text" placeholder="SelectedFile.txt"></div>
					</div>

					<div class="req-button-container req-footer-spacing">
						<span><input type="button" class="req" value="OK"></span>
						<span><input type="button" class="req" value="Cancel"></span>
					</div>

				</div>

			</div>
		</div>
	</div>

</div>


<!-- FONT DIALOGUE -->

<div class="req-container font-dialogue-width"> <!-- original width: 318px -->
	<div class="req-title-padding">Select a font</div>
	<div class="req-close-button"></div>
	<div class="req-size-gadget"></div>
	<div class="req-cycle-gadget"></div>

	<div class="req-border-3 fat-2">
		<div class="req-border-2 fat-1">
			<div class="req-border-1 nobottomborder">

				<div class="req-content">

					<div class="req-filelist" style="margin-bottom: 0px">
						<ul class="ced-filelist" >
							<li><a class="ced-filelist"  href="#">MicroKnight</a></li>
							<li><a class="ced-filelist"  href="#">MicroKnight Plus</a></li>
							<li><a class="ced-filelist"  href="#">mO'sOul</a></li>
							<li><a class="ced-filelist"  href="#">P0T-NOoDLE</a></li>
							<li><a class="ced-filelist"  href="#">Topaz (Amiga 500)</a></li>
							<li><a class="ced-filelist"  href="#">Topaz (Amiga 1200)</a></li>
							<li><a class="ced-filelist"  href="#">TopazPlus (Amiga 500)</a></li>
							<li><a class="ced-filelist"  href="#">TopazPlus (Amiga 1200)</a></li>
						</ul>
					</div>
					<div class="req-button-container" style="margin-bottom: 24px";>
						<div class="req-tight-border"><input class="tight" type="text" placeholder="SelectedFont"></div>
					</div>
					<div class="req-button-container">
						<input class="tight" style="padding-top: 16px; padding-bottom: 16px;" type="text" placeholder="123 AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQ">
					</div>
					<div class="req-button-container req-footer-spacing">
						<input type="button" class="req" value="OK">
						<input type="button" class="req" value="Cancel">
					</div>

				</div>

			</div>
		</div>
	</div>

</div>

<!-- SEARCH DIALOGUE -->

<div class="req-container search-dialogue-width"> <!-- original width: 448px -->
	<div class="req-title-padding">Enter Search text</div>
	<div class="req-close-button"></div>
	<div class="req-size-gadget"></div>
	<div class="req-cycle-gadget"></div>

	<div class="req-border-3">
		<div class="req-border-2">
			<div class="req-border-1">

				<div class="req-content nobottomborder">
					<div class="req-button-container">
						<div class="req-label">Locate</div> 
						<div class="req-tight-border"><input class="tight" type="text" placeholder="Spot"></div>
					</div>
					<div class="req-button-container">
						<div class="req-label">Replace</div> 
						<div class="req-tight-border">
							<input class="tight" type="text" placeholder="Spot Rulez!"></div>
						</div>
						<div class="req-divider"></div>

						<div class="req-button-container noflex">
							<label class="checkbox">
								<input type="checkbox" checked/>
								<span>Ignore Case</span>
							</label>

							<label class="checkbox">
								<input type="checkbox" />
								<span>Wrap around</span>
							</label>

							<label class="checkbox">
								<input type="checkbox" />
								<span>Wildcards</span>
							</label>

							<label class="checkbox">
								<input type="checkbox" />
								<span>Begin at top</span>
							</label>

							<label class="checkbox">
								<input type="checkbox" checked/>
								<span>Forwards</span>
							</label>

							<label class="checkbox">
								<input type="checkbox" />
								<span>Expand escape codes</span>
							</label>

							<label class="checkbox">
								<input type="checkbox" />
								<span>Only whole words</span>
							</label>

							<label class="checkbox">
								<input type="checkbox" checked/>
								<span>Show summary</span>
							</label>
						</div>
						<div class="req-divider"></div>

						<div class="req-button-container">
							<div class="req-double-border">
								<input type="button" class="req big" value="Search">
							</div>
							<input type="button" class="req big" value="Replace">
							<input type="button" class="req big" value="Replace All">
							<input type="button" class="req big" value="Leave">
						</div>

					</div>
				</div>
			</div>

		</div>

	</div>
</div>

<!-- ABOUT DIALOGUE -->

<div class="req-container about-dialogue-width"> <!-- original width: 640px -->
	<div class="req-title">CygnusEdd</div>
	<div class="req-cycle-gadget"></div>

	<div class="req-border-3">
		<div class="req-border-2">
			<div class="req-border-1">

				<div class="req-content nobottomborder">
					<p class="req center-text">CygnusEdd Professional V4.20<br>Copyright 2016-2020 Up Rough & Divine Stylers<br>
						Written by Fred, Origo and Spot<br><br>Published by<br><br>aSCIIaRENA<br>(www.asciiarena.se)</br></p>
						<div class="req-divider"></div>
						<div class="req-button-container">
							<div class="req-double-border center-align"><input class="req" value="Continue" type="button"></div>
						</div>
					</div>
				</div>

			</div>
		</div>
	</div>

</div>

<!-- HIPPOPLAYER EMPTY -->

<div class="req-container hippo hip-dialogue-width"> <!-- original width: 264px -->
	<div class="req-title-padding">00:00</div>
	<div class="req-close-button"></div>
	<div class="req-size-gadget"></div>
	<div class="req-cycle-gadget"></div>

	<div class="req-border-3">
		<div class="req-border-2">
			<div class="req-border-1">

				<div class="req-content nobottomborder">

					<div class="hip-header">
						<p class="req nomargin">HippoPlayer v3.45 (10.1.2000)<br>Programmed by K-P Koljonen</p>
					</div>

					<div class="req-button-container">
						<button class="hip-button hip-prev-song"></button>
						<button class="hip-button hip-startof-song"></button>
						<button class="hip-button hip-rewind-song"></button>
						<button class="hip-button hip-play-song"></button>
						<button class="hip-button hip-forward-song"></button>
						<button class="hip-button hip-endof-song"></button>
						<button class="hip-button hip-next-song"></button>
						<button class="hip-button hip-pause-song"></button>
						<button class="hip-button hip-eject-song"></button>
						<button class="hip-button hip-info-song"></button>
					</div>

					<div class="req-button-container">
						<div class="range-border"><input type="range" orient="horizontal" /></div>
						<button class="hip-3-button" value="New">New</button>
						<button class="hip-3-button" value="New">Add</button>
						<button class="hip-3-button" value="New">Del</button>
						<button class="hip-3-button" value="New">Prg</button>
						<button class="hip-1-button" value="New">M</button>
						<button class="hip-1-button" value="New">S</button>
						<button class="hip-2-button" value="New">Pr</button>
					</div>

					<div class="hip-playlist flipped nooverflow">
						<ul>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
							<li></li>
						</ul>
					</div>

				</div>
			</div>
		</div>

	</div>
</div>

<!-- HIPPOPLAYER -->

<div class="req-container hippo hip-dialogue-width"> <!-- original width: 264px -->
	<div class="req-title-padding">00:00</div>
	<div class="req-close-button"></div>
	<div class="req-size-gadget"></div>
	<div class="req-cycle-gadget"></div>

	<div class="req-border-3">
		<div class="req-border-2">
			<div class="req-border-1">
				<div class="req-content nobottomborder">
					<div class="hip-header">
						<p class="req nomargin">HippoPlayer v3.45 (10.1.2000)<br>Programmed by K-P Koljonen</p>
					</div>
					<div class="req-button-container">
						<button class="hip-button hip-prev-song"></button>
						<button class="hip-button hip-startof-song"></button>
						<button class="hip-button hip-rewind-song"></button>
						<button class="hip-button hip-play-song"></button>
						<button class="hip-button hip-forward-song"></button>
						<button class="hip-button hip-endof-song"></button>
						<button class="hip-button hip-next-song"></button>
						<button class="hip-button hip-pause-song"></button>
						<button class="hip-button hip-eject-song"></button>
						<button class="hip-button hip-info-song"></button>
					</div>

					<div class="req-button-container">
						<div class="range-border"><input type="range" orient="horizontal" /></div>
						<button class="hip-3-button" value="New">New</button>
						<button class="hip-3-button" value="New">Add</button>
						<button class="hip-3-button" value="New">Del</button>
						<button class="hip-3-button" value="New">Prg</button>
						<button class="hip-1-button" value="New">M</button>
						<button class="hip-1-button" value="New">S</button>
						<button class="hip-2-button" value="New">Pr</button>
					</div>

					<div class="hip-scrollbar-border mobileHide"></div>
					<div class="hip-scrollbar-border-offset mobileHide"></div>
					<div class="hip-scrollbar-divider mobileHide"></div>

					<div class="hip-playlist nobg" dir="rtl">

						<ul>
							<li><a href="#">mod.ASS!_FUCK!_HOE!_TITS!</a></li>
							<li><a href="#">mod.bring it down</a></li>
							<li><a href="#">mod.disko divas</a></li>
							<li><a href="#">mod.flower flavor</a></li>
							<li><a href="#">mod.goes with da bong</a></li>
							<li><a href="#">mod.rough cutz</a></li>
							<li><a href="#">mod.The Dreamer</a></li>
							<li><a href="#">mod.To Be In Love REMiX</a></li>
							<li><a href="#">mod.UnderneathOurHome</a></li>
							<li><a href="#">mod.upperz delight</a></li>
							<li><a href="#">mod.welcome</a></li>
							<li><a href="#">mod.Super_Subway_1986</a></li>
							<li><a href="#">dbm.Live_Axxion</a></li>
							<li><a href="#">THX.crystal_cracktro</a></li>
							<li><a href="#">THX.Summerluvin'[+++]</a></li>
							<li><a href="#">Steal_Da_Wheelz_Riddim.xm</a></li>
							<li><a href="#">mod.Monotone Bitch</a></li>
							<li><a href="#">mod.Optimistique</a></li>
							<li><a href="#">mod.static_amiga_megamix</a></li>
							<li><a href="#">mod.Introe81.mod</a></li>
							<li><a href="#">mod.8909</a></li>
							<li><a href="#">mod.Ass Up!</a></li>
							<li><a href="#">mod.ASS!_FUCK!_HOE!_TITS!</a></li>
							<li><a href="#">mod.bring it down</a></li>
							<li><a href="#">mod.disko divas</a></li>
							<li><a href="#">mod.flower flavor</a></li>
							<li><a href="#">mod.goes with da bong</a></li>
						</ul>
					</div>

				</div>
			</div>
		</div>

	</div>
</div>

<!-- HIPPOINFO -->

<div class="req-container hippo hippoinfo-dialogue-width"> <!-- original width: 384px -->
	<div class="req-title-padding"><span>HippoInfo<span></div>
		<div class="req-close-button"></div>
		<div class="req-cycle-gadget"></div>

		<div class="req-border-3">
			<div class="req-border-2">
				<div class="req-border-1">
					<div class="req-content nobottomborder">

						<div class="hip-scrollbar-border infowindow-offset-1 mobileHide"></div>
						<div class="hip-scrollbar-border-offset infowindow-offset-2 mobileHide"></div>
						<div class="hip-scrollbar-divider infowindow-offset-3 mobileHide"></div>

						<div class="hip-playlist nobg" dir="rtl" style="margin-top: 0px;">
							<ul>
								<li>Name: Youafrica-Dia</li>
								<li>Type: Protracker</li>
								<li>Size: 197674<span>($0012AB00-$0015AF2A)</span></li>
								<li>Comment: Rene Bidstrup | Megademo 2 |</li>
								<li>------------------------------------------</li>
								<li>01 ST-26:goes with da bong<span>15730</span></li>
								<li>02 ST-21:rough cutz<span>12245</span></li>
								<li>03 ST-24:mod.The Dreamer<span>334</span></li>
								<li>04 ST-21:mod.To Be In Love REMiX<span>3344</span></li>
								<li>05 ST-26:mod.UnderneathOurHome<span>3434</span></li>
								<li>06 ST-12:mod.upperz delight<span>89898</span></li>
								<li>07 ST-26:mod.welcome<span>242</span></li>
								<li>08 ST-21:mod.Super_Subway_1986<span>234422</span></li>
								<li>09 ST-13:dbm.Live_Axxion<span>2344</span></li>
								<li>10 ST-27:THX.crystal_cracktro<span>2342</span></li>
								<li>11 ST-17:THX.Summerluvin'[+++]<span>11334</span></li>
								<li>12 ST-23:Steal_Da_Wheelz_Riddim.xm<span>243</span></li>
								<li>13 ST-23:mod.Monotone Bitch<span>74777</span></li>
								<li>14 ST-21:mod.Optimistique<span>9984</span></li>
								<li>15 ST-27:mod.static_amiga_megamix<span>244</span></li>
								<li>16 ST-10:mod.Introe81.mod<span>2323</span></li>
								<li>17 ST-27:mod.8909<span>26622</span></li>
								<li>18 ST-21:mod.Ass Up!<span>8744</span></li>
								<li>19 ST-17:mod.ASS!_FUCK!_HOE!_TITS!<span>2244</span></li>
								<li>20 ST-03:mod.bring it down<span>88842</span></li>
								<li>21 ST-27:21 mod.disko divas<span>22244</span></li>
								<li>22 <span>0</span></li>
								<li>23 <span>0</span></li>
								<li>24 <span>0</span></li>
								<li>25 <span>0</span></li>
								<li>26 <span>0</span></li>
								<li>27 <span>0</span></li>
								<li>28 <span>0</span></li>
								<li>29 <span>0</span></li>
								<li>30 <span>0</span></li>
								<li>31 <span>0</span></li>
							</ul>
						</div>
					</div>

				</div>
			</div>
		</div>

	</div>
</div>



<?php include "footer.php";


