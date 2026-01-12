// src/main.js
// 말랑말랑 리트코드 - Main Application Script

import './style.css'
import * as API from './api.js'

// ========================================
// 전역 변수
// ========================================

let reloadTimer = null

// 오늘 날짜 (사용자 로컬 타임존)
const today = new Date()
const month = String(today.getMonth() + 1).padStart(2, '0')
const day = String(today.getDate()).padStart(2, '0')
const dateStr = `${month}/${day}`

// ========================================
// 초기화
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // 오늘 날짜 표시
  const dateElement = document.getElementById('today-date')
  if (dateElement) {
    dateElement.textContent = `Today: ${dateStr}`
  }
  
  // 이벤트 리스너 설정
  setupEventListeners()
  
  // 개발자 콘솔 메시지
  console.log('%c🧠 말랑말랑 리트코드', 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 16px; font-weight: bold; padding: 15px 30px; border-radius: 5px')
  console.log('%cCopyright (c) 2025 Yooni Choi', 'font-size: 12px; color: #667eea;')
  console.log('%cMIT License - https://github.com/yoonichoi', 'font-size: 11px; color: #999;')
})

// ========================================
// 이벤트 리스너 설정
// ========================================

function setupEventListeners() {
  // 탭 전환
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab')
      switchTab(tabName)
    })
  })
  
  // 등록 폼
  document.getElementById('register-form').addEventListener('submit', handleRegister)
  
  // 인증 폼
  document.getElementById('checkin-form').addEventListener('submit', handleCheckin)
  
  // 내 기록 보기
  document.getElementById('load-history-btn').addEventListener('click', loadMyHistory)
}

// ========================================
// 탭 전환
// ========================================

function switchTab(tabName) {
  // 리로드 타이머 취소
  if (reloadTimer) {
    clearTimeout(reloadTimer)
    reloadTimer = null
  }
  
  // 성공 화면 숨기기
  document.getElementById('success-container').style.display = 'none'
  
  // 모든 버튼 복원
  resetButtons()
  
  // 에러 메시지 숨기기
  document.querySelectorAll('.error').forEach(error => error.style.display = 'none')
  
  // 페이지 전환
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active')
    page.style.display = 'none' // 명시적으로 숨기기
  })
  
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active')
  })
  
  const targetPage = document.getElementById(`${tabName}-page`)
  targetPage.style.display = 'block' // 명시적으로 보이기
  targetPage.classList.add('active')
  
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')
}

function resetButtons() {
  const registerBtn = document.getElementById('register-btn')
  registerBtn.disabled = false
  registerBtn.textContent = '등록하기'
  
  const checkinBtn = document.getElementById('checkin-btn')
  checkinBtn.disabled = false
  checkinBtn.textContent = '✅ 인증 완료'
}

// ========================================
// 사용자 목록 로드
// ========================================

async function loadUsers() {
  try {
    const result = await API.getUsers()
    const datalist = document.getElementById('username-list')
    datalist.innerHTML = ''
    
    result.users.forEach(user => {
      const option = document.createElement('option')
      option.value = user
      datalist.appendChild(option)
    })
  } catch (error) {
    console.error('사용자 목록 로드 실패:', error)
  }
}

async function loadUsersForHistory() {
  try {
    const result = await API.getUsers()
    const datalist = document.getElementById('history-username-list')
    datalist.innerHTML = ''
    
    result.users.forEach(user => {
      const option = document.createElement('option')
      option.value = user
      datalist.appendChild(option)
    })
  } catch (error) {
    console.error('사용자 목록 로드 실패:', error)
  }
}

// ========================================
// 등록 처리
// ========================================

