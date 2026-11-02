import Image from 'next/image';

export function PassTicket({
  size = 18,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  const height = Math.round(size * (283 / 328));
  return (
    <Image
      src="/icons/golden-pass-ticket.png"
      alt="PTN Premium Pass"
      width={size}
      height={height}
      className={`inline-block shrink-0 select-none object-contain ${className}`}
      style={{ verticalAlign: '-0.15em' }}
      unoptimized
    />
  );
}

export default PassTicket;

