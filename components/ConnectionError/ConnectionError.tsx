"use client";

import styles from "./ConnectionError.module.css";

type ConnectionErrorProps = {
  message: string;
};

const ConnectionError = ({ message }: ConnectionErrorProps) => {
  const handleRetry = () => {
    window.location.href = "/api/truelayer/connect";
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>Connection failed</h1>
        <p>{message}</p>
        <button type="button" onClick={handleRetry}>
          Retry
        </button>
      </div>
    </div>
  );
};

export default ConnectionError;
