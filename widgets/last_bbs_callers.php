<?php defined('VALID') or die('Nuh-uh!');
$callers_id = random_int(0, 65536);
$callers = "callers_{$callers_id}";
$nick = "";
if (is_logged_in()) $nick=$_user[ "nick" ];
?>
<div class="header col-12 col-lg-12">
	<h2 class="apt-1 apb-1 bg-header"><a href="https://scenewall.bbs.io?callers">MOST RECENT BBS CALLERS</a></h2>
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

          $(id).html('<div class="col-lg-12 d-flex apb-1"><span class="col-lg-2 white text-truncate" style="white-space: pre">Username</span><span class="col-lg-2 white text-truncate" style="white-space: pre">BBS</span><span class="col-lg-2 white text-truncate" style="white-space: pre">Date</span><span class="col-lg-1 white text-truncate" style="white-space: pre">Time On</span><span class="col-lg-1 white text-truncate" style="white-space: pre">Time Off</span><span class="col-lg-2 white text-truncate" style="white-space: pre">Actions</span><span class="col-lg-1 white text-truncate" style="white-space: pre">Upload</span><span class="col-lg-1 white text-truncate" style="white-space: pre">Dnload</span></div>')
					
          data.calls.forEach(  function(callersItem) {
            
						username = unclean(callersItem.Username)
						bbsname = unclean(callersItem.Bbsname)
						dateon = callersItem.Dateon
						timeon = callersItem.Timeon
						timeoff = callersItem.Timeoff
						actions = callersItem.Actions

            var upkb = callersItem.Upload
              
              if ((upkb<0) || (upkb>9999)) {
              upkb =( upkb >> 10) & 0x003fffff
              if (upkb>999) {
                var i = upkb >> 10
                var f = ((upkb & 1023) * 10) >> 10
                if (i>9) {
                  var ul = ('     ' + i +'G')
                } else {
                  var ul = ('     ' + i + '.'+f+'G')
                }
              } else {
                        var ul = ('     ' + upkb+'M')
              }
            } else {
                     var ul = ('     ' + callersItem.Upload+"K")
            }
                

            var dnkb = callersItem.Download
              
             if ((dnkb<0) || (dnkb>9999)) {
              dnkb =( dnkb >> 10) & 0x003fffff
              if (dnkb>999) {
               var i = dnkb >> 10
               var f = ((dnkb & 1023) * 10) >> 10
               if (i>9) {
                 var dl = ('     ' + i + 'G')
               } else {
                 var dl = ('     ' + i + '.'+f+'G')
               }
              } else {
                      var dl = ('     ' + dnkb+'M')
              }
            } else {
                     var dl = ('     ' + callersItem.Download+"K")
            }


            if (dl.length>9) { dl = '     LOTS' }
            if (ul.length>9) { ul = '     LOTS' }
            dl = dl.slice(dl.length - 5)
            ul = ul.slice(ul.length - 5)

						
            output = '<div class="col-lg-12 d-flex"><span class="col-lg-2 cyan text-truncate" style="white-space: pre">'+username+'</span><span class="col-lg-2 green text-truncate" style="white-space: pre">'+bbsname+'</span><span class="col-lg-2 white text-truncate" style="white-space: pre">'+dateon+'</span><span class="col-lg-1 cyan text-truncate" style="white-space: pre">'+timeon+'</span><span class="col-lg-1 cyan text-truncate" style="white-space: pre">'+timeoff+'</span><span class="col-lg-2 white text-truncate" style="white-space: pre">'+actions+'</span><span class="col-lg-1 white text-truncate" style="white-space: pre">'+ul+'</span><span class="col-lg-1 white text-truncate" style="white-space: pre">'+dl+'</span></div>'
			
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
