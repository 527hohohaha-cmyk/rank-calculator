interface WarningBoxProps {
  errors: string[];
  warnings: string[];
}

export function WarningBox({ errors, warnings }: WarningBoxProps) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <section className="notice-stack" aria-label="오류와 경고">
      {errors.length > 0 && (
        <div className="notice error">
          <h2>입력 오류</h2>
          <ul>
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="notice warning">
          <h2>주의사항</h2>
          <ul>
            {warnings.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
