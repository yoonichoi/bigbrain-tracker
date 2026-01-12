// src/admin.js
// 말랑말랑 리트코드 - Admin Dashboard

import './admin-style.css'
import * as API from './api.js'
import { supabase } from './supabaseClient.js'

// 관리자 비밀번호 (환경변수)
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

// ========================================
// 초기화 및 인증
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // 로그인 상태 확인
  checkAuth()
  
  // 로그인 폼 이벤트
  const loginForm = document.getElementById('admin-login-form')
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin)
  }
  
  console.log('%c🧠 말랑말랑 리트코드 - 관리자 대시보드', 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 16px; font-weight: bold; padding: 15px 30px; border-radius: 5px')
})

// 로그인 상태 확인
function checkAuth() {
  const isLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true'
  
  if (isLoggedIn) {
    showDashboard()
  } else {
    showLogin()
  }
}

// 로그인 처리
async function handleLogin(e) {
  e.preventDefault()
  
  const password = document.getElementById('admin-password').value
  const loginBtn = document.getElementById('login-btn')
  const errorDiv = document.getElementById('login-error')
  
  loginBtn.disabled = true
  loginBtn.textContent = '확인 중...'
  errorDiv.style.display = 'none'
  
  // 디버깅
  console.log('입력한 비밀번호:', password)
  console.log('설정된 비밀번호:', ADMIN_PASSWORD)
  console.log('비밀번호 일치:', password === ADMIN_PASSWORD)
  
  // 비밀번호 확인
  if (password === ADMIN_PASSWORD) {
    // 로그인 성공
    console.log('✅ 로그인 성공!')
    sessionStorage.setItem('admin_logged_in', 'true')
    showDashboard()
  } else {
    // 로그인 실패
    console.log('❌ 로그인 실패!')
    errorDiv.textContent = '비밀번호가 틀렸습니다!'
    errorDiv.style.display = 'block'
    loginBtn.disabled = false
    loginBtn.textContent = '로그인'
    
    // 비밀번호 필드 클리어
    document.getElementById('admin-password').value = ''
    document.getElementById('admin-password').focus()
  }
}

// 로그아웃
window.logout = function() {
  if (confirm('로그아웃 하시겠습니까?')) {
    sessionStorage.removeItem('admin_logged_in')
    location.reload()
  }
}

// 로그인 화면 표시
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex'
  document.getElementById('dashboard-screen').style.display = 'none'
}

// 대시보드 표시
function showDashboard() {
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('dashboard-screen').style.display = 'block'
  
  // 대시보드 데이터 로드
  loadDashboard()
}

// ========================================
// Weekly Report Toggle
// ========================================

let weeklyReportLoaded = false

window.toggleWeeklyReport = async function() {
  const content = document.getElementById('weekly-report-content')
  const btn = document.getElementById('expand-btn')
  
  if (content.style.display === 'none') {
    // 펼치기
    content.style.display = 'block'
    btn.classList.add('expanded')
    
    // 처음 펼칠 때만 로드
    if (!weeklyReportLoaded) {
      await loadWeeklyReport()
      weeklyReportLoaded = true
    }
  } else {
    // 접기
    content.style.display = 'none'
    btn.classList.remove('expanded')
  }
}

// 주차 선택 UI 표시
window.showWeekSelector = function(e) {
  e.stopPropagation() // 토글 방지
  
  const selector = document.getElementById('week-selector')
  
  // 이번 주와 지난 주 날짜 계산
  const now = new Date()
  const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  
  // 이번 주 (월요일~일요일)
  const thisWeekDayOfWeek = estDate.getDay()
  const thisWeekDiff = thisWeekDayOfWeek === 0 ? -6 : 1 - thisWeekDayOfWeek
  const thisMonday = new Date(estDate)
  thisMonday.setDate(estDate.getDate() + thisWeekDiff)
  const thisSunday = new Date(thisMonday)
  thisSunday.setDate(thisMonday.getDate() + 6)
  
  // 지난 주
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)
  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  
  // 날짜 포맷팅
  const formatDateShort = (date) => `${date.getMonth() + 1}/${date.getDate()}`
  
  document.getElementById('this-week-dates').textContent = 
    `${formatDateShort(thisMonday)} ~ ${formatDateShort(thisSunday)}`
  document.getElementById('last-week-dates').textContent = 
    `${formatDateShort(lastMonday)} ~ ${formatDateShort(lastSunday)}`
  
  selector.style.display = 'block'
}

