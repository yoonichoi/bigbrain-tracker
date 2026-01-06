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

// 수동으로 주간 리포트 생성
window.generateReport = async function(e) {
  e.stopPropagation() // 토글 방지
  
  if (!confirm('주간 리포트를 수동으로 생성하시겠습니까?\n\n현재 주의 데이터로 리포트가 생성됩니다.')) {
    return
  }
  
  const btn = e.target
  const originalText = btn.textContent
  
  btn.disabled = true
  btn.textContent = '⏳ 생성 중...'
  
  try {
    const result = await API.generateWeeklyReportManually()
    
    if (result.status === 'success') {
      alert('✅ 주간 리포트가 생성되었습니다!')
      
      // 리포트 새로고침
      weeklyReportLoaded = false
      const content = document.getElementById('weekly-report-content')
      if (content.style.display !== 'none') {
        await loadWeeklyReport()
        weeklyReportLoaded = true
      }
    } else {
      throw new Error(result.message)
    }
  } catch (error) {
    console.error('Error generating report:', error)
    alert('❌ 리포트 생성 실패!\n\n' + error.message)
  } finally {
    btn.disabled = false
    btn.textContent = originalText
  }
}

// ========================================
// Weekly Report
// ========================================

async function loadWeeklyReport() {
  const loading = document.getElementById('report-loading')
  const tableContainer = document.getElementById('report-table-container')
  const dropoutWarning = document.getElementById('dropout-warning')
  
  loading.style.display = 'block'
  tableContainer.style.display = 'none'
  dropoutWarning.style.display = 'none'
  
  try {
    // 가장 최근 주간 리포트 가져오기
    const result = await API.getLatestWeeklyReport()
    
    if (result.status === 'error' || !result.report) {
      loading.textContent = '생성된 주간 리포트가 없습니다. 리포트는 매주 월요일 3AM EST에 자동 생성됩니다.'
      return
    }
    
    const report = result.report
    const reportData = report.report_data.users
    
    // 주간 범위 표시
    const weekRange = `(${formatDate(report.week_start)} ~ ${formatDate(report.week_end)})`
    document.getElementById('report-week-range').textContent = weekRange
    
    // 방출 위기 유저 표시
    const dropouts = reportData.filter(user => user.missing >= 2)
    if (dropouts.length > 0) {
      const dropoutNames = dropouts.map(u => `${u.username} (${u.missing}일 누락)`).join(', ')
      document.getElementById('dropout-list').textContent = dropoutNames
      dropoutWarning.style.display = 'block'
    }
    
    // 테이블 렌더링
    renderWeeklyReport(reportData)
    
    loading.style.display = 'none'
    tableContainer.style.display = 'block'
  } catch (error) {
    console.error('Error loading weekly report:', error)
    loading.textContent = '리포트 로드 실패. 다시 시도해주세요.'
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
function renderWeeklyReport(reportData) {
  const tbody = document.getElementById('report-tbody')
  
  if (reportData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">등록된 사용자가 없습니다</td></tr>'
    return
  }
  
  tbody.innerHTML = reportData.map(user => {
    // 행 색상 (방출 위기는 빨간색)
    const rowClass = user.missing >= 2 ? 'danger-row' : user.missing <= 1 ? 'success-row' : ''
    
    return `
      <tr class="${rowClass}">
        <td><strong>${user.username}</strong></td>
        <td>${user.count}회</td>
        <td style="font-size: 0.85em;">${user.dates || '인증 없음'}</td>
        <td>${user.missing}일</td>
        <td><strong>${user.status}</strong></td>
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
    
    const tbody = document.getElementById('users-tbody')
    
    if (!result.users || result.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">등록된 사용자가 없습니다</td></tr>'
      return
    }
    
    tbody.innerHTML = result.users.map(user => `
      <tr>
        <td><strong>${user.username}</strong></td>
        <td>${user.checkinCount}회</td>
        <td>${user.lastCheckin || '-'}</td>
        <td>${new Date(user.registeredDate).toLocaleDateString('ko-KR')}</td>
        <td>
          <button class="delete-btn" onclick="window.confirmDelete('${user.username}')">삭제</button>
        </td>
      </tr>
    `).join('')
  } catch (error) {
    console.error('Error loading users:', error)
    document.getElementById('users-tbody').innerHTML = '<tr><td colspan="5">데이터 로드 실패</td></tr>'
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

