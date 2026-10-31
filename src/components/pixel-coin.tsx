import Image from 'next/image';

export function PixelCoin({
  size = 18,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/icons/coin-pixel-128.png"
      alt="Coin"
      width={size}
      height={size}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ imageRendering: 'pixelated', verticalAlign: '-0.15em' }}
      unoptimized
    />
  );
}

export default PixelCoin;
