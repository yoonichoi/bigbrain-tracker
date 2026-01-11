// src/api.js
// Supabase API 호출 함수들

import { supabase } from './supabaseClient.js'

// 등록코드 가져오기
export const REGISTER_CODE = import.meta.env.VITE_REGISTER_CODE || 'YOUR_REGISTER_CODE_HERE'

// ========================================
// 사용자 관련 API
// ========================================

/**
 * 등록된 사용자 목록 가져오기
 */
export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .order('username')
    
    if (error) throw error
    
    return {
      users: data.map(user => user.username)
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return { users: [] }
  }
}

/**
 * 새 사용자 등록
 */
export async function registerUser(registerCode, username, password) {
  try {
    // 등록코드 검증
    if (registerCode !== REGISTER_CODE) {
      return {
        status: 'invalid_code',
        message: '등록코드가 올바르지 않습니다'
      }
    }
    
    // 중복 체크
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single()
    
    if (existingUser) {
      return {
        status: 'duplicate',
        message: '이미 등록된 사용자입니다'
      }
    }
    
    // 새 사용자 등록
    const { error } = await supabase
      .from('users')
      .insert([
        { username, password }
      ])
    
    if (error) throw error
    
    return {
      status: 'success',
      message: '등록 완료!'
    }
  } catch (error) {
    console.error('Error registering user:', error)
    return {
      status: 'error',
      message: error.message
    }
  }
}

/**
 * 사용자 인증 (비밀번호 확인)
 * @returns {Object} { exists: boolean, valid: boolean }
 */
export async function verifyUser(username, password) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('password')
      .eq('username', username)
      .single()
    
    // 유저가 없음
    if (error || !data) {
      return { exists: false, valid: false }
    }
    
    // 유저는 있지만 비밀번호 틀림
    const isPasswordCorrect = data.password === password
    return { exists: true, valid: isPasswordCorrect }
  } catch (error) {
    console.error('Error verifying user:', error)
    return { exists: false, valid: false }
  }
}

// ========================================
// 인증 관련 API
// ========================================

/**
 * 인증 기록 추가
 */
export async function checkin(username, password, date, problem) {
  try {
    // 1. 비밀번호 확인
    const authResult = await verifyUser(username, password)
    if (!authResult.exists) {
      return {
        status: 'user_not_found',
        message: '등록되지 않은 사용자입니다'
      }
    }
    if (!authResult.valid) {
      return {
        status: 'unauthorized',
        message: '비밀번호가 틀렸습니다'
      }
    }
    
    // 2. 중복 체크
    const { data: existing } = await supabase
      .from('checkins')
      .select('id')
      .eq('username', username)
      .eq('date', date)
      .single()
    
    if (existing) {
      return {
        status: 'duplicate',
        message: '이미 오늘 인증하셨습니다!'
      }
    }
    
    // 3. user_id 가져오기
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()
    
    // 4. 새 인증 추가
    const { error } = await supabase
      .from('checkins')
      .insert([
        {
          user_id: userData.id,
          username,
          date,
          problem: problem || '미입력'
        }
      ])
    
    if (error) throw error
    
    // 5. 총 인증 횟수 계산
    const { count } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('username', username)
    
    return {
      status: 'success',
      message: '인증 완료!',
      totalCount: count
    }
  } catch (error) {
    console.error('Error checking in:', error)
    return {
      status: 'error',
      message: error.message
    }
  }
}

/**
 * 사용자 통계 조회
 */
export async function getUserStats(username, password) {
  try {
    // 비밀번호 확인
    if (password) {
      const authResult = await verifyUser(username, password)
      if (!authResult.exists) {
        return {
          status: 'user_not_found',
          message: '등록되지 않은 사용자입니다'
        }
      }
      if (!authResult.valid) {
        return {
          status: 'unauthorized',
          message: '비밀번호가 틀렸습니다'
        }
      }
    }
    
    // 인증 기록 조회
    const { data, error } = await supabase
      .from('checkins')
      .select('date, problem, created_at')
      .eq('username', username)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      return {
        count: 0,
        history: []
      }
    }
    
    // 총 개수 조회
    const { count } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('username', username)
    
    return {
      count: count || 0,
      lastDate: data[0]?.date || '',
      history: data.map(item => ({
        date: item.date,
        problem: item.problem,
        timestamp: item.created_at
      }))
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {
      count: 0,
      history: []
    }
  }
}

