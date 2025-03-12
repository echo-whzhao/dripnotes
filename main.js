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

// 计算总水量
function calculateTotalWater() {
  var rows = tbody.querySelectorAll('tr');
  var lastRow = rows[rows.length - 1];
  return lastRow ? parseFloat(lastRow.cells[2].querySelector('input').value) : 0;
}

// 创建提示消息
function showToast(message, type = 'info') {
  // 移除已有的toast
  var existingToast = document.querySelector('.toast-message');
  if (existingToast) {
    existingToast.remove();
  }
  
  // 创建新toast
  var toast = document.createElement('div');
  toast.className = 'toast-message ' + type;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // 显示动画
  setTimeout(() => toast.classList.add('show'), 10);
  
  // 自动消失
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ------------------------------
// DOM 元素引用
// ------------------------------
var tbody = document.querySelector("#recipeTable tbody");
var addRowBtn = document.getElementById("addRowBtn");
var screenshotBtn = document.getElementById("screenshotBtn");
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
  if (rows.length > 0) {
      rows[0].cells[2].querySelector('input').classList.remove('error');
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
    <td><input type="time" value="" readonly class="time-input start-time"></td>
    <td><input type="time" value="${defaultEndTime}" class="time-input end-time"></td>
    <td><input type="number" value="50" class="number-input water-amount"></td>
    <td>
      <button class="actionBtn" title="Actions">
        <i class="fas fa-ellipsis-vertical"></i>
      </button>
    </td>
  `;
  // 为 Actions 按钮绑定事件，显示弹出菜单
  var actionBtn = newRow.querySelector('.actionBtn');
  actionBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    currentRow = newRow;
    var rect = actionBtn.getBoundingClientRect();
    popupMenu.style.top = (rect.bottom + window.scrollY) + "px";
    popupMenu.style.left = (rect.left + window.scrollX - 105) + "px"; // 调整位置使其不超出边界
    popupMenu.style.display = "block";
    
    // 添加淡入效果
    popupMenu.style.opacity = "0";
    setTimeout(() => {
      popupMenu.style.opacity = "1";
    }, 10);
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
      var newEndTime = addSeconds(currEnd, 30); // 增加默认时间间隔为30秒
      var newRow = createRow(newEndTime);
      currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);
      showToast('New step added', 'success');
    } else if (action === "delete") {
      if (tbody.querySelectorAll('tr').length > 1){
          currentRow.remove();
          showToast('Step deleted', 'success');
      } else {
          showToast('Cannot delete the final row', 'error');
      }
    } else if (action === "moveUp") {
      var prevRow = currentRow.previousElementSibling;
      if (prevRow) {
        tbody.insertBefore(currentRow, prevRow);
        showToast('Moved up', 'info');
      }
    } else if (action === "moveDown") {
      var nextRow = currentRow.nextElementSibling;
      if (nextRow) {
        tbody.insertBefore(nextRow, currentRow);
        showToast('Moved down', 'info');
      }
    }
    popupMenu.style.display = "none";
    updateStartTimes();
  });
});

tbody.addEventListener('click', function(e) {
  // 检查是否点击了 .actionBtn 或其内部的图标
  if (e.target.classList.contains('actionBtn') || e.target.closest('.actionBtn')) {
    e.stopPropagation();
    var actionBtn = e.target.classList.contains('actionBtn') ? e.target : e.target.closest('.actionBtn');
    currentRow = actionBtn.closest('tr');
    var rect = actionBtn.getBoundingClientRect();
    popupMenu.style.top = (rect.bottom + window.scrollY) + "px";
    popupMenu.style.left = (rect.left + window.scrollX - 105) + "px"; // 调整位置
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
  var newEndTime = addSeconds(lastEnd, 30); // 增加默认时间间隔为30秒
  var newRow = createRow(newEndTime);
  tbody.appendChild(newRow);
  updateStartTimes();
  
  // 平滑滚动到底部
  newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
});


// ------------------------------
// 多 Recipe 保存/加载功能
// ------------------------------
saveBtn.addEventListener('click', function() {
  var title = document.getElementById("recipeTitle").value.trim();
  if (!title) {
    title = "Recipe " + new Date().toLocaleDateString();
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
  showToast('Recipe saved: ' + title, 'success');
});

loadBtn.addEventListener('click', function() {
  showRecipeList();
});

previewBtn.addEventListener('click', function() {
  // 未来实现功能
  showToast('Drip preview coming soon!', 'info');
});


// ------------------------------
// 截图功能
// ------------------------------
screenshotBtn.addEventListener('click', function() {
  screenshotBtn.classList.add('processing');
  showToast('Creating image...', 'info');
  
  // 临时修改 Add Step 按钮
  var addRowBtn = document.getElementById("addRowBtn");
  var originalContent = addRowBtn.innerHTML;
  addRowBtn.innerHTML = `
    <div style="text-align: center; color: var(--text-light);">
      <div style="font-size: 20px; font-family: 'Pacifico', cursive; font-weight: 500; margin-bottom: 4px;">Drip Notes</div>
      <div style="font-size: 12px; opacity: 0.7;">https://echo-whzhao.github.io/CoffeeTimer</div>
    </div>
  `;
  addRowBtn.style.height = "auto";
  addRowBtn.style.padding = "12px";
  addRowBtn.style.background = "none";
  addRowBtn.style.border = "none";
  addRowBtn.style.cursor = "default";
  
  // 获取内容面板
  var contentPanel = document.querySelector(".content-panel");
  
  // 恢复按钮状态的函数
  function restoreButtonState() {
    addRowBtn.innerHTML = originalContent;
    addRowBtn.style.height = "";
    addRowBtn.style.padding = "";
    addRowBtn.style.background = "";
    addRowBtn.style.border = "";
    addRowBtn.style.cursor = "";
  }
  
  html2canvas(contentPanel, {
    scale: 2, // 提高截图质量
    backgroundColor: "#ffffff", // 白色背景
    logging: false,
    useCORS: true
  }).then(function(originalCanvas) {
    // 创建一个新的 canvas
    var newCanvas = document.createElement("canvas");
    var ctx = newCanvas.getContext("2d");

    newCanvas.width = originalCanvas.width;
    newCanvas.height = originalCanvas.height;

    // 先绘制 html2canvas 生成的截图
    ctx.drawImage(originalCanvas, 0, 0);

    // 提取recipe信息
    var title = document.getElementById("recipeTitle").value.trim();
    if (!title) {
      title = "Coffee Recipe " + new Date().toLocaleDateString();
    }
    var remarks = document.getElementById("recipeRemarks").value;
    var rowsData = [];
    tbody.querySelectorAll('tr').forEach(function(row) {
      var endTime = row.cells[1].querySelector('input').value;
      var water = row.cells[2].querySelector('input').value;
      rowsData.push({ endTime: endTime, water: water });
    });
    var recipe = JSON.stringify({ title, remarks, rows: rowsData });

    // 将 Recipe 数据放进png文件
    var base64Image = newCanvas.toDataURL("image/jpeg", 0.95);
    var exifObj = { "0th": {}, "Exif": {}, "GPS": {}, "Interop": {}, "1st": {}, "thumbnail": null };
    exifObj["0th"][piexif.ImageIFD.ImageDescription] = recipe;
    var exifStr = piexif.dump(exifObj);
    var newBase64Image = piexif.insert(exifStr, base64Image);
    
    // 生成下载链接
    var link = document.createElement('a');
    link.download = title + "_recipe.jpeg";
    link.href = newBase64Image;
    link.click();
    
    // 恢复原始状态
    restoreButtonState();
    
    screenshotBtn.classList.remove('processing');
    showToast('Image saved!', 'success');
  }).catch(function(error) {
    console.error('Screenshot error:', error);
    screenshotBtn.classList.remove('processing');
    showToast('Error creating image', 'error');
    
    // 恢复原始状态
    restoreButtonState();
  });
});


// ------------------------------
// 显示 Recipe 列表和 load recipe
// ------------------------------
function showRecipeList() {
  var modalContent = recipeListModal.querySelector('.modal-content');
  modalContent.innerHTML = "";
  
  var titleElem = document.createElement('h3');
  titleElem.innerText = "Select a Recipe to Load";
  modalContent.appendChild(titleElem);
  
  // 遍历所有 recipe，创建一个容器包含加载按钮和删除按钮
  var recipesStr = localStorage.getItem("coffeeTimerRecipes");
  if (recipesStr) {
      var recipes = JSON.parse(recipesStr);
      var recipeCount = 0;
      
      Object.keys(recipes).forEach(function(recipeName) {
          recipeCount++;
          var container = document.createElement("div");
          container.className = "recipe-item";
          container.style.display = "flex";
          container.style.alignItems = "center";
          container.style.justifyContent = "space-between";
          container.style.margin = "8px 0";
          
          // 加载按钮
          var loadBtn = document.createElement("button");
          loadBtn.innerHTML = `<i class="fas fa-mug-hot mr-2"></i>${recipeName}`;
          loadBtn.style.flexGrow = "1";
          loadBtn.style.textAlign = "left";
          loadBtn.addEventListener("click", function() {
            loadRecipe(recipes[recipeName]);
            recipeListModal.style.display = "none";
            showToast('Recipe loaded: ' + recipeName, 'success');
          });
          
          // 删除按钮
          var deleteBtn = document.createElement("button");
          deleteBtn.innerHTML = `<i class="fas fa-trash"></i>`;  
          deleteBtn.style.marginLeft = "10px";
          deleteBtn.style.width = "40px";
          deleteBtn.style.flexShrink = "0";
          deleteBtn.className = "delete-btn";
          deleteBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            
            // 添加确认删除逻辑
            if (confirm("Delete recipe: " + recipeName + "?")) {
              // 删除该 recipe，并更新 localStorage
              delete recipes[recipeName];
              localStorage.setItem("coffeeTimerRecipes", JSON.stringify(recipes));
              // 刷新列表
              showRecipeList();
              showToast('Recipe deleted', 'info');
            }
          });
          
          container.appendChild(loadBtn);
          container.appendChild(deleteBtn);
          modalContent.appendChild(container);
      });
      
      if (recipeCount === 0) {
        var noRecipesMsg = document.createElement("p");
        noRecipesMsg.textContent = "No saved recipes found";
        noRecipesMsg.style.textAlign = "center";
        noRecipesMsg.style.color = "var(--text-secondary)";
        modalContent.appendChild(noRecipesMsg);
      }
  } else {
      var noRecipesMsg = document.createElement("p");
      noRecipesMsg.textContent = "No saved recipes found";
      noRecipesMsg.style.textAlign = "center";
      noRecipesMsg.style.color = "var(--text-secondary)";
      modalContent.appendChild(noRecipesMsg);
  }
  
  // 导入按钮
  var importContainer = document.createElement("div");
  importContainer.style.marginTop = "16px";
  importContainer.style.borderTop = "1px solid var(--border-color)";
  importContainer.style.paddingTop = "16px";
  
  var importBtn = document.createElement("button");
  importBtn.innerHTML = '<i class="fas fa-file-import mr-2"></i>Import from Image';
  importBtn.addEventListener("click", function () {
      importRecipeFromImage();
  });
  importContainer.appendChild(importBtn);
  modalContent.appendChild(importContainer);
  
  // 取消按钮
  var cancelBtn = document.createElement("button");
  cancelBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Cancel';
  cancelBtn.style.marginTop = "8px";
  cancelBtn.addEventListener("click", function() {
    recipeListModal.style.display = "none";
  });
  modalContent.appendChild(cancelBtn);
  
  // 显示弹窗
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
      <td><input type="time" value="${startVal}" readonly class="time-input start-time"></td>
      <td><input type="time" value="${rowData.endTime}" class="time-input end-time"></td>
      <td><input type="number" value="${rowData.water}" class="number-input water-amount"></td>
      <td>
        <button class="actionBtn" title="Actions">
          <i class="fas fa-ellipsis-vertical"></i>
        </button>
      </td>
    `;
    var actionBtn = newRow.querySelector('.actionBtn');
    actionBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      currentRow = newRow;
      var rect = actionBtn.getBoundingClientRect();
      popupMenu.style.top = (rect.bottom + window.scrollY) + "px";
      popupMenu.style.left = (rect.left + window.scrollX - 150) + "px";
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


function importRecipeFromImage() {
  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg"; // 只允许 JPEG 文件
  input.addEventListener("change", function (event) {
      var file = event.target.files[0];
      if (!file) {
          showToast('No file selected', 'error');
          return;
      }

      showToast('Reading image...', 'info');
      var reader = new FileReader();
      reader.onload = function (e) {
          try {
              var base64Image = e.target.result;
              var exifData = piexif.load(base64Image);
              var recipeData = exifData["0th"][piexif.ImageIFD.ImageDescription];
              if (recipeData) {
                  var recipe = JSON.parse(recipeData);
                  loadRecipe(recipe);
                  recipeListModal.style.display = "none";
                  showToast('Recipe imported successfully', 'success');
              } else {
                  showToast('No recipe found in this image', 'error');
              }
          } catch (error) {
              console.error("Failed to extract recipe:", error);
              showToast('Error extracting recipe data', 'error');
          }
      };
      reader.readAsDataURL(file);
  });

  input.click();
}

// ------------------------------
// 初始化
updateStartTimes();
