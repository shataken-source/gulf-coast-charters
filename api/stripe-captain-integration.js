// =====================================================
// STRIPE CAPTAIN INTEGRATION
// =====================================================
// Stripe Connect for captain payouts (85% commission)
// Customer checkout, refunds, transfers
// =====================================================

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLATFORM_FEE_PERCENT = 15 // 85% to captain, 15% platform fee

// =====================================================
// CREATE CAPTAIN STRIPE ACCOUNT
// =====================================================

export async function createCaptainStripeAccount(captainId: string, email: string) {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    })

    // Save Stripe account ID to database
    await supabase
      .from('captains')
      .update({ stripe_account_id: account.id })
      .eq('id', captainId)

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/captain/stripe/reauth`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/captain/dashboard`,
      type: 'account_onboarding',
    })

    return { success: true, onboardingUrl: accountLink.url, accountId: account.id }
  } catch (error: any) {
    console.error('Error creating Stripe account:', error)
    return { success: false, error: error.message }
  }
}

// =====================================================
// CREATE BOOKING CHECKOUT SESSION
// =====================================================

export async function createBookingCheckout(bookingId: string) {
  try {
    // Get booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        charters (
          title,
          captain_id
        ),
        captains (
          stripe_account_id,
          commission_rate
        )
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) throw new Error('Booking not found')
    if (!booking.captains.stripe_account_id) {
      throw new Error('Captain has not set up payments')
    }

    const totalAmount = Math.round(booking.total_price * 100) // Convert to cents
    const platformFee = Math.round(totalAmount * (booking.captains.commission_rate / 100))
    const captainAmount = totalAmount - platformFee

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: booking.charters.title,
              description: `Charter trip on ${new Date(booking.trip_date).toLocaleDateString()}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: booking.captains.stripe_account_id,
        },
        metadata: {
          booking_id: bookingId,
          captain_id: booking.charters.captain_id,
          platform_fee: platformFee.toString(),
          captain_amount: captainAmount.toString(),
        },
      },
      customer_email: booking.users?.email,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/cancel`,
      metadata: {
        booking_id: bookingId,
      },
    })

    // Update booking with payment intent
    await supabase
      .from('bookings')
      .update({ payment_intent_id: session.payment_intent as string })
      .eq('id', bookingId)

    return { success: true, sessionId: session.id, url: session.url }
  } catch (error: any) {
    console.error('Error creating checkout:', error)
    return { success: false, error: error.message }
  }
}

// =====================================================
// HANDLE STRIPE WEBHOOK
// =====================================================

export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Webhook error:', error)
    return { success: false, error: error.message }
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id
  if (!bookingId) return

  await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      deposit_paid: session.amount_total! / 100,
      stripe_charge_id: session.payment_intent as string,
    })
    .eq('id', bookingId)

  // Send confirmation email
  // Award points
  // Create notification
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.booking_id
  if (!bookingId) return

  // Log transaction
  await supabase.from('transactions').insert({
    booking_id: bookingId,
    amount: paymentIntent.amount / 100,
    transaction_type: 'payment',
    stripe_payment_intent_id: paymentIntent.id,
    status: 'succeeded',
    fee_amount: (paymentIntent.application_fee_amount || 0) / 100,
    net_amount: ((paymentIntent.amount - (paymentIntent.application_fee_amount || 0)) / 100),
  })
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.booking_id
  if (!bookingId) return

  await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  // Send failure notification
}

async function handleAccountUpdated(account: Stripe.Account) {
  const { data: captain } = await supabase
    .from('captains')
    .select('id')
    .eq('stripe_account_id', account.id)
    .single()

  if (!captain) return

  const onboardingComplete = account.charges_enabled && account.payouts_enabled

  await supabase
    .from('captains')
    .update({ stripe_onboarding_complete: onboardingComplete })
    .eq('id', captain.id)
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  // Log captain payout
  await supabase.from('transactions').insert({
    captain_id: transfer.destination,
    amount: transfer.amount / 100,
    transaction_type: 'payout',
    stripe_transfer_id: transfer.id,
    status: 'succeeded',
  })
}

// =====================================================
// REFUND BOOKING
// =====================================================

export async function refundBooking(bookingId: string, amount?: number) {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('payment_intent_id, total_price')
      .eq('id', bookingId)
      .single()

    if (!booking?.payment_intent_id) {
      throw new Error('No payment to refund')
    }

    const refundAmount = amount ? Math.round(amount * 100) : undefined

    const refund = await stripe.refunds.create({
      payment_intent: booking.payment_intent_id,
      amount: refundAmount,
      metadata: { booking_id: bookingId },
    })

    await supabase
      .from('bookings')
      .update({ status: 'refunded' })
      .eq('id', bookingId)

    await supabase.from('transactions').insert({
      booking_id: bookingId,
      amount: -(refund.amount / 100),
      transaction_type: 'refund',
      stripe_charge_id: refund.id,
      status: 'succeeded',
    })

    return { success: true, refund }
  } catch (error: any) {
    console.error('Refund error:', error)
    return { success: false, error: error.message }
  }
}

// =====================================================
// GET CAPTAIN BALANCE
// =====================================================

export async function getCaptainBalance(stripeAccountId: string) {
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: stripeAccountId,
    })

    return {
      success: true,
      available: balance.available[0]?.amount / 100 || 0,
      pending: balance.pending[0]?.amount / 100 || 0,
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export { stripe }