/**
 * 문제 이름 수정
 */
export async function updateProblem(username, password, timestamp, newProblem) {
  try {
    // 1. 비밀번호 확인
    const authResult = await verifyUser(username, password)
    if (!authResult.exists) {
      return {
        status: 'user_not_found',
        message: '등록되지 않은 사용자입니다'
      }
    }
    if (!authResult.valid) {
      return {
        status: 'unauthorized',
        message: '비밀번호가 틀렸습니다'
      }
    }
    
    // 2. 해당 기록 업데이트
    const { error } = await supabase
      .from('checkins')
      .update({ problem: newProblem })
      .eq('username', username)
      .eq('created_at', timestamp)
    
    if (error) throw error
    
    return {
      status: 'success',
      message: '문제 이름이 수정되었습니다'
    }
  } catch (error) {
    console.error('Error updating problem:', error)
    return {
      status: 'error',
      message: error.message
    }
  }
}

// ========================================
// 관리자 API
// ========================================

/**
 * 전체 통계 조회 (관리자용)
 */
export async function getAdminStats() {
  try {
    // 총 사용자 수
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    // 총 인증 수
    const { count: totalCheckins } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
    
    // 모든 날짜 목록 (오늘 인증 수 계산용)
    const { data: allCheckins } = await supabase
      .from('checkins')
      .select('date')
    
    const allDates = allCheckins?.map(c => c.date) || []
    
    return {
      totalUsers: totalUsers || 0,
      totalCheckins: totalCheckins || 0,
      allDates,
      dropoutCount: 0 // Weekly report 제거
    }
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return {
      totalUsers: 0,
      totalCheckins: 0,
      allDates: [],
      dropoutCount: 0
    }
  }
}

/**
 * 사용자별 통계 조회 (관리자용)
 */
export async function getUsersWithStats() {
  try {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, created_at')
      .order('username')
    
    if (usersError) throw usersError
    
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const { data: checkins } = await supabase
          .from('checkins')
          .select('date, created_at')
          .eq('username', user.username)
          .order('created_at', { ascending: false })
          .limit(1)
        
        const { count } = await supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true })
          .eq('username', user.username)
        
        return {
          username: user.username,
          registeredDate: user.created_at,
          checkinCount: count || 0,
          lastCheckin: checkins?.[0]?.date || ''
        }
      })
    )
    
    return {
      users: usersWithStats
    }
  } catch (error) {
    console.error('Error fetching users with stats:', error)
    return { users: [] }
  }
}

/**
 * 최근 인증 기록 조회 (관리자용)
 */
