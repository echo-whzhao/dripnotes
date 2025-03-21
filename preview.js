// =============================================
// 预览模式功能 (Preview Mode Functionality)
// =============================================

// 全局变量
let timerInterval = null;
let startTime = 0;
let isPaused = false;
let pausedElapsedTime = 0;
let currentRecipeSteps = [];
let totalWater = 0;

// DOM 元素引用 - 使用不同的变量名避免冲突
const previewModalEl = document.getElementById('dripPreviewModal');
const previewTitleEl = document.getElementById('previewTitle');
const previewNotesEl = document.getElementById('previewNotes');
const stepWheelEl = document.getElementById('stepWheel');
const timerDisplayEl = document.getElementById('timerDisplay');
const currentWaterEl = document.getElementById('currentWaterAmount');
const targetWaterEl = document.getElementById('targetWaterAmount');
const startTimerEl = document.getElementById('startTimerBtn');
const pauseTimerEl = document.getElementById('pauseTimerBtn');
const resetTimerEl = document.getElementById('resetTimerBtn');
const closePreviewEl = document.getElementById('closePreviewBtn');
// 不重新声明previewBtn，直接使用main.js中的变量

// =============================================
// 工具函数
// =============================================

// 格式化毫秒为时间字符串 (00:00.00)
function formatMilliseconds(ms) {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((totalSeconds % 1) * 100);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}

// 精确计算水量 - 保留1位小数
function calculateWater(value) {
  return parseFloat(value.toFixed(1));
}

// =============================================
// 功能函数
// =============================================

// 显示预览模式
function showPreviewMode() {
  console.log('显示预览模式');
  // 获取配方数据
  const title = document.getElementById('recipeTitle').value.trim() || "Untitled Recipe";
  const remarks = document.getElementById('recipeRemarks').value;
  const rows = document.querySelectorAll('#recipeTable tbody tr');
  
  // 检查数据有效性
  if (rows.length === 0) {
    showToast('Please add at least one step', 'error');
    return;
  }
  
  // 清空先前的数据
  resetPreviewMode();
  
  // 设置标题和备注
  previewTitleEl.textContent = title;
  previewNotesEl.textContent = remarks || "No notes added";
  
  // 处理步骤数据
  currentRecipeSteps = [];
  let lastWater = 0;
  
  rows.forEach((row, index) => {
    const startTime = row.cells[0].querySelector('input').value;
    const endTime = row.cells[1].querySelector('input').value;
    const water = parseFloat(row.cells[2].querySelector('input').value);
    
    // 计算累计水量变化
    const waterChange = water - lastWater;
    lastWater = water;
    
    currentRecipeSteps.push({
      index,
      startTime,
      endTime,
      water,
      waterChange,
      startSeconds: parseTimeToSeconds(startTime),
      endSeconds: parseTimeToSeconds(endTime)
    });
  });
  
  // 设置最终总水量
  totalWater = lastWater;
  targetWaterEl.textContent = `${totalWater.toFixed(1)}g`;
  
  // 创建步骤滚轮
  createStepWheel();
  
  // 显示预览模式
  previewModalEl.style.display = 'flex';
  
  // 淡入效果
  setTimeout(() => {
    previewModalEl.style.opacity = '1';
  }, 10);
}

