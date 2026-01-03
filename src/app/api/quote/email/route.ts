import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      firstName,
      lastName,
      total,
      // These are received but not used while email is disabled
      // vehicle, measurements, motorcycle, selectedModel, extension,
      // boltlessKit, tiedown, service, delivery, subtotal, salesTax, processingFee,
    } = body

    // Temporary: Log quote email instead of sending (staging deployment fix)
    console.log('Quote email disabled for staging deployment', {
      to: email,
      customer: `${firstName} ${lastName}`,
      total: total
    })

    // Return success to avoid breaking the frontend
    return NextResponse.json({
      success: true,
      messageId: 'staging-disabled',
      message: 'Email functionality temporarily disabled on staging'
    })
  } catch (error) {
    console.error('Error processing quote:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}