export async function getRecentRecords() {
  try {
    const { data, error } = await supabase
      .from('checkins')
      .select('date, username, problem, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    
    return {
      records: data.map(record => ({
        timestamp: record.created_at,
        date: record.date,
        username: record.username,
        problem: record.problem
      }))
    }
  } catch (error) {
    console.error('Error fetching recent records:', error)
    return { records: [] }
  }
}

/**
 * 사용자 삭제 (관리자용)
 */
export async function deleteUser(username) {
  try {
    // Cascade delete will automatically remove all checkins
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('username', username)
    
    if (error) throw error
    
    return {
      status: 'success',
      message: '사용자가 삭제되었습니다'
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    return {
      status: 'error',
      message: error.message
    }
  }
}

// ========================================
// Exemption (구제권) API
// ========================================

/**
 * 현재 주의 월~일요일 범위 계산 (사용자 로컬 타임존 기준)
 * @param {Date} today - 기준 날짜
 * @returns {{ weekStart: string, weekEnd: string }} YYYY-MM-DD 형식
 */
function getCurrentWeekRange(today = new Date()) {
  const day = today.getDay() // 0=일, 1=월, ...
  const diff = day === 0 ? -6 : 1 - day // 일요일이면 -6, 아니면 1-day

  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  // YYYY-MM-DD 형식으로 변환
  const formatDate = (d) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    weekStart: formatDate(monday),
    weekEnd: formatDate(sunday)
  }
}

/**
 * 이번 달 구제 사용 가능 여부 확인
 */
export async function canUseExemption(username, password) {
  try {
    // 1. 비밀번호 확인
    const authResult = await verifyUser(username, password)
    if (!authResult.exists) {
      return {
        status: 'user_not_found',
        message: '등록되지 않은 사용자입니다'
      }
    }
    if (!authResult.valid) {
      return {
        status: 'unauthorized',
        message: '비밀번호가 틀렸습니다'
      }
    }

    // 2. 현재 주 범위 계산 (사용자 로컬 타임존)
    const { weekStart, weekEnd } = getCurrentWeekRange()

    // 3. 이번 달 1일과 말일 계산
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // 4. 이번 달에 사용한 구제 기록 조회
    const { data, error } = await supabase
      .from('exemptions')
      .select('*')
      .eq('username', username)
      .gte('used_at', monthStart.toISOString())
      .lte('used_at', monthEnd.toISOString())
      .order('used_at', { ascending: false })
      .limit(1)

    if (error) throw error

    const hasUsedThisMonth = data && data.length > 0
    const usedRecord = hasUsedThisMonth ? data[0] : null

    return {
      status: 'success',
      canUse: !hasUsedThisMonth,
      usedRecord: usedRecord,
      currentWeek: { weekStart, weekEnd }
    }
  } catch (error) {
    console.error('Error checking exemption:', error)
    return {
      status: 'error',
      message: error.message
    }
  }
}

/**
 * 구제권 사용하기
 */
export async function useExemption(username, password, weekStart, weekEnd) {
  try {
    // 1. 비밀번호 확인
    const authResult = await verifyUser(username, password)
    if (!authResult.exists) {
      return {
        status: 'user_not_found',
        message: '등록되지 않은 사용자입니다'
      }
    }
    if (!authResult.valid) {
      return {
        status: 'unauthorized',
        message: '비밀번호가 틀렸습니다'
      }
    }

    // 2. 이번 달 사용 가능 여부 재확인
    const checkResult = await canUseExemption(username, password)
    if (checkResult.status !== 'success') {
      return checkResult
    }
    if (!checkResult.canUse) {
      return {
        status: 'already_used',
        message: '이번 달 구제권을 이미 사용했습니다'
      }
    }

    // 3. user_id 가져오기
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    // 4. 구제 기록 삽입
    const { error } = await supabase
      .from('exemptions')
      .insert([{
        user_id: userData.id,
        username: username,
        applied_week_start: weekStart,
        applied_week_end: weekEnd
      }])

    if (error) throw error

    return {
      status: 'success',
      message: '구제권이 사용되었습니다',
      appliedWeek: { weekStart, weekEnd }
    }
  } catch (error) {
    console.error('Error using exemption:', error)
    return {
      status: 'error',
      message: error.message
    }
  }
}

/**
 * 특정 주의 구제 사용자 목록 조회 (admin용)
 */
export async function getExemptionsForWeek(weekStart, weekEnd) {
  try {
    const { data, error } = await supabase
      .from('exemptions')
      .select('username, used_at')
      .eq('applied_week_start', weekStart)
      .eq('applied_week_end', weekEnd)

    if (error) throw error

    return {
      status: 'success',
      exemptions: data || []
    }
  } catch (error) {
    console.error('Error fetching exemptions:', error)
    return {
      status: 'error',
      exemptions: []
    }
  }
}

// ========================================
// Weekly Reports API
// ========================================

/**
 * 가장 최근 주간 리포트 가져오기
 */
export async function getLatestWeeklyReport() {
  try {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      // 리포트가 없을 수 있음
      if (error.code === 'PGRST116') {
        return {
          status: 'success',
          report: null
        }
      }
      throw error
    }
    
    return {
      status: 'success',
      report: data
    }
  } catch (error) {
    console.error('Error fetching latest report:', error)
    return {
      status: 'error',
      message: error.message,
      report: null
    }
  }
}

/**
 * 수동으로 주간 리포트 생성 (관리자용)
 * @param {boolean} isThisWeek - true면 이번 주, false면 지난 주
 */
