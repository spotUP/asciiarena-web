<?php defined('VALID') or die('Nuh-uh!');
$wall_id = random_int(0, 65536);
$wall = "wall_{$wall_id}";
$form = "form_{$wall_id}";
$tag = "tag_{$wall_id}";
$nick = "";
if (is_logged_in()) $nick=$_user[ "nick" ];
?>
<div class="header col-12 col-lg-12">
	<h2 class="apt-1 apb-1 bg-header"><a href="https://scenewall.bbs.io?wall">TAG THE GLOBAL BBS WALL</a></h2>
</div>
<div class="container-fluid m-0">
	<div class="row m-0 p-0 bg-secondary apt-1 apb-1" id="<?=$wall?>"></div>
	<?php if (is_logged_in()): ?>
		<div class="row">
			<style>
				.tagtext {
					color: white !important;
				}

				.tagtext:active::placeholder,
				.tagtext:focus::placeholder {
					color: transparent;
				}
			</style>
			<form id="<?=$form?>" method="post" class="w-100">
				<div class="row col-12 col-lg-12 m-0">
					<div class="col-10 col-lg-11">
						<input class="form-control tagtext w-100" type="text" name="tagtext" placeholder="Tag the wall" id="<?=$tag?>" required autocomplete="off">
					</div>
					<div class="col-2 col-lg-1">
						<button class="button w-100 btn-primary black bg-lightgrey" type="submit">Tag</button>
					</div>
				</div>
			</form>
			<script>
				$(function () {
					$("#<?=$form?>").submit(function (e) {
						e.preventDefault();
						var comment = $("#<?=$tag?>").val()

            colour=Math.floor((Math.random() * 7) + 1);

            switch (colour) {
              case 1:
                comment = "\33[31m"+comment
                break
              case 2:
                comment = "\33[32m"+comment
                break
              case 3:
                comment = "\33[33m"+comment
                break
              case 4:
                comment = "\33[34m"+comment
                break
              case 5:
                comment = "\33[35m"+comment
                break
              case 6:
                comment = "\33[36m"+comment
                break
              case 7:
                comment = "\33[37m"+comment
                break
            }

            comment = clean(comment)
            userName = clean("<?=$nick?>")

            data = {"userName": userName,
                "source": 'aSCIIaRENA',
                "comment": comment,
                "bbsshortcode": 'ASC'}

						
            $.ajax({
							"type": "POST",
							"url": "https://scenewall.bbs.io:1543/GlobalWall/api/WallItems/",
							"data": data,
							"success": function (data) {
                $("#<?=$tag?>").val('')
								fetch_wall_<?=$wall?>();
							}
						});
					});
				});
			</script>
		</div>
	<?php endif; ?>
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
            value = value.replace(/</g,'');
            value = value.replace(/>/g,'');
         return value
      }

      function clean2(value) {
            value = value.replace(/>/g,'&gt;');
            value = value.replace(/</g,'&lt;');
         return value
      }

      function clean(value) {
            var regex = new RegExp('\\[', 'g');
            value = value.replace(regex,'&#91;');
            value = value.replace(/]/g,'&#93;');
            value = value.replace(/{/g,'&#123;');
            value = value.replace(/}/g,'&#125;');
            value = value.replace(/,/g,'&#44;');
            value = value.replace(/:/g,'&#58;');
            value = value.replace(/\"/g,'&#34;');
            value = value.replace(/\\/g,'&#92;');
         return value
      }

      function wallitemsRead(id,data) {

          $(id).html('')
          data.forEach(  function(wallItem) {
            var comment = unclean(wallItem.comment)


            var colour = '<font color="#ffffff">';

            if ((comment.indexOf('\33[0m')>=0) || (comment.indexOf('\33[0;0m')>=0)) colour = '<font style="opacity:.7" color="#ffffff">';
            if ((comment.indexOf('\33[31m')>=0) || (comment.indexOf('\33[0;31m')>=0)) colour = '<font color="#ff5555">';
            if ((comment.indexOf('\33[32m')>=0) || (comment.indexOf('\33[0;32m')>=0)) colour = '<font color="#55ff55">';
            if ((comment.indexOf('\33[33m')>=0) || (comment.indexOf('\33[0;33m')>=0)) colour = '<font color="#ffff55">';
            if ((comment.indexOf('\33[34m')>=0) || (comment.indexOf('\33[0;34m')>=0)) colour = '<font color="#0000aa">';
            if ((comment.indexOf('\33[35m')>=0) || (comment.indexOf('\33[0;35m')>=0)) colour = '<font color="#ff55ff">';
            if ((comment.indexOf('\33[36m')>=0) || (comment.indexOf('\33[0;36m')>=0)) colour = '<font color="#00bbbb">';
            if ((comment.indexOf('\33[37m')>=0) || (comment.indexOf('\33[0;37m')>=0)) colour = '<font style="opacity:.7" color="#ffffff">';            
           
            var regex = new RegExp('\33', 'g');
            comment = comment.replace(regex,'');

            regex = new RegExp('\\[0?;?0m', 'g');
            comment = comment.replace(regex,'');
            regex = new RegExp('\\[0?;?31m', 'g');
            comment = comment.replace(regex,'');
            regex = new RegExp('\\[0?;?32m', 'g');

            comment = comment.replace(regex,'');
            regex = new RegExp('\\[0?;?33m', 'g');
            comment = comment.replace(regex,'');
            regex = new RegExp('\\[0?;?34m', 'g');
            comment = comment.replace(regex,'');
            regex = new RegExp('\\[0?;?35m', 'g');
            comment = comment.replace(regex, '');
            regex = new RegExp('\\[0?;?36m', 'g');
            comment = comment.replace(regex, '');
            regex = new RegExp('\\[0?;?37m', 'g');
            comment = comment.replace(regex, '');
            comment = comment.substring(0, 60)
            while (comment.length<60) {
                comment = comment + " "
            }

            comment = clean2(comment)

            var username = wallItem.userName

            username = unclean(username)

            username = username.substring(0,12)

            while (username.length<12) {
              username = username + " "
            }

            username = clean2(username)
      
            comment = colour + comment + '</font>';
			
            var shortCode = wallItem.bbsshortcode.substring(0,3)
            while (shortCode.length<3) {
              shortCode = shortCode + " "
            }         
			
      
            output = '<div class="col-lg-12 d-flex justify-content-between"><span class="cyan text-truncate" style="white-space: pre">'+comment+'</span><span class="lightpink">'+username+'</span></div>'
        
      
            //output = '<font color="#0000ff">¦</font>'+comment+colour+'-'+username+'<font color="#0000ff">¦</font><font color="#ffffff">'+clean2(shortCode)+'<font color="#0000ff">¦</font>\n';
            $(id).append(output)
          })
        }

	function fetch_wall_<?=$wall?>() {
		$.ajax({
			url: "https://scenewall.bbs.io:1543/GlobalWall/api/WallItems?itemcount=15"
		}).done(function (data) {
			wallitemsRead('#<?=$wall?>',data)
		});
	}

	$(function () {
		fetch_wall_<?=$wall?>();
		setInterval(fetch_wall_<?=$wall?>, 10000);
	});
</script>
