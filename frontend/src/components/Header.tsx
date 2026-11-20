import type { FC } from 'react';

type HeaderProps = {
  logoUrl: string;
  restaurantName: string;
};

export const Header: FC<HeaderProps> = ({ logoUrl, restaurantName }) => {
  return (
    <header className="flex flex-col items-center text-center mb-7">
      <div className="relative w-20 h-20 mb-3 rounded-full overflow-hidden p-0.5 bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-xl border border-zinc-700/60">
        <img
          alt={`${restaurantName} logo`}
          className="w-full h-full object-cover rounded-full"
          src={logoUrl}
        />
      </div>

      <h1 className="font-headline text-4xl sm:text-5xl text-white font-normal italic mb-3">
        {restaurantName}
      </h1>

      <div className="h-0.5 w-12 bg-wine rounded-full" />
    </header>
  );
};