import React from "react";

interface ILoadingScreenProps {
  className?: string;
}

const LoadingScreen = ({ className = "" }: ILoadingScreenProps) => (
  <div className={`cdp-loading-screen ${className}`.trim()} role="status" aria-live="polite">
    <div className="cdp-loading-content">
      <div className="cdp-loading-clock" aria-hidden="true">
        <div className="cdp-loading-hour" />
        <div className="cdp-loading-minute" />
      </div>
      <div className="cdp-loading-message">Please wait while we retrieve your information.</div>
    </div>
    <div className="cdp-loading-footer">&copy; 2020. All Rights Reserved. Federally Insured by NCUA.</div>
  </div>
);

export default LoadingScreen;