async function handleRegister(e) {
  e.preventDefault()
  
  const registerCode = document.getElementById('register-code').value.trim()
  const username = document.getElementById('register-username').value.trim()
  const password = document.getElementById('register-password').value
  const registerBtn = document.getElementById('register-btn')
  
  if (password.length !== 4) {
    showError('register-error', '4자리 숫자를 입력해주세요!')
    return
  }
  
  registerBtn.disabled = true
  registerBtn.textContent = '등록 중...'
  hideError('register-error')
  
  try {
    const result = await API.registerUser(registerCode, username, password)
    
    if (result.status === 'invalid_code') {
      showError('register-error', '등록코드가 올바르지 않습니다!')
      registerBtn.disabled = false
      registerBtn.textContent = '등록하기'
    } else if (result.status === 'duplicate') {
      showError('register-error', '이미 등록된 사용자입니다!')
      registerBtn.disabled = false
      registerBtn.textContent = '등록하기'
    } else if (result.status === 'success') {
      showSuccess('등록 완료!', `${username}님, 환영합니다!<br><br>이제 인증 탭에서 매일 인증하세요! 🎉<br><br><small style="color: #999;">3초 후 자동으로 이동합니다...</small>`)
      reloadTimer = setTimeout(() => {
        location.reload()
      }, 3000)
    } else {
      throw new Error(result.message || '알 수 없는 오류')
    }
  } catch (error) {
    console.error('Error:', error)
    showError('register-error', '등록 실패! 다시 시도해주세요.')
    registerBtn.disabled = false
    registerBtn.textContent = '등록하기'
  }
}

// ========================================
// 인증 처리
// ========================================

async function handleCheckin(e) {
  e.preventDefault()
  
  const username = document.getElementById('checkin-username').value.trim()
  const password = document.getElementById('checkin-password').value
  const problem = document.getElementById('problem').value.trim() || '미입력'
  const checkinBtn = document.getElementById('checkin-btn')
  
  if (!username) {
    showError('checkin-error', '이름을 입력해주세요!')
    return
  }
  
  if (password.length !== 4) {
    showError('checkin-error', '4자리 비밀번호를 입력해주세요!')
    return
  }
  
  checkinBtn.disabled = true
  checkinBtn.textContent = '전송 중...'
  hideError('checkin-error')
  
  try {
    const result = await API.checkin(username, password, dateStr, problem)
    
    if (result.status === 'user_not_found') {
      showError('checkin-error', '등록되지 않은 사용자입니다!')
      checkinBtn.disabled = false
      checkinBtn.textContent = '✅ 인증 완료'
    } else if (result.status === 'unauthorized') {
      showError('checkin-error', '비밀번호가 틀렸습니다!')
      checkinBtn.disabled = false
      checkinBtn.textContent = '✅ 인증 완료'
    } else if (result.status === 'duplicate') {
      showError('checkin-error', '이미 오늘 인증하셨습니다!')
      checkinBtn.disabled = false
      checkinBtn.textContent = '✅ 인증 완료'
    } else if (result.status === 'success') {
      showSuccess('인증 완료!', `${username}님의 ${dateStr} 인증이 완료되었습니다!<br><br>총 <strong>${result.totalCount}일</strong> 인증 완료 🎉`)
      reloadTimer = setTimeout(() => {
        location.reload()
      }, 3000)
    } else {
      throw new Error(result.message || '알 수 없는 오류')
    }
  } catch (error) {
    console.error('Error:', error)
    showError('checkin-error', '전송 실패! 관리자에게 문의하세요.')
    checkinBtn.disabled = false
    checkinBtn.textContent = '✅ 인증 완료'
  }
}

// ========================================
// 내 기록 로드
// ========================================

