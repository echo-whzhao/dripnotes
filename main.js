// =============================================
// 工具函数
// =============================================
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
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

// 提示消息显示函数
function showToast(message, type = 'info') {
  var existingToast = document.querySelector('.toast-message');
  if (existingToast) existingToast.remove();
  
  var toast = document.createElement('div');
  toast.className = 'toast-message ' + type;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// DOM 元素引用
var tbody = document.querySelector("#recipeTable tbody");
var addRowBtn = document.getElementById("addRowBtn");
var screenshotBtn = document.getElementById("screenshotBtn");
var saveBtn = document.getElementById("saveBtn");
var loadBtn = document.getElementById("loadBtn");
var previewBtn = document.getElementById("previewBtn");
var popupMenu = document.getElementById("popupMenu");
var recipeListModal = document.getElementById("recipeListModal");

var currentRow = null; // 用于记录当前操作的行

// =============================================
// 验证函数
// =============================================
// 为指定元素添加验证事件监听器
function addValidationListeners(element) {
  element.addEventListener('input', validateAllRows);
  element.addEventListener('change', validateAllRows);
}

// 验证单行数据
function validateRow(row, allRows) {
  var startInput = row.cells[0].querySelector('input');
  var endInput = row.cells[1].querySelector('input');
  var startSec = parseTimeToSeconds(startInput.value);
  var endSec = parseTimeToSeconds(endInput.value);
  
  // 验证第一行的开始时间是否为00:00
  if (row === allRows[0]) {
    startInput.classList.toggle('error', startInput.value !== "00:00");
  } else {
    // 验证非第一行的开始时间是否大于等于上一行的结束时间
    var rowIndex = Array.from(allRows).indexOf(row);
    if (rowIndex > 0) {
      var prevRow = allRows[rowIndex - 1];
      var prevEndTime = prevRow.cells[1].querySelector('input').value;
      var prevEndSec = parseTimeToSeconds(prevEndTime);
      startInput.classList.toggle('error', startSec < prevEndSec);
    }
  }
  
  // 验证结束时间是否大于开始时间
  endInput.classList.toggle('error', endSec <= startSec);
}

// 验证水量数据
function validateWaterRows(allRows) {
  for (var i = 1; i < allRows.length; i++) {
    var prevWater = parseFloat(allRows[i - 1].cells[2].querySelector('input').value);
    var currWater = parseFloat(allRows[i].cells[2].querySelector('input').value);
    var waterInput = allRows[i].cells[2].querySelector('input');
    waterInput.classList.toggle('error', currWater < prevWater);
  }
  
  if (allRows.length > 0) {
    allRows[0].cells[2].querySelector('input').classList.remove('error');
  }
}

// 验证所有行数据
function validateAllRows() {
  var rows = tbody.querySelectorAll('tr');
  rows.forEach(row => validateRow(row, rows));
  validateWaterRows(rows);
}

// =============================================
// 行操作函数
// =============================================
// 创建新行
function createRow(defaultStartTime, defaultEndTime) {
  var newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td><input type="time" value="${defaultStartTime}" class="time-input start-time"></td>
    <td><input type="time" value="${defaultEndTime}" class="time-input end-time"></td>
    <td><input type="number" inputmode="numeric" pattern="[0-9]*" value="50" class="number-input water-amount"></td>
    <td>
      <button class="actionBtn" title="Actions">
        <i class="fas fa-ellipsis-vertical"></i>
      </button>
    </td>
  `;
  
  // 为按钮添加事件监听
  setupActionButton(newRow.querySelector('.actionBtn'), newRow);
  
  // 为所有输入框添加验证事件
  newRow.querySelectorAll('input').forEach(addValidationListeners);
  
  return newRow;
}

// 设置行操作按钮
function setupActionButton(actionBtn, row) {
  actionBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    currentRow = row;
    var rect = actionBtn.getBoundingClientRect();
    popupMenu.style.top = (rect.bottom + window.scrollY) + "px";
    popupMenu.style.left = (rect.left + window.scrollX - 105) + "px";
    popupMenu.style.display = "block";
    
    // 添加淡入效果
    popupMenu.style.opacity = "0";
    setTimeout(() => popupMenu.style.opacity = "1", 10);
  });
}

// 添加新行
function addRow(afterRow, startTime, endTime) {
  var newEndTime = endTime || addSeconds(startTime, 10);
  var newRow = createRow(startTime, newEndTime);
  
  if (afterRow) {
    afterRow.parentNode.insertBefore(newRow, afterRow.nextSibling);
  } else {
    tbody.appendChild(newRow);
  }
  
  validateAllRows();
  return newRow;
}

// =============================================
// 事件监听器设置
// =============================================
// 弹出菜单事件
popupMenu.querySelectorAll('li').forEach(function(item) {
  item.addEventListener('click', function(e) {
    e.stopPropagation();
    var action = this.getAttribute('data-action');
    
    switch(action) {
      case "add":
        var currEnd = currentRow.cells[1].querySelector('input').value;
        addRow(currentRow, currEnd);
        showToast('New step added', 'success');
        break;
        
      case "delete":
        if (tbody.querySelectorAll('tr').length > 1) {
          currentRow.remove();
          showToast('Step deleted', 'success');
        } else {
          showToast('Cannot delete the final row', 'error');
        }
        break;
        
      case "moveUp":
        var prevRow = currentRow.previousElementSibling;
        if (prevRow) {
          tbody.insertBefore(currentRow, prevRow);
          showToast('Moved up', 'info');
        }
        break;
        
      case "moveDown":
        var nextRow = currentRow.nextElementSibling;
        if (nextRow) {
          tbody.insertBefore(nextRow, currentRow);
          showToast('Moved down', 'info');
        }
        break;
    }
    
    popupMenu.style.display = "none";
    validateAllRows();
  });
});

// 表格点击事件
tbody.addEventListener('click', function(e) {
  if (e.target.classList.contains('actionBtn') || e.target.closest('.actionBtn')) {
    e.stopPropagation();
    var actionBtn = e.target.classList.contains('actionBtn') ? e.target : e.target.closest('.actionBtn');
    currentRow = actionBtn.closest('tr');
    var rect = actionBtn.getBoundingClientRect();
    popupMenu.style.top = (rect.bottom + window.scrollY) + "px";
    popupMenu.style.left = (rect.left + window.scrollX - 105) + "px";
    popupMenu.style.display = "block";
  }
});

// 点击页面其他区域时隐藏弹出菜单
document.addEventListener('click', function() {
  popupMenu.style.display = "none";
});

// 底部 Add Row 按钮事件
addRowBtn.addEventListener('click', function() {
  var rows = tbody.querySelectorAll('tr');
  var lastRow = rows[rows.length - 1];
  var lastEnd = lastRow.cells[1].querySelector('input').value;
  var newRow = addRow(null, lastEnd);
  
  // 平滑滚动到底部
  newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

// =============================================
// 保存和加载功能
// =============================================
// 保存当前配方
saveBtn.addEventListener('click', function() {
  var title = document.getElementById("recipeTitle").value.trim() || "Recipe " + new Date().toLocaleDateString();
  var remarks = document.getElementById("recipeRemarks").value;
  var rowsData = [];
  
  tbody.querySelectorAll('tr').forEach(function(row) {
    var endTime = row.cells[1].querySelector('input').value;
    var water = row.cells[2].querySelector('input').value;
    rowsData.push({ endTime, water });
  });
  
  var recipe = { title, remarks, rows: rowsData };
  var savedRecipes = localStorage.getItem("coffeeTimerRecipes");
  var recipesObj = savedRecipes ? JSON.parse(savedRecipes) : {};
  recipesObj[title] = recipe;
  localStorage.setItem("coffeeTimerRecipes", JSON.stringify(recipesObj));
  
  showToast('Recipe saved: ' + title, 'success');
});

// 加载配方
loadBtn.addEventListener('click', function() {
  showRecipeList();
});

// 预览功能
previewBtn.addEventListener('click', function() {
  showToast('Drip preview coming soon!', 'info');
});

// 显示配方列表
function showRecipeList() {
  var modalContent = recipeListModal.querySelector('.modal-content');
  modalContent.innerHTML = "";
  
  var titleElem = document.createElement('h3');
  titleElem.innerText = "Select a Recipe to Load";
  modalContent.appendChild(titleElem);
  
  // 加载所有保存的配方
  var recipesStr = localStorage.getItem("coffeeTimerRecipes");
  var recipeCount = 0;
  
  if (recipesStr) {
    var recipes = JSON.parse(recipesStr);
    
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
        
        if (confirm("Delete recipe: " + recipeName + "?")) {
          delete recipes[recipeName];
          localStorage.setItem("coffeeTimerRecipes", JSON.stringify(recipes));
          showRecipeList();
          showToast('Recipe deleted', 'info');
        }
      });
      
      container.appendChild(loadBtn);
      container.appendChild(deleteBtn);
      modalContent.appendChild(container);
    });
  }
  
  // 如果没有配方，显示提示信息
  if (recipeCount === 0) {
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

// 加载配方
function loadRecipe(recipe) {
  document.getElementById("recipeTitle").value = recipe.title;
  document.getElementById("recipeRemarks").value = recipe.remarks;
  tbody.innerHTML = "";
  
  recipe.rows.forEach(function(rowData, index) {
    var startVal = index === 0 ? "00:00" : "";
    
    // 如果不是第一行，则使用上一行的结束时间作为开始时间
    if (index > 0) {
      startVal = recipe.rows[index - 1].endTime;
    }
    
    var newRow = createRow(startVal, rowData.endTime);
    newRow.cells[2].querySelector('input').value = rowData.water;
    tbody.appendChild(newRow);
  });
  
  validateAllRows();
}

// 从图片导入配方
function importRecipeFromImage() {
  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg";
  
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

// =============================================
// 截图功能
// =============================================
screenshotBtn.addEventListener('click', function() {
  screenshotBtn.classList.add('processing');
  showToast('Creating image...', 'info');
  
  // 临时修改 Add Step 按钮
  var addRowBtn = document.getElementById("addRowBtn");
  var originalContent = addRowBtn.innerHTML;
  addRowBtn.innerHTML = `
    <div style="text-align: center; color: var(--text-light);">
      <div style="font-size: 30px; font-family: 'Dancing Script', cursive; font-weight: 700; margin-bottom: 4px;">Drip Notes</div>
      <div style="font-size: 12px; opacity: 0.7;">https://echo-whzhao.github.io/CoffeeTimer</div>
    </div>
  `;
  
  // 修改按钮样式
  var originalStyles = {
    height: addRowBtn.style.height,
    padding: addRowBtn.style.padding,
    background: addRowBtn.style.background,
    border: addRowBtn.style.border,
    cursor: addRowBtn.style.cursor
  };
  
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
    Object.keys(originalStyles).forEach(key => {
      addRowBtn.style[key] = originalStyles[key];
    });
  }
  
  html2canvas(contentPanel, {
    scale: 2,
    backgroundColor: "#ffffff",
    logging: false,
    useCORS: true
  }).then(function(originalCanvas) {
    // 创建画布
    var newCanvas = document.createElement("canvas");
    var ctx = newCanvas.getContext("2d");
    newCanvas.width = originalCanvas.width;
    newCanvas.height = originalCanvas.height;
    ctx.drawImage(originalCanvas, 0, 0);

    // 提取recipe信息
    var title = document.getElementById("recipeTitle").value.trim() || "Coffee Recipe " + new Date().toLocaleDateString();
    var remarks = document.getElementById("recipeRemarks").value;
    var rowsData = [];
    
    tbody.querySelectorAll('tr').forEach(function(row) {
      var endTime = row.cells[1].querySelector('input').value;
      var water = row.cells[2].querySelector('input').value;
      rowsData.push({ endTime, water });
    });
    
    var recipe = JSON.stringify({ title, remarks, rows: rowsData });

    // 将Recipe数据嵌入图片
    var base64Image = newCanvas.toDataURL("image/jpeg", 0.95);
    var exifObj = { "0th": {}, "Exif": {}, "GPS": {}, "Interop": {}, "1st": {}, "thumbnail": null };
    exifObj["0th"][piexif.ImageIFD.ImageDescription] = recipe;
    var exifStr = piexif.dump(exifObj);
    var newBase64Image = piexif.insert(exifStr, base64Image);
    
    // 检测设备类型
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isMobile || isSafari) {
      // 在移动设备上打开新标签页
      var newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <html>
            <head><title>${title}</title></head>
            <body style="margin:0;display:flex;justify-content:center;align-items:center;background:#f5f5f5;">
              <img src="${newBase64Image}" style="max-width:100%;max-height:100vh;">
            </body>
          </html>
        `);
        newTab.document.close();
        showToast('Image opened in new tab', 'success');
      } else {
        showToast('Please allow popups to view the image', 'error');
      }
    } else {
      // 在桌面设备上下载图片
      var link = document.createElement('a');
      link.download = title + "_recipe.jpeg";
      link.href = newBase64Image;
      link.click();
      showToast('Image saved!', 'success');
    }
    
    restoreButtonState();
    screenshotBtn.classList.remove('processing');
  }).catch(function(error) {
    console.error('Screenshot error:', error);
    screenshotBtn.classList.remove('processing');
    showToast('Error creating image', 'error');
    restoreButtonState();
  });
});

// =============================================
// 初始化
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  // 为初始行的所有输入框添加事件监听器
  var initialRow = tbody.querySelector('tr');
  if (initialRow) {
    initialRow.querySelectorAll('input').forEach(addValidationListeners);
    setupActionButton(initialRow.querySelector('.actionBtn'), initialRow);
  }
  
  // 初始验证
  validateAllRows();
});