// 创建步骤滚轮
function createStepWheel() {
  stepWheelEl.innerHTML = '';
  
  // 使用flex布局，设置固定三个位置
  stepWheelEl.style.display = 'flex';
  stepWheelEl.style.flexDirection = 'row';
  stepWheelEl.style.overflowX = 'hidden'; // 禁止滚动
  stepWheelEl.style.overflowY = 'hidden';
  stepWheelEl.style.padding = '0';
  stepWheelEl.style.alignItems = 'center';
  stepWheelEl.style.justifyContent = 'center';
  stepWheelEl.style.gap = '10px';
  stepWheelEl.style.height = '100%';

  // 创建占位步骤（第一步之前）
  const placeholderStart = document.createElement('div');
  placeholderStart.className = 'step-card placeholder';
  placeholderStart.style.visibility = 'hidden';
  placeholderStart.style.width = '32%';
  stepWheelEl.appendChild(placeholderStart);

  // 创建所有实际步骤卡片
  currentRecipeSteps.forEach((step, index) => {
    const stepCard = document.createElement('div');
    stepCard.className = 'step-card';
    stepCard.dataset.index = index;
    
    // 调整卡片样式，适应不同屏幕
    stepCard.style.flex = '0 0 auto';
    stepCard.style.width = '32%';
    stepCard.style.boxSizing = 'border-box';
    stepCard.style.display = 'none'; // 默认隐藏所有卡片
    
    stepCard.innerHTML = `
      <div class="step-time">
        <span class="step-time-value">${step.startTime}</span>
        <span class="time-divider">→</span>
        <span class="step-time-value">${step.endTime}</span>
      </div>
      <div class="step-water">${step.water.toFixed(1)}g</div>
      <div class="step-label">Target Water</div>
    `;
    
    stepWheelEl.appendChild(stepCard);
  });

  // 创建占位步骤（最后一步之后）
  const placeholderEnd = document.createElement('div');
  placeholderEnd.className = 'step-card placeholder';
  placeholderEnd.style.visibility = 'hidden';
  placeholderEnd.style.width = '32%';
  stepWheelEl.appendChild(placeholderEnd);
  
  // 初始显示第一步
  updateStepWheel(0);
}

// 更新步骤滚轮显示
function updateStepWheel(currentSeconds) {
  // 查找当前应该显示哪一步
  let currentStepIndex = 0;
  let targetWater = 0;
  
  for (let i = 0; i < currentRecipeSteps.length; i++) {
    const step = currentRecipeSteps[i];
    
    if (currentSeconds >= step.startSeconds && currentSeconds <= step.endSeconds) {
      currentStepIndex = i;
      
      // 计算当前应该到达的水量 - 使用更精确的计算
      const stepDuration = step.endSeconds - step.startSeconds;
      const stepProgress = (currentSeconds - step.startSeconds) / stepDuration;
      const stepWaterChange = step.waterChange;
      
      // 如果是第一步，直接根据进度计算；否则，加上上一步的水量
      if (i === 0) {
        targetWater = calculateWater(stepProgress * step.water);
      } else {
        targetWater = calculateWater(currentRecipeSteps[i-1].water + (stepProgress * stepWaterChange));
      }
      
      break;
    } else if (currentSeconds > step.endSeconds) {
      // 如果超过了当前步骤的结束时间
      targetWater = step.water;
      
      // 如果是最后一步且已经超时
      if (i === currentRecipeSteps.length - 1) {
        currentStepIndex = i;
      }
    }
  }
  
  // 更新当前水量显示 - 保留一位小数
  currentWaterEl.textContent = `${targetWater.toFixed(1)}g`;
  
  // 获取所有步骤卡片（包括占位卡片）
  const stepCards = stepWheelEl.querySelectorAll('.step-card');
  
  // 安全检查：如果没有步骤卡片，不进行后续操作
  if (stepCards.length === 0) {
    return;
  }
  
  // 首先隐藏所有卡片
  stepCards.forEach(card => {
    card.style.display = 'none';
    card.classList.remove('current', 'prev', 'next');
  });
  
  // 计算索引时确保不超出范围
  const prevIndex = currentStepIndex > 0 ? currentStepIndex : 0; // 如果是第一步，使用占位卡片
  const nextIndex = currentStepIndex + 2 < stepCards.length ? currentStepIndex + 2 : stepCards.length - 1;
  
  // 安全检查：确保索引有效
  if (currentStepIndex + 1 < stepCards.length) {
    // 显示当前步骤（始终在中间）
    stepCards[currentStepIndex + 1].style.display = 'block';
    stepCards[currentStepIndex + 1].classList.add('current');
  }
  
  // 显示前一步（必然存在，在左边）
  if (prevIndex < stepCards.length) {
    stepCards[prevIndex].style.display = 'block';
    stepCards[prevIndex].classList.add('prev');
  }
  
  // 显示后一步（必然存在，在右边）
  if (nextIndex < stepCards.length) {
    stepCards[nextIndex].style.display = 'block';
    stepCards[nextIndex].classList.add('next');
  }
}