// 이번주 시작일 계산 (월요일 기준)
function getThisWeekStart() {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=일요일, 1=월요일, ...
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // 월요일로 이동
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// 이번주 인증 통계 계산
function calculateWeekStats(history) {
  const weekStart = getThisWeekStart()
  const now = new Date()
  
  // 이번주 인증한 날짜들 (M/D 형식)
  const weekCheckins = new Set()
  
  history.forEach(item => {
    // item.date는 "M/D" 형식
    const [month, day] = item.date.split('/').map(Number)
    const checkDate = new Date(now.getFullYear(), month - 1, day)
    
    if (checkDate >= weekStart && checkDate <= now) {
      weekCheckins.add(item.date)
    }
  })
  
  // 이번주 경과일 계산 (월요일부터 오늘까지)
  const daysPassed = Math.floor((now - weekStart) / (1000 * 60 * 60 * 24)) + 1 // +1은 오늘 포함
  
  const count = weekCheckins.size
  const missing = Math.max(0, daysPassed - count)
  
  return { count, missing }
}

async function loadMyHistory() {
  const username = document.getElementById('history-username').value.trim()
  const password = document.getElementById('history-password').value
  const btn = document.getElementById('load-history-btn')
  const statsDiv = document.getElementById('my-stats')

  hideError('history-error')

  if (!username) {
    showError('history-error', '이름을 입력해주세요!')
    return
  }

  if (!password || password.length !== 4) {
    showError('history-error', '4자리 비밀번호를 입력해주세요!')
    return
  }

  btn.disabled = true
  btn.textContent = '로딩 중...'

  try {
    const result = await API.getUserStats(username, password)

    if (result.status === 'user_not_found') {
      showError('history-error', '등록되지 않은 사용자입니다!')
      statsDiv.style.display = 'none'
    } else if (result.status === 'unauthorized') {
      showError('history-error', '비밀번호가 틀렸습니다!')
      statsDiv.style.display = 'none'
    } else if (result.count === 0) {
      showError('history-error', '인증 기록이 없습니다.')
      statsDiv.style.display = 'none'
    } else {
      document.getElementById('my-total-count').textContent = result.count
      document.getElementById('my-last-date').textContent = result.lastDate || '-'

      // 이번주 인증 통계 계산
      const weekStats = calculateWeekStats(result.history)
      document.getElementById('my-week-count').textContent = weekStats.count
      const missingText = weekStats.missing > 0 ? `(${weekStats.missing}일 누락)` : ''
      document.getElementById('my-week-missing').textContent = missingText

      // 구제권 상태 로드
      await loadExemptionStatus(username, password)

      const historyHTML = result.history.map((item, index) => {
        // 문제 이름 처리: 없거나 "미입력"이면 회색으로 표시
        const problemName = (item.problem && item.problem !== '미입력') 
          ? item.problem 
          : '<span style="color: #999; font-style: italic;">미입력</span>'
        
        return `
          <div class="history-item" id="history-item-${index}" data-date="${item.date}" data-problem="${item.problem || ''}" data-timestamp="${item.timestamp}">
            <span class="history-date">${item.date}</span>
            <span class="history-problem" id="problem-text-${index}">${problemName}</span>
            <button class="edit-icon-btn" onclick="window.editProblem(${index})" title="문제 이름 수정">
              ✎
            </button>
          </div>
        `
      }).join('')
      
      document.getElementById('my-history-list').innerHTML = historyHTML
      statsDiv.style.display = 'block'
    }
  } catch (error) {
    console.error('Error:', error)
    showError('history-error', '데이터 로드 실패. 다시 시도해주세요.')
  } finally {
    btn.disabled = false
    btn.textContent = '🔍 내 기록 보기'
  }
}

// ========================================
// 문제 이름 수정
// ========================================

window.editProblem = function(index) {
  const item = document.getElementById(`history-item-${index}`)
  const problemText = document.getElementById(`problem-text-${index}`)
  const currentProblem = item.getAttribute('data-problem') || ''
  
  // 편집 모드로 전환
  item.classList.add('editing')
  
  problemText.innerHTML = `
    <input type="text" class="problem-input" id="problem-input-${index}" 
           value="${currentProblem}" placeholder="문제 이름 입력...">
  `
  
  const editBtn = item.querySelector('.edit-icon-btn')
  editBtn.outerHTML = `
    <div class="inline-edit-buttons">
      <button class="icon-btn save-btn" onclick="window.saveProblem(${index})" title="저장">✓</button>
      <button class="icon-btn cancel-btn" onclick="window.cancelEdit(${index})" title="취소">✕</button>
    </div>
  `
  
  // 입력 필드에 포커스 & 전체 선택
  const input = document.getElementById(`problem-input-${index}`)
  input.focus()
  input.select()
  
  // Enter 키로 저장, Escape 키로 취소
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      window.saveProblem(index)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      window.cancelEdit(index)
    }
  })
}

