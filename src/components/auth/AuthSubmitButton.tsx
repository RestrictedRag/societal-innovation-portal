interface AuthSubmitButtonProps {
  isLoading: boolean;
  loadingText: string;
  text: string;
  className?: string;
}

export function AuthSubmitButton({
  isLoading,
  loadingText,
  text,
  className = '',
}: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={[
        'flex w-full items-center justify-center rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70',
        className,
      ].join(' ')}
    >
      {isLoading ? loadingText : text}
    </button>
  );
}
