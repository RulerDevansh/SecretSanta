import { useEffect, useRef } from 'react';

const GoogleLoginButton = ({ onCredential, disabled }) => {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current || disabled) {
      return;
    }

    let script;

    const initialize = () => {
      if (!window.google || !window.google.accounts) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => credential && onCredential(credential),
        auto_select: false,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'filled',
        shape: 'pill',
        width: 260,
        size: 'large',
      });
    };

    if (window.google && window.google.accounts) {
      initialize();
    } else {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initialize;
      document.body.appendChild(script);
    }

    return () => {
      if (script) {
        document.body.removeChild(script);
      }
      window.google?.accounts.id.cancel();
    };
  }, [clientId, onCredential, disabled]);

  if (!clientId) {
    return <p className="text-center text-sm text-red-600">Google OAuth is not configured.</p>;
  }

  return <div ref={buttonRef} className="flex justify-center" />;
};

export default GoogleLoginButton;
