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
 */
export async function verifyUser(username, password) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('password')
      .eq('username', username)
      .single()
    
    if (error || !data) return false
    
    return data.password === password
  } catch (error) {
    console.error('Error verifying user:', error)
    return false
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
    const isValid = await verifyUser(username, password)
    if (!isValid) {
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
      const isValid = await verifyUser(username, password)
      if (!isValid) {
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
    const isValid = await verifyUser(username, password)
    if (!isValid) {
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
      .order('week_start', { ascending: false })
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
 */
export async function generateWeeklyReportManually() {
  try {
    const { error } = await supabase
      .rpc('generate_weekly_report')
    
    if (error) throw error
    
    return {
      status: 'success',
      message: '주간 리포트가 생성되었습니다'
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return {
      status: 'error',
      message: error.message
    }
  }
}