window.hideWeekSelector = function() {
  document.getElementById('week-selector').style.display = 'none'
}

// 선택한 주차의 리포트 생성
window.generateReportForWeek = async function(isThisWeek) {
  const btn = isThisWeek ? document.getElementById('btn-this-week') : document.getElementById('btn-last-week')
  const originalHTML = btn.innerHTML
  
  btn.disabled = true
  btn.innerHTML = '<div style="font-weight: bold;">⏳ 생성 중...</div>'
  
  try {
    console.log(`리포트 생성 시작: ${isThisWeek ? '이번 주' : '지난 주'}`)
    const result = await API.generateWeeklyReportManually(isThisWeek)
    console.log('API 응답:', result)
    
    if (result.status === 'success') {
      alert(`✅ ${isThisWeek ? '이번 주' : '지난 주'} 리포트가 생성되었습니다!`)
      
      // UI 숨기기
      hideWeekSelector()
      
      // 리포트 섹션 펼치기
      const content = document.getElementById('weekly-report-content')
      content.style.display = 'block'
      document.getElementById('expand-btn').classList.add('expanded')
      
      // Custom 탭으로 전환하고 새로고침
      switchReportTab('custom')
    } else {
      throw new Error(result.message || '알 수 없는 오류')
    }
  } catch (error) {
    console.error('❌ Error:', error)
    alert('❌ 리포트 생성 실패!\n\n' + (error.message || error))
  } finally {
    btn.disabled = false
    btn.innerHTML = originalHTML
  }
}

// ========================================
// Weekly Report - Tab System
// ========================================

let currentReportTab = 'official'
let officialReportLoaded = false
let customReportLoaded = false

// 탭 전환
window.switchReportTab = async function(tabType) {
  currentReportTab = tabType
  
  // 탭 버튼 활성화 상태 변경
  document.querySelectorAll('.report-tab').forEach(tab => {
    if (tab.getAttribute('data-report-type') === tabType) {
      tab.classList.add('active')
    } else {
      tab.classList.remove('active')
    }
  })
  
  // 리포트 뷰 전환
  if (tabType === 'official') {
    document.getElementById('official-report').style.display = 'block'
    document.getElementById('custom-report').style.display = 'none'
    
    if (!officialReportLoaded) {
      await loadOfficialReport()
      officialReportLoaded = true
    }
  } else {
    document.getElementById('official-report').style.display = 'none'
    document.getElementById('custom-report').style.display = 'block'
    
    if (!customReportLoaded) {
      await loadCustomReport()
      customReportLoaded = true
    }
  }
}

async function loadWeeklyReport() {
  // 초기 로드: Official 탭 표시
  await switchReportTab('official')
}

// ========================================
// Official Report
// ========================================

async function loadOfficialReport() {
  const loading = document.getElementById('official-loading')
  const tableContainer = document.getElementById('official-table-container')
  const dropoutWarning = document.getElementById('official-dropout-warning')

  loading.style.display = 'block'
  tableContainer.style.display = 'none'
  dropoutWarning.style.display = 'none'

  try {
    const result = await API.getOfficialWeeklyReport()

    if (result.status === 'error' || !result.report) {
      loading.textContent = 'Official 리포트가 없습니다. 매주 월요일 3AM EST에 자동 생성됩니다.'
      return
    }

    const report = result.report
    const reportData = report.report_data.users

    // 해당 주의 구제 사용자 목록 조회
    const exemptionResult = await API.getExemptionsForWeek(report.week_start, report.week_end)
    const exemptedUsernames = exemptionResult.exemptions.map(e => e.username)

    // 주간 범위 표시
    const weekRange = `(${formatDate(report.week_start)} ~ ${formatDate(report.week_end)})`
    document.getElementById('official-week-range').textContent = weekRange

    // 방출 위기 유저 표시
    displayDropoutWarning('official', reportData, exemptedUsernames)

    // 테이블 렌더링
    renderWeeklyReport('official', reportData, exemptedUsernames)

    loading.style.display = 'none'
    tableContainer.style.display = 'block'
  } catch (error) {
    console.error('Error loading official report:', error)
    loading.textContent = '리포트 로드 실패. 다시 시도해주세요.'
  }
}

// ========================================
// Custom Report
// ========================================