window.cancelEdit = function(index) {
  const item = document.getElementById(`history-item-${index}`)
  const problemText = document.getElementById(`problem-text-${index}`)
  const currentProblem = item.getAttribute('data-problem') || ''
  
  // 편집 모드 해제
  item.classList.remove('editing')
  
  // 원래 표시로 복원
  const displayText = (currentProblem && currentProblem !== '미입력')
    ? currentProblem
    : '<span style="color: #999; font-style: italic;">미입력</span>'
  
  problemText.innerHTML = displayText
  
  const buttons = item.querySelector('.inline-edit-buttons')
  buttons.outerHTML = `
    <button class="edit-icon-btn" onclick="window.editProblem(${index})" title="문제 이름 수정">
      ✎
    </button>
  `
}

window.saveProblem = async function(index) {
  const item = document.getElementById(`history-item-${index}`)
  const input = document.getElementById(`problem-input-${index}`)
  const newProblem = input.value.trim()
  
  const username = document.getElementById('history-username').value.trim()
  const password = document.getElementById('history-password').value
  const timestamp = item.getAttribute('data-timestamp')
  
  try {
    const saveBtn = item.querySelector('.save-btn')
    const cancelBtn = item.querySelector('.cancel-btn')
    
    // 버튼 비활성화
    saveBtn.disabled = true
    cancelBtn.disabled = true
    saveBtn.innerHTML = '⏳'
    saveBtn.title = '저장 중...'
    
    const result = await API.updateProblem(username, password, timestamp, newProblem || '미입력')
    
    if (result.status === 'user_not_found') {
      alert('등록되지 않은 사용자입니다!')
      saveBtn.disabled = false
      cancelBtn.disabled = false
      saveBtn.innerHTML = '✓'
      saveBtn.title = '저장'
    } else if (result.status === 'unauthorized') {
      alert('비밀번호가 틀렸습니다!')
      saveBtn.disabled = false
      cancelBtn.disabled = false
      saveBtn.innerHTML = '✓'
      saveBtn.title = '저장'
    } else if (result.status === 'success') {
      // 편집 모드 해제
      item.classList.remove('editing')
      
      // 데이터 업데이트
      item.setAttribute('data-problem', newProblem || '')
      
      // 표시 업데이트
      const displayText = newProblem
        ? newProblem
        : '<span style="color: #999; font-style: italic;">미입력</span>'
      
      document.getElementById(`problem-text-${index}`).innerHTML = displayText
      
      // 버튼을 연필 아이콘으로 복원
      const buttons = item.querySelector('.inline-edit-buttons')
      buttons.outerHTML = `
        <button class="edit-icon-btn" onclick="window.editProblem(${index})" title="문제 이름 수정">
          ✎
        </button>
      `
      
      // 성공 표시 (간단하게)
      const problemText = document.getElementById(`problem-text-${index}`)
      problemText.style.color = '#10b981'
      setTimeout(() => {
        problemText.style.color = ''
      }, 1000)
    } else {
      throw new Error(result.message || '알 수 없는 오류')
    }
  } catch (error) {
    console.error('Error:', error)
    alert('저장 실패! 다시 시도해주세요.')
    
    const saveBtn = item.querySelector('.save-btn')
    const cancelBtn = item.querySelector('.cancel-btn')
    if (saveBtn) {
      saveBtn.disabled = false
      cancelBtn.disabled = false
      saveBtn.innerHTML = '✓'
      saveBtn.title = '저장'
    }
  }
}