export async function generateWeeklyReportManually(isThisWeek = false) {
  try {
    // 이번 주 리포트를 생성하는 경우, 직접 계산해서 생성
    if (isThisWeek) {
      // EST 기준 이번 주 계산
      const now = new Date()
      const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
      
      // 이번 주 월요일 계산
      const dayOfWeek = estDate.getDay() // 0=일, 1=월, ...
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // 월요일로 이동
      const monday = new Date(estDate)
      monday.setDate(estDate.getDate() + diff)
      monday.setHours(0, 0, 0, 0)
      
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      
      const weekStart = monday.toISOString().split('T')[0]
      const weekEnd = sunday.toISOString().split('T')[0]
      
      console.log('이번 주 리포트 생성:', weekStart, '~', weekEnd)
      
      // 수동으로 리포트 데이터 생성
      return await generateReportForWeek(weekStart, weekEnd)
    } else {
      // 지난 주 리포트 (기존 함수 사용)
      const { error } = await supabase
        .rpc('generate_weekly_report')
      
      if (error) throw error
      
      return {
        status: 'success',
        message: '지난 주 리포트가 생성되었습니다'
      }
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return {
      status: 'error',
      message: error.message
    }
  }
}

/**
 * 특정 주의 리포트 생성 (클라이언트 사이드)
 */
async function generateReportForWeek(weekStart, weekEnd) {
  try {
    // 모든 사용자 가져오기
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username')
      .order('username')
    
    if (usersError) throw usersError
    
    const reportUsers = []
    
    for (const user of users) {
      // 해당 주의 인증 기록 가져오기
      const { data: checkins } = await supabase
        .from('checkins')
        .select('date')
        .eq('username', user.username)
      
      // date는 'MM/DD' 형식이므로 파싱해서 비교
      const weekStartDate = new Date(weekStart + 'T00:00:00')
      const weekEndDate = new Date(weekEnd + 'T00:00:00')
      
      const validDates = new Set()
      
      checkins?.forEach(c => {
        const [month, day] = c.date.split('/').map(Number)
        const checkDate = new Date(weekStartDate.getFullYear(), month - 1, day)
        
        if (checkDate >= weekStartDate && checkDate <= weekEndDate) {
          validDates.add(c.date)
        }
      })
      
      const count = validDates.size
      const dates = Array.from(validDates).sort().join(', ') || '인증 없음'
      const missing = 7 - count
      const status = missing <= 1 ? '✅ 통과' : `⚠️ ${missing}일 누락`
      
      reportUsers.push({
        username: user.username,
        count,
        dates,
        missing,
        status
      })
    }
    
    // 리포트 저장
    const reportData = {
      users: reportUsers,
      generated_at: new Date().toISOString()
    }
    
    const { error: insertError } = await supabase
      .from('weekly_reports')
      .upsert({
        week_start: weekStart,
        week_end: weekEnd,
        report_data: reportData,
        report_type: 'custom'
      }, {
        onConflict: 'week_start,week_end'
      })
    
    if (insertError) throw insertError
    
    return {
      status: 'success',
      message: '이번 주 리포트가 생성되었습니다'
    }
  } catch (error) {
    console.error('Error in generateReportForWeek:', error)
    throw error
  }
}

/**
 * Official 주간 리포트 가져오기 (report_type='official', week_start 기준 최신)
 */
export async function getOfficialWeeklyReport() {
  try {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('report_type', 'official')
      .order('week_start', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { status: 'success', report: null }
      }
      throw error
    }
    
    return { status: 'success', report: data }
  } catch (error) {
    console.error('Error fetching official report:', error)
    return { status: 'error', message: error.message, report: null }
  }
}

/**
 * Custom 주간 리포트 가져오기 (report_type='custom', created_at 기준 최신)
 */
export async function getCustomWeeklyReport() {
  try {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('report_type', 'custom')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return { status: 'success', report: null }
      }
      throw error
    }
    
    return { status: 'success', report: data }
  } catch (error) {
    console.error('Error fetching custom report:', error)
    return { status: 'error', message: error.message, report: null }
  }
}