async function loadCustomReport() {
  const loading = document.getElementById('custom-loading')
  const tableContainer = document.getElementById('custom-table-container')
  const dropoutWarning = document.getElementById('custom-dropout-warning')

  loading.style.display = 'block'
  tableContainer.style.display = 'none'
  dropoutWarning.style.display = 'none'

  try {
    const result = await API.getCustomWeeklyReport()

    if (result.status === 'error' || !result.report) {
      loading.textContent = 'Custom 리포트가 없습니다. "🔄 리포트 생성" 버튼으로 생성하세요.'
      return
    }

    const report = result.report
    const reportData = report.report_data.users

    // 해당 주의 구제 사용자 목록 조회
    const exemptionResult = await API.getExemptionsForWeek(report.week_start, report.week_end)
    const exemptedUsernames = exemptionResult.exemptions.map(e => e.username)

    // 주간 범위 표시
    const weekRange = `(${formatDate(report.week_start)} ~ ${formatDate(report.week_end)})`
    document.getElementById('custom-week-range').textContent = weekRange
    
    // Created at 표시 (EST 기준)
    const createdAt = new Date(report.created_at)
    const estTime = createdAt.toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
    document.getElementById('custom-created-at').textContent = estTime + ' EST'

    // 방출 위기 유저 표시
    displayDropoutWarning('custom', reportData, exemptedUsernames)

    // 테이블 렌더링
    renderWeeklyReport('custom', reportData, exemptedUsernames)

    loading.style.display = 'none'
    tableContainer.style.display = 'block'
  } catch (error) {
    console.error('Error loading custom report:', error)
    loading.textContent = '리포트 로드 실패. 다시 시도해주세요.'
  }
}

// ========================================
// Helper Functions
// ========================================

// 방출 위기 유저 표시
function displayDropoutWarning(reportType, reportData, exemptedUsernames) {
  const dropoutWarning = document.getElementById(`${reportType}-dropout-warning`)
  const dropoutList = document.getElementById(`${reportType}-dropout-list`)
  const exemptedInfo = document.getElementById(`${reportType}-exempted-info`)
  const exemptedList = document.getElementById(`${reportType}-exempted-list`)

  const dropouts = reportData.filter(user => user.missing >= 2 && !exemptedUsernames.includes(user.username))
  const exemptedDropouts = reportData.filter(user => user.missing >= 2 && exemptedUsernames.includes(user.username))

  if (dropouts.length > 0 || exemptedDropouts.length > 0) {
    // 방출 위기자 표시
    if (dropouts.length > 0) {
      dropoutList.textContent = dropouts.map(u => `${u.username} (${u.missing}일 누락)`).join(', ')
      dropoutWarning.style.display = 'block'
    }
    
    // 구제권 사용자 표시 (별도 섹션)
    if (exemptedDropouts.length > 0) {
      exemptedList.textContent = exemptedDropouts.map(u => `${u.username} (${u.missing}일 누락)`).join(', ')
      exemptedInfo.style.display = 'block'
      dropoutWarning.style.display = 'block'
    }
  }
}

// 날짜 포맷 (YYYY-MM-DD -> MM/DD)
function formatDate(dateStr) {
  // 타임존 이슈 방지: UTC로 파싱
  const date = new Date(dateStr + 'T00:00:00Z')
  const month = (date.getUTCMonth() + 1).toString()
  const day = date.getUTCDate().toString()
  return `${month}/${day}`
}

// 주간 리포트 테이블 렌더링
function renderWeeklyReport(reportType, reportData, exemptedUsernames = []) {
  const tbody = document.getElementById(`${reportType}-tbody`)

  if (reportData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">등록된 사용자가 없습니다</td></tr>'
    return
  }

  tbody.innerHTML = reportData.map(user => {
    const isExempted = exemptedUsernames.includes(user.username)

    // 행 색상 결정
    let rowClass = ''
    let status = user.status

    if (user.missing >= 2) {
      if (isExempted) {
        // 구제 사용자: 파란색
        rowClass = 'exempted-row'
        status = `🛡️ ${user.missing}일 누락 (구제)`
      } else {
        // 방출 위기: 빨간색
        rowClass = 'danger-row'
      }
    } else if (user.missing <= 1) {
      // 통과: 초록색
      rowClass = 'success-row'
    }

    return `
      <tr class="${rowClass}">
        <td><strong>${user.username}</strong></td>
        <td>${user.count}회</td>
        <td style="font-size: 0.85em;">${user.dates || '인증 없음'}</td>
        <td>${user.missing}일</td>
        <td><strong>${status}</strong></td>
      </tr>
    `
  }).join('')
}

async function loadDashboard() {
  await Promise.all([
    loadStats(),
    loadUsers(),
    loadRecentRecords()
  ])
}

