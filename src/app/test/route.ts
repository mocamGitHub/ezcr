import { NextResponse } from 'next/server'

export async function GET() {
  console.log('Test endpoint hit!')
  return NextResponse.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
  })
}

export const dynamic = 'force-dynamic'