// ========================================
// UI 헬퍼 함수
// ========================================

function showError(id, message) {
  const errorMsg = document.getElementById(id)
  errorMsg.textContent = message
  errorMsg.style.display = 'block'
}

function hideError(id) {
  const errorMsg = document.getElementById(id)
  errorMsg.style.display = 'none'
}

function showSuccess(title, message) {
  document.querySelectorAll('.page').forEach(page => page.style.display = 'none')
  const successDiv = document.getElementById('success-container')
  successDiv.querySelector('h2').textContent = title
  successDiv.querySelector('p').innerHTML = message
  successDiv.style.display = 'block'
}

// ========================================
// 구제권 기능
// ========================================

// 날짜 포맷 (YYYY-MM-DD -> M/D)
function formatWeekDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return `${date.getMonth() + 1}/${date.getDate()}`
}

async function loadExemptionStatus(username, password) {
  const cardEl = document.getElementById('exemption-section')
  const statusEl = document.getElementById('exemption-status')
  const btnEl = document.getElementById('use-exemption-btn')

  statusEl.textContent = '확인 중...'
  btnEl.style.display = 'none'
  cardEl.classList.remove('used')

  try {
    const result = await API.canUseExemption(username, password)

    if (result.status !== 'success') {
      statusEl.textContent = '구제권 상태를 확인할 수 없습니다.'
      return
    }

    if (result.canUse) {
      // 사용 가능
      const { weekStart, weekEnd } = result.currentWeek
      statusEl.innerHTML = `<strong>구제권</strong> <span class="week-info">(이번주: ${formatWeekDate(weekStart)} ~ ${formatWeekDate(weekEnd)})</span>`
      btnEl.style.display = 'block'
      btnEl.onclick = () => handleUseExemption(username, password, weekStart, weekEnd)
    } else {
      // 이미 사용함
      cardEl.classList.add('used')
      statusEl.classList.add('used-status')
      const used = result.usedRecord
      const appliedWeek = `${formatWeekDate(used.applied_week_start)} ~ ${formatWeekDate(used.applied_week_end)}`
      statusEl.innerHTML = `<strong>구제권 사용 완료</strong> <span class="week-info">(${appliedWeek} 주 적용됨)</span>`
      btnEl.style.display = 'none'
    }
  } catch (error) {
    console.error('Error loading exemption status:', error)
    statusEl.textContent = '구제권 상태를 확인할 수 없습니다.'
  }
}

async function handleUseExemption(username, password, weekStart, weekEnd) {
  const weekRange = `${formatWeekDate(weekStart)} ~ ${formatWeekDate(weekEnd)}`

  if (!confirm(`이번 주(${weekRange}) 누락 기록을 구제할까요?\n\n구제권은 한 달에 한 번만 사용할 수 있습니다.`)) {
    return
  }

  const btnEl = document.getElementById('use-exemption-btn')
  btnEl.disabled = true
  btnEl.textContent = '처리 중...'

  try {
    const result = await API.useExemption(username, password, weekStart, weekEnd)

    if (result.status === 'success') {
      alert(`구제권이 사용되었습니다!\n\n${weekRange} 주의 누락 기록이 구제됩니다.`)
      // 상태 새로고침
      await loadExemptionStatus(username, password)
    } else if (result.status === 'already_used') {
      alert('이번 달 구제권을 이미 사용했습니다.')
      await loadExemptionStatus(username, password)
    } else {
      throw new Error(result.message || '알 수 없는 오류')
    }
  } catch (error) {
    console.error('Error using exemption:', error)
    alert('구제권 사용에 실패했습니다. 다시 시도해주세요.')
    btnEl.disabled = false
    btnEl.textContent = '🛡️ 구제권 사용하기'
  }
}