// 重置预览模式
function resetPreviewMode() {
  // 停止计时器
  stopTimer();
  
  // 重置UI状态
  timerDisplayEl.textContent = '00:00.00';
  currentWaterEl.textContent = '0.0g';
  
  // 重置按钮状态
  startTimerEl.disabled = false;
  pauseTimerEl.disabled = true;
  
  // 重置全局变量
  startTime = 0;
  isPaused = false;
  pausedElapsedTime = 0;

  // 确保有步骤数据时才更新步骤显示
  if (currentRecipeSteps.length > 0) {
    updateStepWheel(0);
  }
}

// 关闭预览模式
function closePreviewMode() {
  // 重置预览模式
  resetPreviewMode();
  
  // 隐藏预览模式
  previewModalEl.style.opacity = '0';
  setTimeout(() => {
    previewModalEl.style.display = 'none';
  }, 300);
}

// =============================================
// 计时器功能
// =============================================

// 开始计时器
function startTimer() {
  // 如果处于暂停状态，恢复计时
  if (isPaused) {
    isPaused = false;
    startTime = Date.now() - pausedElapsedTime;
  } else {
    startTime = Date.now();
  }
  
  // 更新按钮状态
  startTimerEl.disabled = true;
  pauseTimerEl.disabled = false;
  
  // 每10ms更新一次显示 - 提高精度
  timerInterval = setInterval(updateTimer, 10);
}

// 暂停计时器
function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // 记录已经过去的时间
  pausedElapsedTime = Date.now() - startTime;
  isPaused = true;
  
  // 更新按钮状态
  startTimerEl.disabled = false;
  pauseTimerEl.disabled = true;
}

// 停止计时器
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  
  // 重置按钮状态
  startTimerEl.disabled = false;
  pauseTimerEl.disabled = true;
}

// 更新计时器显示
function updateTimer() {
  const elapsedTimeMs = Date.now() - startTime;
  const elapsedSeconds = elapsedTimeMs / 1000; // 转换为秒，保留小数
  
  // 更新时间显示 - 使用毫秒精度
  timerDisplayEl.textContent = formatMilliseconds(elapsedTimeMs);
  
  // 更新步骤滚轮
  updateStepWheel(elapsedSeconds);
}

// =============================================
// 事件监听器
// =============================================

// 确保在DOM加载完成后再绑定事件
document.addEventListener('DOMContentLoaded', function() {
  console.log('预览模式初始化...');
  
  if (typeof previewBtn !== 'undefined') {
    // 打开预览模式
    previewBtn.addEventListener('click', showPreviewMode);
    
    // 关闭预览模式
    closePreviewEl.addEventListener('click', closePreviewMode);
    
    // 计时器控制
    startTimerEl.addEventListener('click', startTimer);
    pauseTimerEl.addEventListener('click', pauseTimer);
    resetTimerEl.addEventListener('click', resetPreviewMode);
    
    // 点击预览模式背景时关闭（仅当点击到背景而非内容区域）
    previewModalEl.addEventListener('click', function(e) {
      if (e.target === previewModalEl) {
        closePreviewMode();
      }
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
      // 如果预览模式处于显示状态
      if (previewModalEl.style.display === 'flex') {
        // ESC键关闭预览模式
        if (e.key === 'Escape') {
          closePreviewMode();
        }
        
        // 空格键切换播放/暂停
        if (e.key === ' ') {
          e.preventDefault(); // 阻止空格键滚动页面
          if (isPaused || !timerInterval) {
            startTimer();
          } else {
            pauseTimer();
          }
        }
      }
    });
    
    console.log('预览模式初始化完成');
  } else {
    console.error('previewBtn未定义，可能在main.js中未正确初始化');
  }
});
