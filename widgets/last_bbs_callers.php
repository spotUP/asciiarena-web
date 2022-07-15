<?php defined('VALID') or die('Nuh-uh!');
$callers_id = random_int(0, 65536);
$callers = "callers_{$callers_id}";
$nick = "";
if (is_logged_in()) $nick=$_user[ "nick" ];
?>
<div class="header col-12 col-lg-12">
	<h2 class="apt-1 apb-1 bg-header">MOST RECENT BBS CALLERS</h2>
</div>
<div class="container-fluid p-0 p-lg-2">
	<div class="row m-0 p-0 bg-secondary apb-1" id="<?=$callers?>"></div>
</div>
<script>
      function unclean(value) {
            value = value.replace(/&#91;/g,'[');
            value = value.replace(/&#93;/g,']');
            value = value.replace(/&#123;/g,'{');
            value = value.replace(/&#125;/g,'}');
            value = value.replace(/&#44;/g,',');
            value = value.replace(/&#58;/g,':');
            value = value.replace(/&#34;/g,'\"');
            value = value.replace(/&#92;/g,'\\');
            value = value.replace(/</g,'&gt;');
            value = value.replace(/>/g,'&lt;');
         return value
      }

      function callersitemsRead(id,data) {

          $(id).html('<div class="col-lg-12 d-flex apb-1"><span class="col-lg-3 white text-truncate" style="white-space: pre">Username</span><span class="col-lg-3 white text-truncate" style="white-space: pre">BBS</span><span class="col-lg-2 white text-truncate" style="white-space: pre">Date</span><span class="col-lg-1 white text-truncate" style="white-space: pre">Time On</span><span class="col-lg-1 white text-truncate" style="white-space: pre">Time Off</span><span class="col-lg-2 white text-truncate" style="white-space: pre">Actions</span></div>')
					
          data.calls.forEach(  function(callersItem) {
            
						username = unclean(callersItem.Username)
						bbsname = unclean(callersItem.Bbsname)
						dateon = callersItem.Dateon
						timeon = callersItem.Timeon
						timeoff = callersItem.Timeoff
						actions = callersItem.Actions
						
            output = '<div class="col-lg-12 d-flex"><span class="col-lg-3 cyan text-truncate" style="white-space: pre">'+username+'</span><span class="col-lg-3 green text-truncate" style="white-space: pre">'+bbsname+'</span><span class="col-lg-2 white text-truncate" style="white-space: pre">'+dateon+'</span><span class="col-lg-1 cyan text-truncate" style="white-space: pre">'+timeon+'</span><span class="col-lg-1 cyan text-truncate" style="white-space: pre">'+timeoff+'</span><span class="col-lg-2 white text-truncate" style="white-space: pre">'+actions+'</span></div>'
			
            //output = '<font color="#0000ff">¦</font>'+comment+colour+'-'+username+'<font color="#0000ff">¦</font><font color="#ffffff">'+clean2(shortCode)+'<font color="#0000ff">¦</font>\n';
            $(id).append(output)
          })
        }

	function fetch_callers_<?=$callers?>() {
		$.ajax({
			url: "https://scenewall.bbs.io:1543/GlobalLastCallers/api/GlobalLastCallers?count=15"
		}).done(function (data) {
			callersitemsRead('#<?=$callers?>',data)
		});
	}

	$(function () {
		fetch_callers_<?=$callers?>();
		setInterval(fetch_callers_<?=$callers?>, 10000);
	});
</script>
