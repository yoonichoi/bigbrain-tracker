// src/admin.js
// 말랑말랑 리트코드 - Admin Dashboard

import './admin-style.css'
import * as API from './api.js'

// ========================================
// 초기화
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard()
  
  console.log('%c🧠 말랑말랑 리트코드 - 관리자 대시보드', 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 16px; font-weight: bold; padding: 15px 30px; border-radius: 5px')
})

// ========================================
// 대시보드 로드
// ========================================

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

