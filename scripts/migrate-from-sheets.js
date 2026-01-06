#!/usr/bin/env node

/**
 * Google Sheets → Supabase 데이터 마이그레이션 스크립트
 * 
 * 사용 방법:
 * 1. Google Sheets에서 CSV 다운로드:
 *    - "사용자목록" 시트 → users.csv
 *    - "인증기록" 시트 → checkins.csv
 * 
 * 2. 이 스크립트 실행:
 *    node migrate-from-sheets.js
 * 
 * 필요한 환경변수:
 *  - VITE_SUPABASE_URL
 *  - VITE_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다!')
  console.error('VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// ========================================
// CSV 파일 읽기
// ========================================

function readCSV(filename) {
  try {
    const filePath = path.join(process.cwd(), filename)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    })
  } catch (error) {
    console.error(`❌ ${filename} 파일을 읽을 수 없습니다:`, error.message)
    return null
  }
}

// ========================================
// 사용자 마이그레이션
// ========================================

async function migrateUsers() {
  console.log('\n📥 사용자 데이터 마이그레이션 시작...')
  
  const users = readCSV('users.csv')
  
  if (!users) {
    console.log('⚠️  users.csv 파일이 없습니다. 건너뜁니다.')
    return
  }
  
  console.log(`📊 총 ${users.length}명의 사용자를 마이그레이션합니다...`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const user of users) {
    try {
      // CSV 컬럼명: 사용자명, 비밀번호, 등록일시
      const username = user['사용자명'] || user['username']
      const password = String(user['비밀번호'] || user['password']).replace(/^'/, '')
      
      if (!username || !password) {
        console.log(`⚠️  잘못된 데이터: ${JSON.stringify(user)}`)
        errorCount++
        continue
      }
      
      // 중복 체크
      const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()
      
      if (existing) {
        console.log(`⏭️  이미 존재: ${username}`)
        continue
      }
      
      // 사용자 추가
      const { error } = await supabase
        .from('users')
        .insert([{ username, password }])
      
      if (error) throw error
      
      console.log(`✅ ${username}`)
      successCount++
    } catch (error) {
      console.error(`❌ 실패: ${user['사용자명'] || user['username']}`, error.message)
      errorCount++
    }
  }
  
  console.log(`\n📊 사용자 마이그레이션 완료: ${successCount}명 성공, ${errorCount}명 실패`)
}

// ========================================
// 인증 기록 마이그레이션
// ========================================

async function migrateCheckins() {
  console.log('\n📥 인증 기록 마이그레이션 시작...')
  
  const checkins = readCSV('checkins.csv')
  
  if (!checkins) {
    console.log('⚠️  checkins.csv 파일이 없습니다. 건너뜁니다.')
    return
  }
  
  console.log(`📊 총 ${checkins.length}개의 인증 기록을 마이그레이션합니다...`)
  
  // 모든 사용자 ID 가져오기 (매핑용)
  const { data: users } = await supabase
    .from('users')
    .select('id, username')
  
  const userMap = {}
  users.forEach(user => {
    userMap[user.username] = user.id
  })
  
  let successCount = 0
  let errorCount = 0
  
  for (const checkin of checkins) {
    try {
      // CSV 컬럼명: 타임스탬프, 날짜, 사용자명, 문제명
      const username = checkin['사용자명'] || checkin['username']
      const date = String(checkin['날짜'] || checkin['date']).replace(/^'/, '')
      const problem = checkin['문제명'] || checkin['problem'] || '미입력'
      const timestamp = checkin['타임스탬프'] || checkin['timestamp']
      
      if (!username || !date) {
        console.log(`⚠️  잘못된 데이터: ${JSON.stringify(checkin)}`)
        errorCount++
        continue
      }
      
      const userId = userMap[username]
      
      if (!userId) {
        console.log(`⚠️  사용자를 찾을 수 없음: ${username}`)
        errorCount++
        continue
      }
      
      // 중복 체크
      const { data: existing } = await supabase
        .from('checkins')
        .select('id')
        .eq('username', username)
        .eq('date', date)
        .single()
      
      if (existing) {
        console.log(`⏭️  이미 존재: ${username} - ${date}`)
        continue
      }
      
      // 인증 기록 추가
      const { error } = await supabase
        .from('checkins')
        .insert([{
          user_id: userId,
          username,
          date,
          problem,
          created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
        }])
      
      if (error) throw error
      
      console.log(`✅ ${username} - ${date}`)
      successCount++
    } catch (error) {
      console.error(`❌ 실패: ${checkin['사용자명']} - ${checkin['날짜']}`, error.message)
      errorCount++
    }
  }
  
  console.log(`\n📊 인증 기록 마이그레이션 완료: ${successCount}개 성공, ${errorCount}개 실패`)
}

// ========================================
// 메인
// ========================================

async function main() {
  console.log('🚀 Google Sheets → Supabase 데이터 마이그레이션')
  console.log('================================================\n')
  
  console.log(`📡 Supabase URL: ${supabaseUrl}`)
  
  await migrateUsers()
  await migrateCheckins()
  
  console.log('\n✅ 마이그레이션 완료!')
  console.log('\n다음 단계:')
  console.log('1. Supabase 대시보드에서 데이터 확인')
  console.log('2. npm run dev로 로컬 테스트')
  console.log('3. Vercel에 배포')
}

main().catch(error => {
  console.error('❌ 마이그레이션 실패:', error)
  process.exit(1)
})