// ========================================
// 전체 통계
// ========================================

async function loadStats() {
  try {
    const result = await API.getAdminStats()
    
    document.getElementById('total-users').textContent = result.totalUsers || 0
    document.getElementById('total-checkins').textContent = result.totalCheckins || 0
    
    // 오늘 인증 수 계산
    const today = new Date()
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`
    const todayCount = result.allDates.filter(date => date === todayStr).length
    
    document.getElementById('today-checkins').textContent = todayCount
  } catch (error) {
    console.error('Error loading stats:', error)
  }
}

// ========================================
// 사용자 목록
// ========================================

async function loadUsers() {
  try {
    const result = await API.getUsersWithStats()
    
    // Official 리포트 가져오기 (주간 상태 확인용)
    const reportResult = await API.getOfficialWeeklyReport()
    const weeklyStatus = {}
    
    if (reportResult.status === 'success' && reportResult.report) {
      const reportData = reportResult.report.report_data.users
      
      // 구제권 사용자 조회
      const exemptionResult = await API.getExemptionsForWeek(
        reportResult.report.week_start, 
        reportResult.report.week_end
      )
      const exemptedUsernames = exemptionResult.exemptions.map(e => e.username)
      
      // 각 사용자의 주간 상태 매핑 (renderWeeklyReport와 동일한 로직)
      reportData.forEach(user => {
        const isExempted = exemptedUsernames.includes(user.username)
        const checkinDays = user.count || 0
        
        if (user.missing >= 2) {
          if (isExempted) {
            // 구제권 사용함
            weeklyStatus[user.username] = {
              text: `🛡️ 구제 (${checkinDays}일)`,
              class: 'status-exempted'
            }
          } else {
            // 방출 위기
            weeklyStatus[user.username] = {
              text: `⚠️ 방출 (${checkinDays}일)`,
              class: 'status-dropout'
            }
          }
        } else if (user.missing <= 1) {
          // 통과
          weeklyStatus[user.username] = {
            text: `✅ 통과 (${checkinDays}일)`,
            class: 'status-pass'
          }
        }
      })
    }
    
    const tbody = document.getElementById('users-tbody')
    
    if (!result.users || result.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">등록된 사용자가 없습니다</td></tr>'
      return
    }
    
    tbody.innerHTML = result.users.map(user => {
      const status = weeklyStatus[user.username] || { text: '-', class: 'status-none' }
      
      return `
      <tr>
        <td><strong>${user.username}</strong></td>
        <td>${user.checkinCount}회</td>
        <td>${user.lastCheckin || '-'}</td>
        <td><span class="weekly-status ${status.class}">${status.text}</span></td>
        <td>${new Date(user.registeredDate).toLocaleDateString('ko-KR')}</td>
        <td>
          <button class="delete-btn" onclick="window.confirmDelete('${user.username}')">삭제</button>
        </td>
      </tr>
      `
    }).join('')
  } catch (error) {
    console.error('Error loading users:', error)
    document.getElementById('users-tbody').innerHTML = '<tr><td colspan="6">데이터 로드 실패</td></tr>'
  }
}

// ========================================
// 최근 인증 기록
// ========================================

async function loadRecentRecords() {
  try {
    const result = await API.getRecentRecords()
    
    const tbody = document.getElementById('records-tbody')
    
    if (!result.records || result.records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">인증 기록이 없습니다</td></tr>'
      return
    }
    
    tbody.innerHTML = result.records.map(record => `
      <tr>
        <td><strong>${record.date}</strong></td>
        <td>${record.username}</td>
        <td>${record.problem}</td>
        <td>${new Date(record.timestamp).toLocaleString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}</td>
      </tr>
    `).join('')
  } catch (error) {
    console.error('Error loading records:', error)
    document.getElementById('records-tbody').innerHTML = '<tr><td colspan="4">데이터 로드 실패</td></tr>'
  }
}

// ========================================
// 사용자 삭제
// ========================================

window.confirmDelete = async function(username) {
  if (!confirm(`정말 "${username}" 사용자를 삭제하시겠습니까?\n\n모든 인증 기록도 함께 삭제됩니다.`)) {
    return
  }
  
  try {
    const result = await API.deleteUser(username)
    
    if (result.status === 'success') {
      alert(`✅ ${username} 사용자가 삭제되었습니다.`)
      loadDashboard() // 새로고침
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    alert('삭제 실패! 다시 시도해주세요.')
  }
}

