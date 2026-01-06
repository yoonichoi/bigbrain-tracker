// api/cron/generate-weekly-report.js
// Vercel Cron Job - Weekly Report Generation

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Vercel Cron 인증 확인
  const authHeader = req.headers.authorization
  
  // Vercel Cron은 자동으로 CRON_SECRET를 Bearer 토큰으로 전송
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('Unauthorized cron request')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Supabase 클라이언트 생성 (Service Role Key 사용)
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('Starting weekly report generation...')
    
    // Weekly report 생성 함수 호출
    const { data, error } = await supabase.rpc('generate_weekly_report')
    
    if (error) {
      console.error('Error generating report:', error)
      throw error
    }

    console.log('Weekly report generated successfully')
    
    return res.status(200).json({ 
      success: true, 
      message: 'Weekly report generated successfully',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Failed to generate weekly report:', error)
    return res.status(500).json({ 
      error: 'Failed to generate report',
      message: error.message 
    })
  }
}

