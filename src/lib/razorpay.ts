import { Platform } from 'react-native';

export const RAZORPAY_KEY_ID =
  process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ||
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
  'rzp_live_TQMdj9APTi1kqE';

export const RAZORPAY_KEY_SECRET =
  process.env.EXPO_PUBLIC_RAZORPAY_KEY_SECRET ||
  process.env.RAZORPAY_KEY_SECRET ||
  'a0Ml0dwic3Sb70dEEeMafwuj';

function toBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (
    let block = 0, charCode, i = 0, map = chars;
    str.charAt(i | 0) || (map = '=', i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));
    block = (block << 8) | charCode;
  }
  return output;
}

/**
 * Create a live Razorpay Payment Link for Mobile In-App Checkout
 */
export async function createRazorpayPaymentLink(options: {
  amount: number; // in INR e.g. 29 or 199
  planName: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}): Promise<{ id: string; short_url: string } | null> {
  try {
    const authHeader = `Basic ${toBase64(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(options.amount * 100), // in paise
        currency: 'INR',
        description: `Rupeo Pro - ${options.planName}`,
        customer: {
          name: options.userName || 'Rupeo User',
          email: options.userEmail || undefined,
          contact: options.userPhone || undefined,
        },
        notify: {
          sms: false,
          email: Boolean(options.userEmail),
          whatsapp: false,
        },
        reminder_enable: false,
        callback_url: 'https://paisewaise-e545e.web.app/payment-success',
        callback_method: 'get',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Razorpay create payment link error:', errText);
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      short_url: data.short_url,
    };
  } catch (err) {
    console.error('createRazorpayPaymentLink exception:', err);
    return null;
  }
}

/**
 * Verify if the Razorpay Payment Link was actually paid
 */
export async function verifyRazorpayPaymentLink(paymentLinkId: string): Promise<{
  paid: boolean;
  paymentId?: string;
  status: string;
}> {
  try {
    const authHeader = `Basic ${toBase64(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
    const response = await fetch(`https://api.razorpay.com/v1/payment_links/${paymentLinkId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      return { paid: false, status: 'error' };
    }

    const data = await response.json();
    const isPaid = data.status === 'paid';

    let paymentId = paymentLinkId;
    if (data.payments && Array.isArray(data.payments) && data.payments.length > 0) {
      paymentId = data.payments[0].payment_id || paymentLinkId;
    }

    return {
      paid: isPaid,
      paymentId,
      status: data.status,
    };
  } catch (err) {
    console.error('verifyRazorpayPaymentLink exception:', err);
    return { paid: false, status: 'exception' };
  }
}

export interface RazorpayOptions {
  amount: number; // in INR (e.g. 499)
  planName: string; // e.g. "Lifetime VIP"
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
}

/**
 * Load Razorpay Checkout Script on Web
 */
export function loadRazorpayWebScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Generate Razorpay Checkout HTML for In-App Mobile Checkout
 */
export function generateRazorpayHtml(options: {
  keyId: string;
  amount: number; // in paise
  planName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
}): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>Rupeo Pro Checkout</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #0F0F11;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        color: #ffffff;
      }
      .loader-box {
        text-align: center;
        padding: 24px;
      }
      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(255, 215, 64, 0.2);
        border-top-color: #FFD740;
        border-radius: 50%;
        animation: spin 0.9s linear infinite;
        margin: 0 auto 16px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      h2 {
        font-size: 18px;
        font-weight: 800;
        margin: 0 0 8px;
        color: #ffffff;
      }
      p {
        font-size: 13px;
        color: #94A3B8;
        margin: 0;
      }
    </style>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body>
    <div class="loader-box">
      <div class="spinner"></div>
      <h2>Opening Razorpay Checkout...</h2>
      <p>Please complete your payment securely.</p>
    </div>

    <script>
      function startRazorpay() {
        var options = {
          "key": "${options.keyId}",
          "amount": "${options.amount}",
          "currency": "INR",
          "name": "Rupeo Pro",
          "description": "Unlock ${options.planName} (Ad-Free)",
          "image": "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Money%20Bag.png",
          "prefill": {
            "name": "${options.userName || 'Rupeo User'}",
            "email": "${options.userEmail || ''}",
            "contact": "${options.userPhone || ''}"
          },
          "theme": {
            "color": "#0F0F11"
          },
          "modal": {
            "ondismiss": function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'dismiss' }));
              }
            }
          },
          "handler": function (response) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'success',
                payment_id: response.razorpay_payment_id
              }));
            }
          }
        };

        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'failed',
              error: response.error.description
            }));
          }
        });
        rzp.open();
      }

      window.onload = function() {
        setTimeout(startRazorpay, 300);
      };
    </script>
  </body>
</html>
  `;
}
