import { NextRequest, NextResponse } from 'next/server'
import { updateUserCurrency } from '@/lib/google/sheets'
import { CurrencyType } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const username = String(body.username || '').trim()
    const currency = String(body.currency || '').trim().toUpperCase() as CurrencyType

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    if (!['KRW', 'USD', 'VND'].includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency unit. Must be KRW, USD, or VND.' },
        { status: 400 }
      )
    }

    const success = await updateUserCurrency(username, currency)
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update currency in Google Sheets' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      username,
      currency,
    })
  } catch (err: any) {
    console.error('Error updating currency API:', err)
    return NextResponse.json(
      { error: err?.message || 'Server error while updating currency' },
      { status: 500 }
    )
  }
}
