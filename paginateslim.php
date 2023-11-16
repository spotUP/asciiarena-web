<div class="row">
  <div class="row col-12 m-0 p-0 apt-1 apl-1">
    <input type="hidden" id="sort1"><input type="hidden" id="viewmode" value="1">
    <input type="hidden" id="pageno"><input type="hidden" id="sort1">
    <input type="hidden" id="sort2"><input type="hidden" id="maxpage">
    <ul class="pagination w-100">
      <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="firstPage(event)" href="#" class="page-link" ><<</button></li>
      <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="prevPage(event)" href="#" class="page-link" ><</button></li>

      <span id="currpage" class="paginator apt-1"></span>

      <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="nextPage(event)" href="#" class="page-link" >></button></li>
      <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="lastPage(event)" href="#" class="page-link" >>></button></li>
    </ul>
  </div>
  <div class="col-6 m-0 apt-1 apb-1 d-flex">
    <div class="bg-secondary apb-1 w-100">
      <span><input id="filter" oninput="search(this.value)" class="apl-1 w-100" placeholder="Search..." type="text" autocomplete="off"></span>
    </div>
  </div>
</div>

