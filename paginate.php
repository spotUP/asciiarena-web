    <div class="row d-block d-md-none">
      <div class="row col-12 m-0 p-0 apt-1 apl-1 d-flex">
        <input type="hidden" id="sort1"><input type="hidden" id="viewmode" value="1">
        <input type="hidden" id="pageno"><input type="hidden" id="sort1">
        <input type="hidden" id="sort2"><input type="hidden" id="maxpage">
        <ul class="pagination w-100">
          <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="firstPage(event)" href="#" class="page-link" ><<</button></li>
          <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="prevPage(event)" href="#" class="page-link" ><</button></li><span id="currpage"></span>

            <button id="currpage" class="btn paginator w-100"></button>

          <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="nextPage(event)" href="#" class="page-link" >></button></li>
          <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="lastPage(event)" href="#" class="page-link" >>></button></li>
        </ul>
      </div>
      <div class="row col-12 m-0 apt-0 d-flex">
        <div class="apt-1 bg-secondary apb-1 w-100">
          <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
            <div class="btn-group" role="group">
              <button id="btnGroupDrop1" type="button" class="btn btn-primary dropdown-toggle w-100" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">View Mode:</button>
              <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
                <a class="dropdown-item" onclick="setView(1)">Standard</a>
                <a class="dropdown-item" onclick="setView(2)">BBS</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row col-12 m-0 apt-0 d-flex">
        <div class="bg-secondary apb-1 w-100">
          <span><input id="filter" oninput="search(this.value)" class="apl-1 w-100" placeholder="Search..." type="text" autocomplete="off"></span>
        </div>
      </div>
    </div>

    <div class="row d-none d-md-block">
      <div class="col-12 d-flex">
        <div class="row m-0 apt-1">
          <input type="hidden" id="sort1">
          <input type="hidden" id="viewmode" value="1">
          <input type="hidden" id="pageno">
          <input type="hidden" id="sort1">
          <input type="hidden" id="sort2">
          <input type="hidden" id="maxpage">
          <ul class="pagination">
            <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="firstPage(event)" href="#" class="page-link" ><<</button></li>
            <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="prevPage(event)" href="#" class="page-link" ><</button></li>
            <button id="currpage" class="btn paginator" style="width:90px;"></button>
            <li class="page-item"> <button class="btn btn-primary" style="height: 48px; width:50px;" onclick="nextPage(event)" href="#" class="page-link" >></button></li>
            <li class="page-item"> <button class="btn btn-primary" style="width:50px;" onclick="lastPage(event)" href="#" class="page-link" >>></button></li>
          </ul>
        </div>
          <div class="apt-1 bg-secondary apb-1">
            <div class="btn-group" role="group" aria-label="Button group with nested dropdown">
              <div class="btn-group" role="group">
                <button id="btnGroupDrop1" type="button" class="btn btn-primary dropdown-toggle w-100" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">View Mode:</button>
                <div class="dropdown-menu" aria-labelledby="btnGroupDrop1">
                  <a class="dropdown-item" onclick="setView(1)">Standard</a>
                  <a class="dropdown-item" onclick="setView(2)">BBS</a>
                </div>
              </div>
            </div>
          </div>
          <div class="apt-1 apl-1 bg-secondary apb-1 w-100">
            <span><input id="filter" oninput="search(this.value)" class="apl-1 w-100" placeholder="Search..." type="text" autocomplete="off"></span>
          </div>
        </div>
      </div>
