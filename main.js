// ------------------------------
// 时间处理函数 (MM:SS 格式)
// ------------------------------
function parseTimeToSeconds(timeStr) {
    var parts = timeStr.split(':');
    var minutes = parseInt(parts[0], 10);
    var seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  
  function formatSeconds(totalSeconds) {
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return minutes.toString().padStart(2, '0') + ":" + seconds.toString().padStart(2, '0');
  }
  
  function addSeconds(timeStr, secondsToAdd) {
    var totalSeconds = parseTimeToSeconds(timeStr) + secondsToAdd;
    return formatSeconds(totalSeconds);
  }
  
  // ------------------------------
  // DOM 元素引用
  // ------------------------------
  var tbody = document.querySelector("#recipeTable tbody");
  var addRowBtn = document.getElementById("addRowBtn");
  var saveBtn = document.getElementById("saveBtn");
  var loadBtn = document.getElementById("loadBtn");
  var previewBtn = document.getElementById("previewBtn");
  var popupMenu = document.getElementById("popupMenu");
  var recipeListModal = document.getElementById("recipeListModal");
  
  var currentRow = null; // 用于记录当前操作的行
  
  // ------------------------------
  // 验证与更新函数
  // ------------------------------
  function validateRow(row) {
    var startInput = row.cells[0].querySelector('input');
    var endInput = row.cells[1].querySelector('input');
    var startSec = parseTimeToSeconds(startInput.value);
    var endSec = parseTimeToSeconds(endInput.value);
    if (endSec <= startSec) {
      endInput.classList.add('error');
    } else {
      endInput.classList.remove('error');
    }
  }
  
  function validateWaterRows() {
    var rows = tbody.querySelectorAll('tr');
    for (var i = 1; i < rows.length; i++) {
      var prevWater = parseFloat(rows[i - 1].cells[2].querySelector('input').value);
      var currWater = parseFloat(rows[i].cells[2].querySelector('input').value);
      var waterInput = rows[i].cells[2].querySelector('input');
      if (currWater < prevWater) {
        waterInput.classList.add('error');
      } else {
        waterInput.classList.remove('error');
      }
    }
  }
  
  function updateStartTimes() {
    var rows = tbody.querySelectorAll('tr');
    rows.forEach(function(row, index) {
      var startInput = row.cells[0].querySelector('input');
      if (index === 0) {
        startInput.value = "00:00";
      } else {
        var prevRow = rows[index - 1];
        var prevEnd = prevRow.cells[1].querySelector('input').value;
        startInput.value = prevEnd;
      }
      validateRow(row);
    });
    validateWaterRows();
  }
  
  // ------------------------------
  // 创建新行函数
  // ------------------------------
  function createRow(defaultEndTime) {
    var newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td><input type="time" value="" readonly></td>
      <td><input type="time" value="${defaultEndTime}"></td>
      <td><input type="number" value="50"></td>
      <td>
        <button class="actionBtn" title="Actions">⋮</button>
      </td>
    `;
    // 为 Actions 按钮绑定事件，显示弹出菜单
    var actionBtn = newRow.querySelector('.actionBtn');
    actionBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      currentRow = newRow;
      var rect = actionBtn.getBoundingClientRect();
      popupMenu.style.top = (rect.bottom + window.scrollY) + "px";
      popupMenu.style.left = (rect.left + window.scrollX) + "px";
      popupMenu.style.display = "block";
    });
    // 为 End Time 与 Final Water 输入框绑定更新事件
    var endInput = newRow.cells[1].querySelector('input');
    endInput.addEventListener('input', updateStartTimes);
    endInput.addEventListener('change', updateStartTimes);
    var waterInput = newRow.cells[2].querySelector('input');
    waterInput.addEventListener('input', updateStartTimes);
    waterInput.addEventListener('change', updateStartTimes);
    return newRow;
  }
  
  // ------------------------------
  // 弹出菜单事件
  // ------------------------------
  popupMenu.querySelectorAll('li').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      var action = this.getAttribute('data-action');
      if (action === "add") {
        var currEnd = currentRow.cells[1].querySelector('input').value;
        var newEndTime = addSeconds(currEnd, 10);
        var newRow = createRow(newEndTime);
        currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);
      } else if (action === "delete") {
        currentRow.remove();
      } else if (action === "moveUp") {
        var prevRow = currentRow.previousElementSibling;
        if (prevRow) {
          tbody.insertBefore(currentRow, prevRow);
        }
      } else if (action === "moveDown") {
        var nextRow = currentRow.nextElementSibling;
        if (nextRow) {
          tbody.insertBefore(nextRow, currentRow);
        }
      }
      popupMenu.style.display = "none";
      updateStartTimes();
    });
  });
  
  tbody.addEventListener('click', function(e) {
    // 检查是否点击了 .actionBtn
    if (e.target.classList.contains('actionBtn')) {
      e.stopPropagation();
      currentRow = e.target.closest('tr');
      var rect = e.target.getBoundingClientRect();
      popupMenu.style.top = (rect.bottom + window.scrollY) + "px";
      popupMenu.style.left = (rect.left + window.scrollX) + "px";
      popupMenu.style.display = "block";
    }
  });  

  // 点击页面其他区域时隐藏弹出菜单
  document.addEventListener('click', function() {
    popupMenu.style.display = "none";
  });


  
  // ------------------------------
  // 底部 Add Row 按钮事件
  // ------------------------------
  addRowBtn.addEventListener('click', function() {
    var rows = tbody.querySelectorAll('tr');
    var lastRow = rows[rows.length - 1];
    var lastEnd = lastRow.cells[1].querySelector('input').value;
    var newEndTime = addSeconds(lastEnd, 10);
    var newRow = createRow(newEndTime);
    tbody.appendChild(newRow);
    updateStartTimes();
  });
  
  // ------------------------------
  // 多 Recipe 保存/加载功能
  // ------------------------------
  saveBtn.addEventListener('click', function() {
    var title = document.getElementById("recipeTitle").value.trim();
    if (!title) {
      title = new Date().getTime().toString();
    }
    var remarks = document.getElementById("recipeRemarks").value;
    var rowsData = [];
    tbody.querySelectorAll('tr').forEach(function(row) {
      var endTime = row.cells[1].querySelector('input').value;
      var water = row.cells[2].querySelector('input').value;
      rowsData.push({ endTime: endTime, water: water });
    });
    var recipe = { title: title, remarks: remarks, rows: rowsData };
    var savedRecipes = localStorage.getItem("coffeeTimerRecipes");
    var recipesObj = savedRecipes ? JSON.parse(savedRecipes) : {};
    recipesObj[title] = recipe;
    localStorage.setItem("coffeeTimerRecipes", JSON.stringify(recipesObj));
    alert("Recipe saved under name: " + title);
  });
  
  loadBtn.addEventListener('click', function() {
    showRecipeList();
  });
  
  previewBtn.addEventListener('click', function() {
    alert("Drip preview started!");
  });
  
  // ------------------------------
  // 显示 Recipe 列表 Modal
  // ------------------------------
  function showRecipeList() {
    var recipesStr = localStorage.getItem("coffeeTimerRecipes");
    if (!recipesStr) {
      alert("No recipes saved!");
      return;
    }
    var recipes = JSON.parse(recipesStr);
    var modalContent = recipeListModal.querySelector('.modal-content');
    modalContent.innerHTML = "";
    
    var titleElem = document.createElement('h3');
    titleElem.innerText = "Select a Recipe to Load";
    modalContent.appendChild(titleElem);
    
    // 遍历所有 recipe，创建一个容器包含加载按钮和删除按钮
    Object.keys(recipes).forEach(function(recipeName) {
      var container = document.createElement("div");
      container.style.display = "flex";
      container.style.alignItems = "center";
      container.style.justifyContent = "space-between";
      container.style.margin = "5px 0";
      
      // 加载按钮
      var loadBtn = document.createElement("button");
      loadBtn.innerText = recipeName;
      loadBtn.style.flexGrow = "1";
      loadBtn.style.textAlign = "left";
      loadBtn.addEventListener("click", function() {
        loadRecipe(recipes[recipeName]);
        recipeListModal.style.display = "none";
      });
      
      // 删除按钮
      var deleteBtn = document.createElement("button");
      deleteBtn.innerText = "－";  // 使用减号
      deleteBtn.style.marginLeft = "10px";
      deleteBtn.style.width = "40px";
      deleteBtn.style.flexShrink = "0";
      deleteBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        // 删除该 recipe，并更新 localStorage
        delete recipes[recipeName];
        localStorage.setItem("coffeeTimerRecipes", JSON.stringify(recipes));
        // 刷新列表
        showRecipeList();
      });
      
      container.appendChild(loadBtn);
      container.appendChild(deleteBtn);
      modalContent.appendChild(container);
    });
    
    var cancelBtn = document.createElement("button");
    cancelBtn.innerText = "Cancel";
    cancelBtn.addEventListener("click", function() {
      recipeListModal.style.display = "none";
    });
    modalContent.appendChild(cancelBtn);
    recipeListModal.style.display = "flex";
  }
  
  
  function loadRecipe(recipe) {
    document.getElementById("recipeTitle").value = recipe.title;
    document.getElementById("recipeRemarks").value = recipe.remarks;
    tbody.innerHTML = "";
    recipe.rows.forEach(function(rowData, index) {
      var newRow = document.createElement('tr');
      var startVal = index === 0 ? "00:00" : "";
      newRow.innerHTML = `
        <td><input type="time" step="1" value="${startVal}" readonly></td>
        <td><input type="time" step="1" value="${rowData.endTime}"></td>
        <td><input type="number" value="${rowData.water}"></td>
        <td>
          <button class="actionBtn" title="Actions">⋮</button>
        </td>
      `;
      var actionBtn = newRow.querySelector('.actionBtn');
      actionBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        currentRow = newRow;
        var rect = actionBtn.getBoundingClientRect();
        popupMenu.style.top = (rect.bottom + window.scrollY) + "px";
        popupMenu.style.left = (rect.left + window.scrollX) + "px";
        popupMenu.style.display = "block";
      });
      var endInput = newRow.cells[1].querySelector('input');
      endInput.addEventListener('input', updateStartTimes);
      endInput.addEventListener('change', updateStartTimes);
      var waterInput = newRow.cells[2].querySelector('input');
      waterInput.addEventListener('input', updateStartTimes);
      waterInput.addEventListener('change', updateStartTimes);
      tbody.appendChild(newRow);
    });
    updateStartTimes();
  }
  
  // ------------------------------
  // 初始化
  updateStartTimes();
  