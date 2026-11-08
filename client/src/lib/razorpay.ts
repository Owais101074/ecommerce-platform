const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

let loader: Promise<boolean> | null = null;

export function loadRazorpayCheckout(): Promise<boolean> {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (loader) {
    return loader;
  }

  loader = new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      loader = null;
      script.remove();
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return loader;
}
